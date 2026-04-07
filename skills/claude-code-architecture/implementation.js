#!/usr/bin/env node
/**
 * Claude Code 架构优化 - 实现脚本
 */

// Memory 硬截断保护
const MEMORY_CONSTANTS = {
  MAX_ENTRYPOINT_LINES: 200,
  MAX_ENTRYPOINT_BYTES: 25_000,
};

function truncateEntrypointContent(raw) {
  const lines = raw.split('\n');
  const wasLineTruncated = lines.length > MEMORY_CONSTANTS.MAX_ENTRYPOINT_LINES;
  
  if (wasLineTruncated) {
    const truncated = lines.slice(0, MEMORY_CONSTANTS.MAX_ENTRYPOINT_LINES);
    truncated.push('\n... (truncated)');
    return {
      content: truncated.join('\n'),
      lineCount: MEMORY_CONSTANTS.MAX_ENTRYPOINT_LINES,
      byteCount: Buffer.byteLength(truncated.join('\n'), 'utf8'),
      wasLineTruncated: true,
    };
  }
  
  const byteLength = Buffer.byteLength(raw, 'utf8');
  if (byteLength > MEMORY_CONSTANTS.MAX_ENTRYPOINT_BYTES) {
    let truncated = raw;
    while (Buffer.byteLength(truncated, 'utf8') > MEMORY_CONSTANTS.MAX_ENTRYPOINT_BYTES) {
      truncated = truncated.slice(0, -100);
    }
    truncated += '\n... (truncated)';
    return {
      content: truncated,
      lineCount: truncated.split('\n').length,
      byteCount: Buffer.byteLength(truncated, 'utf8'),
      wasLineTruncated: false,
    };
  }
  
  return {
    content: raw,
    lineCount: lines.length,
    byteCount: byteLength,
    wasLineTruncated: false,
  };
}

// 工具并发调度
function isToolConcurrencySafe(toolName) {
  const safeTools = ['read', 'fetch', 'search', 'list', 'get'];
  const unsafeTools = ['write', 'edit', 'exec', 'delete', 'create'];
  const baseName = toolName.split('__').pop() || toolName;
  if (safeTools.some(t => baseName.includes(t))) return true;
  if (unsafeTools.some(t => baseName.includes(t))) return false;
  return false;
}

function partitionToolCalls(toolCalls) {
  return toolCalls.reduce((acc, toolCall) => {
    const isConcurrencySafe = isToolConcurrencySafe(toolCall.name);
    if (isConcurrencySafe && acc.length > 0 && acc[acc.length - 1].isConcurrencySafe) {
      acc[acc.length - 1].blocks.push(toolCall);
    } else {
      acc.push({ isConcurrencySafe, blocks: [toolCall] });
    }
    return acc;
  }, []);
}

// MCP 工具命名
function buildMcpToolName(serverName, toolName) {
  return `mcp__${serverName}__${toolName}`;
}

function parseMcpToolName(fullName) {
  const match = fullName.match(/^mcp__(.+?)__(.+)$/);
  if (!match) return null;
  return { serverName: match[1], toolName: match[2] };
}

// Trust 分离
const SAFE_ENVIRONMENT_VARIABLES = [
  'HOME', 'USER', 'PATH', 'SHELL', 'TERM', 'LANG', 'LC_ALL', 'EDITOR', 'PWD',
];

let trustContext = { isTrusted: false, trustSource: null };

function establishTrust(source) {
  trustContext = { isTrusted: true, trustSource: source };
  return trustContext;
}

// Query 优化
function shouldCompact(messages, maxTokens = 8000) {
  return messages.length * 4 > maxTokens * 0.8;
}

function compactMessages(messages) {
  const systemMessages = messages.filter(m => m.role === 'system');
  const recentMessages = messages.slice(-10);
  const middleMessages = messages.slice(systemMessages.length, -10);
  if (middleMessages.length === 0) return messages;
  
  const summary = `Summary of ${middleMessages.length} messages...`;
  return [
    ...systemMessages,
    { role: 'system', content: `[Summary]: ${summary}` },
    ...recentMessages,
  ];
}

// ==================== Session Storage ====================

// Append-only JSONL 存储
class SessionStorage {
  constructor(sessionDir) {
    this.sessionDir = sessionDir;
    this.writeQueues = new Map();
    this.messageSet = new Set();
  }

  async appendEntry(entry, sessionId) {
    const sessionFile = this.getTranscriptPath(sessionId);
    
    // 分流处理
    if (entry.isSidechain && entry.agentId) {
      const agentFile = this.getAgentTranscriptPath(entry.agentId);
      await this.enqueueWrite(agentFile, entry);
      return;
    }

    // 主链去重
    if (!this.messageSet.has(entry.uuid)) {
      await this.enqueueWrite(sessionFile, entry);
      this.messageSet.add(entry.uuid);
    }
  }

  async enqueueWrite(filePath, entry) {
    if (!this.writeQueues.has(filePath)) {
      this.writeQueues.set(filePath, []);
    }
    this.writeQueues.get(filePath).push({ entry });
    
    // 批量flush
    setTimeout(() => this.drainWriteQueue(), 100);
  }

  async drainWriteQueue() {
    for (const [filePath, queue] of this.writeQueues) {
      const batch = queue.splice(0);
      const content = batch.map(({ entry }) => JSON.stringify(entry) + '\n').join('');
      await this.appendToFile(filePath, content);
    }
  }

  async appendToFile(filePath, data) {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      await fs.appendFile(filePath, data, { mode: 0o600 });
    } catch {
      await fs.mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
      await fs.appendFile(filePath, data, { mode: 0o600 });
    }
  }

  getTranscriptPath(sessionId) {
    return `${this.sessionDir}/${sessionId}.jsonl`;
  }

  getAgentTranscriptPath(agentId) {
    return `${this.sessionDir}/subagents/agent-${agentId}.jsonl`;
  }
}

// ==================== Context Compact ====================

const COMPACT_CONSTANTS = {
  MAX_OUTPUT_TOKENS_FOR_SUMMARY: 20_000,
  AUTOCOMPACT_BUFFER_TOKENS: 13_000,
  MAX_CONSECUTIVE_FAILURES: 3,
  CAPPED_DEFAULT_MAX_TOKENS: 8_000,
  ESCALATED_MAX_TOKENS: 64_000,
};

function getEffectiveContextWindowSize(model, totalWindow = 200000) {
  return totalWindow - COMPACT_CONSTANTS.MAX_OUTPUT_TOKENS_FOR_SUMMARY;
}

function shouldAutoCompact(messages, model, currentTokens) {
  const effectiveWindow = getEffectiveContextWindowSize(model);
  const threshold = effectiveWindow - COMPACT_CONSTANTS.AUTOCOMPACT_BUFFER_TOKENS;
  return currentTokens > threshold;
}

// ==================== Prompt Section Cache ====================

class PromptSectionCache {
  constructor() {
    this.cache = new Map();
  }

  get(name) {
    return this.cache.get(name);
  }

  set(name, value) {
    this.cache.set(name, value);
  }

  has(name) {
    return this.cache.has(name);
  }

  clear() {
    this.cache.clear();
  }
}

// 创建全局缓存实例
const globalSectionCache = new PromptSectionCache();

function systemPromptSection(name, compute) {
  return { name, compute, cacheBreak: false };
}

function DANGEROUS_uncachedSystemPromptSection(name, compute, reason) {
  return { name, compute, cacheBreak: true };
}

async function resolveSystemPromptSections(sections) {
  const cache = globalSectionCache;
  
  return Promise.all(
    sections.map(async (section) => {
      if (!section.cacheBreak && cache.has(section.name)) {
        return cache.get(section.name);
      }
      const value = await section.compute();
      cache.set(section.name, value);
      return value;
    })
  );
}

// ==================== Sandbox Config ====================

function convertToSandboxRuntimeConfig(settings) {
  const permissions = settings.permissions || {};
  
  const config = {
    allowedDomains: [],
    deniedDomains: [],
    allowWrite: ['.', '/tmp'],
    denyWrite: [],
    denyRead: [],
    allowRead: [],
  };

  // 从permissions提取规则
  for (const ruleString of permissions.allow || []) {
    if (ruleString.startsWith('domain:')) {
      config.allowedDomains.push(ruleString.substring(7));
    }
  }

  // 内置保护
  config.denyWrite.push('.claude/settings.json');
  config.denyWrite.push('.claude/skills');

  return config;
}

// ==================== Multi-Agent Backend ====================

const BACKEND_REGISTRY = {
  'in-process': class InProcessBackend {
    spawn(config) {
      const agentId = `agent-${Date.now()}`;
      return {
        id: agentId,
        send: async (message) => {
          // 使用AsyncLocalStorage隔离上下文
          console.log(`[${agentId}] Received: ${message}`);
        },
        terminate: async () => {
          console.log(`[${agentId}] Terminated`);
        },
      };
    }
  },
  'tmux': class TmuxBackend {
    spawn(config) {
      // tmux实现
      return { id: `tmux-${Date.now()}` };
    }
  },
};

function spawnTeammate(config) {
  const Backend = BACKEND_REGISTRY[config.backendType];
  if (!Backend) {
    throw new Error(`Unknown backend: ${config.backendType}`);
  }
  return new Backend().spawn(config);
}

// ==================== MCP Tool Naming ====================

function buildMcpToolName(serverName, toolName) {
  return `mcp__${serverName}__${toolName}`;
}

function parseMcpToolName(fullName) {
  const match = fullName.match(/^mcp__(.+?)__(.+)$/);
  if (!match) return null;
  return { serverName: match[1], toolName: match[2] };
}

// ==================== Memory Management ====================

const MEMORY_CONSTANTS = {
  MAX_ENTRYPOINT_LINES: 200,
  MAX_ENTRYPOINT_BYTES: 25_000,
  MAX_TOPIC_FILE_LINES: 500,
  MAX_TOPIC_FILE_BYTES: 100_000,
};

function truncateEntrypointContent(raw) {
  const lines = raw.split('\n');
  const wasLineTruncated = lines.length > MEMORY_CONSTANTS.MAX_ENTRYPOINT_LINES;
  
  if (wasLineTruncated) {
    const truncated = lines.slice(0, MEMORY_CONSTANTS.MAX_ENTRYPOINT_LINES);
    truncated.push('\n... (truncated)');
    return {
      content: truncated.join('\n'),
      lineCount: MEMORY_CONSTANTS.MAX_ENTRYPOINT_LINES,
      byteCount: Buffer.byteLength(truncated.join('\n'), 'utf8'),
      wasLineTruncated: true,
    };
  }
  
  const byteLength = Buffer.byteLength(raw, 'utf8');
  if (byteLength > MEMORY_CONSTANTS.MAX_ENTRYPOINT_BYTES) {
    let truncated = raw;
    while (Buffer.byteLength(truncated, 'utf8') > MEMORY_CONSTANTS.MAX_ENTRYPOINT_BYTES) {
      truncated = truncated.slice(0, -100);
    }
    truncated += '\n... (truncated)';
    return {
      content: truncated,
      lineCount: truncated.split('\n').length,
      byteCount: Buffer.byteLength(truncated, 'utf8'),
      wasLineTruncated: false,
    };
  }
  
  return {
    content: raw,
    lineCount: lines.length,
    byteCount: byteLength,
    wasLineTruncated: false,
  };
}

//
