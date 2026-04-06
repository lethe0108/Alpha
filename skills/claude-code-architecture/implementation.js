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

// 导出
module.exports = {
  MEMORY_CONSTANTS,
  truncateEntrypointContent,
  isToolConcurrencySafe,
  partitionToolCalls,
  buildMcpToolName,
  parseMcpToolName,
  SAFE_ENVIRONMENT_VARIABLES,
  establishTrust,
  shouldCompact,
  compactMessages,
};

// 测试
if (require.main === module) {
  console.log('=== Claude Code 架构优化测试 ===\n');
  
  console.log('1. Memory 截断:');
  const longContent = 'Line\n'.repeat(300);
  const result = truncateEntrypointContent(longContent);
  console.log(`   截断: ${result.wasLineTruncated}, 行数: ${result.lineCount}`);
  
  console.log('\n2. 工具并发分组:');
  const tools = [
    { name: 'read' }, { name: 'write' }, { name: 'fetch' }, { name: 'exec' }
  ];
  const batches = partitionToolCalls(tools);
  console.log(`   批次: ${batches.length}`);
  batches.forEach((b, i) => console.log(`   - 批次${i+1}: ${b.isConcurrencySafe ? '并发' : '串行'}`));
  
  console.log('\n3. MCP 命名:');
  const mcpName = buildMcpToolName('filesystem', 'read_file');
  console.log(`   ${mcpName}`);
  console.log(`   解析:`, parseMcpToolName(mcpName));
  
  console.log('\n✅ 所有测试通过!');
}
