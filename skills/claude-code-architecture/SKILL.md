---
name: claude-code-architecture
scope: global
description: Claude Code 架构优化技能。基于 Claude Code 泄露源码的深度分析，提取核心架构设计模式和最佳实践，用于优化 OpenClaw 系统。全局技能。
---

# Claude Code 架构优化技能

**技能ID**: `claude-code-architecture`
**版本**: 1.2.0
**创建时间**: 2026-04-07
**状态**: 全局可用 ✅

---

## 1. 技能概述

本技能基于 Claude Code 泄露源码的深度分析，提取核心架构设计模式和最佳实践，用于优化 OpenClaw 系统。

**核心原则**:
- 工具并发调度优化
- Memory 硬截断保护
- Trust 分离安全机制
- Query 主循环重构
- MCP 工具命名规范
- 多 Agent Swarm 架构

---

## 2. 工具并发调度

### 2.1 OpenClaw 适配指南

**⚠️ 重要**: OpenClaw 与 Claude Code 架构不同。Claude Code 有内置的工具并发调度机制，而 OpenClaw 使用技能系统指导 Agent 智能并发。

**Agent 并发决策指南**:

当需要执行多个工具时，Agent 应根据以下规则判断是否可以并发执行：

| 并发安全 | 工具类型 | 示例 |
|----------|----------|------|
| ✅ 安全 | 只读操作 | read, web_search, web_fetch, memory_search, list, get, info |
| ✅ 安全 | 查询类 | search, find, query, lookup |
| ⚠️ 条件安全 | 文件操作 | 不同文件的 write/edit 可并发，同一文件必须串行 |
| ❌ 不安全 | 修改操作 | write, edit, delete, create, exec, message |
| ❌ 不安全 | 状态变更 | 任何改变系统状态的操作 |

**并发执行策略**:

```typescript
// Agent 决策流程
function shouldRunConcurrently(tools) {
  // 1. 检查所有工具是否都是只读的
  const allReadOnly = tools.every(t => isReadOnlyTool(t));
  if (allReadOnly) return true;
  
  // 2. 检查是否有文件冲突
  const filePaths = tools.map(t => t.params?.path).filter(Boolean);
  const uniquePaths = new Set(filePaths);
  if (filePaths.length !== uniquePaths.size) return false; // 有冲突
  
  // 3. 默认串行
  return false;
}
```

**最佳实践**:

1. **批量读取**: 多个文件的 read 操作可以并发
2. **搜索聚合**: 多个 web_search 可以并发执行
3. **写保护**: 任何写入操作都串行执行
4. **先读后写**: 先并发读取所有需要的数据，再串行写入

### 2.2 Claude Code 原始模式（参考）

```typescript
// 按并发安全性分组执行
function partitionToolCalls(toolUseMessages: ToolUseBlock[], ctx: ToolUseContext): Batch[] {
  return toolUseMessages.reduce((acc: Batch[], toolUse) => {
    const tool = findToolByName(ctx.options.tools, toolUse.name)
    const isConcurrencySafe = Boolean(tool?.isConcurrencySafe(parsedInput.data))
    
    // 若上一批次也是并发安全的，就合入同一批次
    if (isConcurrencySafe && acc[acc.length - 1]?.isConcurrencySafe) {
      acc[acc.length - 1]!.blocks.push(toolUse)
    } else {
      acc.push({ isConcurrencySafe, blocks: [toolUse] })
    }
    return acc
  }, [])
}
```

### 2.2 执行策略

```typescript
async function* runTools(toolUseMessages, canUseTool, toolUseContext) {
  for (const { isConcurrencySafe, blocks } of partitionToolCalls(toolUseMessages, toolUseContext)) {
    if (isConcurrencySafe) {
      // 并发批次：先收集 contextModifier，批次完再按序应用
      for await (const update of runToolsConcurrently(blocks, ...)) { 
        yield update 
      }
    } else {
      // 串行批次：每个工具必须等上一个完成
      for await (const update of runToolsSerially(blocks, ...)) { 
        yield update 
      }
    }
  }
}
```

### 2.3 工具标记规范

每个工具应实现 `isConcurrencySafe` 方法：

```typescript
const tools = {
  read: {
    isConcurrencySafe: () => true,  // 读取操作可并发
  },
  write: {
    isConcurrencySafe: (input) => {
      // 检查是否操作同一文件
      return !isFileLocked(input.file_path)
    },
  },
  exec: {
    isConcurrencySafe: () => false,  // 执行命令串行
  }
}
```

---

## 3. Memory 硬截断保护

### 3.1 核心常量

```typescript
const MEMORY_CONSTANTS = {
  MAX_ENTRYPOINT_LINES: 200,
  MAX_ENTRYPOINT_BYTES: 25_000,
  MAX_TOPIC_FILE_LINES: 500,
  MAX_TOPIC_FILE_BYTES: 100_000,
}
```

### 3.2 截断实现

```typescript
function truncateEntrypointContent(raw: string): TruncatedContent {
  const lines = raw.split('\n')
  const wasLineTruncated = lines.length > MAX_ENTRYPOINT_LINES
  
  if (wasLineTruncated) {
    const truncated = lines.slice(0, MAX_ENTRYPOINT_LINES)
    truncated.push('\n... (truncated)')
    return {
      content: truncated.join('\n'),
      lineCount: MAX_ENTRYPOINT_LINES,
      byteCount: Buffer.byteLength(truncated.join('\n'), 'utf8'),
      wasLineTruncated: true,
    }
  }
  
  // 字节截断检查
  const byteLength = Buffer.byteLength(raw, 'utf8')
  if (byteLength > MAX_ENTRYPOINT_BYTES) {
    let truncated = raw
    while (Buffer.byteLength(truncated, 'utf8') > MAX_ENTRYPOINT_BYTES) {
      truncated = truncated.slice(0, -100)
    }
    truncated += '\n... (truncated)'
    return {
      content: truncated,
      lineCount: truncated.split('\n').length,
      byteCount: Buffer.byteLength(truncated, 'utf8'),
      wasLineTruncated: false,
    }
  }
  
  return {
    content: raw,
    lineCount: lines.length,
    byteCount: byteLength,
    wasLineTruncated: false,
  }
}
```

### 3.3 Memory Prompt 构建

```typescript
function buildMemoryPrompt(params: {
  displayName: string
  memoryDir: string
  extraGuidelines?: string[]
}): string {
  const entrypoint = path.join(params.memoryDir, 'MEMORY.md')
  
  // 同步读取（某些调用来自同步路径）
  let entrypointContent = ''
  try {
    entrypointContent = fs.readFileSync(entrypoint, { encoding: 'utf-8' })
  } catch { /* 文件不存在时静默忽略 */ }
  
  const lines = buildMemoryLines(params.displayName, params.memoryDir, params.extraGuidelines)
  
  if (entrypointContent.trim()) {
    const t = truncateEntrypointContent(entrypointContent)
    lines.push(`## MEMORY.md`, '', t.content)
  } else {
    lines.push(
      `## MEMORY.md`, '',
      `Your MEMORY.md is currently empty. When you save new memories, they will appear here.`,
    )
  }
  return lines.join('\n')
}
```

---

## 4. Trust 分离安全机制

### 4.1 初始化阶段分离

```typescript
// init.ts - Trust 前只应用安全的环境变量
async function init(argv: ParsedArgs) {
  applySafeEnvironmentVariables()    // 白名单 env
  initializeCertificates()           // 证书与 HTTPS 代理
  initializeHttpAgent()              // HTTP agent 配置
  initTelemetrySkeleton()            // 注册 telemetry sink，不发事件
}

// Trust 后才应用全部
async function initializeTelemetryAfterTrust() {
  applyFullEnvironmentVariables()    // 应用所有 env
  attachAnalyticsSink()              // 开始处理 telemetry 事件队列
}
```

### 4.2 安全环境变量白名单

```typescript
const SAFE_ENVIRONMENT_VARIABLES = [
  'HOME',
  'USER',
  'PATH',
  'SHELL',
  'TERM',
  'LANG',
  'LC_ALL',
  'EDITOR',
  'PWD',
  // 添加其他安全的变量
]

function applySafeEnvironmentVariables() {
  const safeEnv = {}
  for (const key of SAFE_ENVIRONMENT_VARIABLES) {
    if (process.env[key] !== undefined) {
      safeEnv[key] = process.env[key]
    }
  }
  // 只应用白名单变量
  Object.assign(process.env, safeEnv)
}
```

### 4.3 Trust 检查机制

```typescript
interface TrustContext {
  isTrusted: boolean
  trustSource: 'manual' | 'config' | 'inherit'
  trustEstablishedAt: Date
}

function checkTrust(): TrustContext {
  // 检查配置文件签名
  // 检查环境变量来源
  // 检查启动参数
  return {
    isTrusted: /* 判断逻辑 */,
    trustSource: /* 来源 */,
    trustEstablishedAt: new Date(),
  }
}
```

---

## 5. Query 主循环重构

### 5.1 Generator 模式

```typescript
async function* query(
  userMessages: Message[],
  systemPrompt: SystemPrompt,
  toolUseContext: ToolUseContext,
  deps: QueryDeps,
): AsyncGenerator<StreamEvent, void> {
  let messages = userMessages
  
  while (true) {
    // 1. 组装 context（memory 注入发生在这里）
    const apiMessages = normalizeMessagesForAPI(messages)
    
    // 2. 调用 API，流式接收
    for await (const event of deps.claudeApi.stream(apiMessages, systemPrompt)) {
      yield event
    }
    
    // 3. 提取模型输出的 tool_use 列表
    const toolUseBlocks = extractToolUseBlocks(messages)
    if (toolUseBlocks.length === 0) break  // 无工具调用 -> 结束
    
    // 4. 执行工具（并发 / 串行由 partitionToolCalls 决定）
    const toolResults = []
    for await (const update of runTools(toolUseBlocks, ...)) {
      yield update  // 实时 yield 给 UI
      toolResults.push(update.message)
    }
    
    // 5. 把工具结果追加到 messages -> 进入下一轮
    messages = [...messages, ...toolResults]
    
    // 6. compact 检查、hook 执行
    await executePostSamplingHooks(messages, toolUseContext)
    if (shouldCompact(messages)) {
      await compact(messages, toolUseContext)
    }
  }
}
```

### 5.2 Compact 机制

```typescript
function shouldCompact(messages: Message[]): boolean {
  const tokenCount = estimateTokenCount(messages)
  const maxTokens = getMaxContextTokens()
  
  // 达到 80% 容量时触发 compact
  return tokenCount > maxTokens * 0.8
}

async function compact(messages: Message[], toolContext: ToolUseContext): Promise<Message[]> {
  // 1. 保留系统消息和最近的对话
  const systemMessages = messages.filter(m => m.role === 'system')
  const recentMessages = messages.slice(-10)  // 保留最近10条
  
  // 2. 中间部分生成摘要
  const middleMessages = messages.slice(systemMessages.length, -10)
  const summary = await generateSummary(middleMessages)
  
  // 3. 组装新消息列表
  return [
    ...systemMessages,
    { role: 'system', content: `[Previous conversation summary]: ${summary}` },
    ...recentMessages,
  ]
}
```

---

## 6. MCP 工具命名规范

### 6.1 命名规则

```typescript
function buildMcpToolName(serverName: string, toolName: string): string {
  return `mcp__${serverName}__${toolName}`
}

// 示例：
// mcp__filesystem__read_file
// mcp__filesystem__write_file
// mcp__puppeteer__screenshot
// mcp__github__create_issue
```

### 6.2 解析规则

```typescript
function parseMcpToolName(fullName: string): { serverName: string; toolName: string } | null {
  const match = fullName.match(/^mcp__(.+?)__(.+)$/)
  if (!match) return null
  return {
    serverName: match[1],
    toolName: match[2],
  }
}
```

---

## 7. 多 Agent Swarm 架构

### 7.1 Backend Registry

```typescript
const BACKEND_REGISTRY: Record<string, TeammateBackend> = {
  'in-process': InProcessBackend,
  'tmux':       TmuxBackend,
  'iterm2':     ITerm2PaneBackend,
}

function spawnTeammate(config: TeammateConfig): TeammateHandle {
  const Backend = BACKEND_REGISTRY[config.backendType]
  if (!Backend) {
    throw new Error(`Unknown backend type: ${config.backendType}`)
  }
  return new Backend(config).spawn()
}
```

### 7.2 Agent 配置

```typescript
interface TeammateConfig {
  backendType: 'in-process' | 'tmux' | 'iterm2'
  agentType: string
  systemPrompt: string
  tools: Tool[]
  env: Record<string, string>
}

interface TeammateHandle {
  id: string
  send(message: string): Promise<void>
  onMessage(callback: (msg: string) => void): void
  terminate(): Promise<void>
}
```

### 7.3 In-Process Backend

```typescript
class InProcessBackend implements TeammateBackend {
  private agent: Agent
  
  constructor(config: TeammateConfig) {
    this.agent = new Agent({
      systemPrompt: config.systemPrompt,
      tools: config.tools,
    })
  }
  
  spawn(): TeammateHandle {
    const id = generateId()
    
    return {
      id,
      send: async (message: string) => {
        await this.agent.query(message)
      },
      onMessage: (callback) => {
        this.agent.on('message', callback)
      },
      terminate: async () => {
        await this.agent.destroy()
      },
    }
  }
}
```

### 7.4 Tmux Backend

```typescript
class TmuxBackend implements TeammateBackend {
  constructor(private config: TeammateConfig) {}
  
  spawn(): TeammateHandle {
    const sessionName = `agent-${generateId()}`
    
    // 创建 tmux 会话
    execSync(`tmux new-session -d -s ${sessionName}`)
    
    // 在会话中启动 agent
    const command = buildAgentCommand(this.config)
    execSync(`tmux send-keys -t ${sessionName} '${command}' Enter`)
    
    return {
      id: sessionName,
      send: async (message: string) => {
        execSync(`tmux send-keys -t ${sessionName} '${escapeShell(message)}' Enter`)
      },
      onMessage: (callback) => {
        // 通过 tmux 捕获 pane 输出
        const tail = spawn('tmux', ['capture-pane', '-t', sessionName, '-p'])
        tail.stdout.on('data', callback)
      },
      terminate: async () => {
        execSync(`tmux kill-session -t ${sessionName}`)
      },
    }
  }
}
```

---

## 8. Session Storage 与恢复

### 8.1 存储结构

```typescript
interface SessionData {
  id: string
  createdAt: Date
  updatedAt: Date
  messages: Message[]
  systemPrompt: string
  toolUseContext: ToolUseContext
  memoryState: MemoryState
}

const SESSION_DIR = path.join(os.homedir(), '.claude', 'sessions')

async function saveSession(session: SessionData): Promise<void> {
  const sessionPath = path.join(SESSION_DIR, `${session.id}.json`)
  await fs.mkdir(SESSION_DIR, { recursive: true, mode: 0o700 })
  await fs.writeFile(sessionPath, JSON.stringify(session, null, 2), { mode: 0o600 })
}

async function loadSession(sessionId: string): Promise<SessionData | null> {
  const sessionPath = path.join(SESSION_DIR, `${sessionId}.json`)
  try {
    const data = await fs.readFile(sessionPath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return null
  }
}
```

### 8.2 会话恢复

```typescript
async function resumeSession(sessionId: string): Promise<Session> {
  const data = await loadSession(sessionId)
  if (!data) {
    throw new Error(`Session not found: ${sessionId}`)
  }
  
  // 恢复消息历史
  const messages = data.messages
  
  // 恢复 tool context
  const toolUseContext = data.toolUseContext
  
  // 恢复 memory 状态
  await restoreMemoryState(data.memoryState)
  
  return {
    id: sessionId,
    messages,
    systemPrompt: data.systemPrompt,
    toolUseContext,
    query: createQueryFunction(messages, data.systemPrompt, toolUseContext),
  }
}
```

---

## 9. 使用指南

### 9.1 何时使用本技能

**必须使用场景**:
1. 优化 OpenClaw 工具执行效率
2. 实现 Memory 硬截断保护
3. 设计 Trust 安全机制
4. 重构 Query 主循环
5. 规范 MCP 工具命名
6. 实现多 Agent Swarm

**参考场景**:
1. 设计新的 agent 架构
2. 优化 context 管理
3. 实现会话持久化
4. 设计权限系统

### 9.2 最佳实践

1. **工具并发**: 始终标记 `isConcurrencySafe`，默认串行
2. **Memory 截断**: 200行/25KB 是硬上限，不可突破
3. **Trust 分离**: 敏感操作必须在 trust 建立后执行
4. **Query 循环**: 使用 Generator 模式，支持流式输出
5. **MCP 命名**: 严格遵循 `mcp__server__tool` 格式
6. **Swarm 设计**: Backend 必须可插拔，支持多种运行时

### 9.3 常见陷阱

1. **并发安全**: 忘记检查文件锁，导致写入冲突
2. **Memory 溢出**: 未实现截断，导致 token 超限
3. **Trust 绕过**: 在 init 阶段使用敏感 env
4. **Query 阻塞**: 未使用 Generator，UI 卡顿
5. **MCP 冲突**: 命名不规范，工具覆盖
6. **Swarm 泄漏**: 未正确 terminate，资源泄漏

---

## 10. 深度架构分析

### 10.1 六层架构理解

```
CLI 引导层 → TUI/REPL 交互层 → Query/Agent 执行内核
→ Tool/Permission 层 → Memory/Persistence 层 → MCP/Remote/Swarm 扩展层
```

**关键设计原则**:
1. **多入口系统**: cli.tsx 快路径分流，main.tsx 总控编排
2. **分层解耦**: UI、执行内核、工具层、memory 层各自独立
3. **平台化设计**: 不只是聊天工具，而是本地 agent 平台

### 10.2 核心机制详解

#### 10.2.1 工具并发调度机制

**分批策略**:
```typescript
// 示例: [A(Read), B(Read), C(Write), D(Read)]
// 分批结果:
// 批次1: [A, B] - 并发处理
// 批次2: [C]   - 串行处理  
// 批次3: [D]   - 串行处理
```

**延迟应用 contextModifier**:
- 并发批次先收集所有 contextModifier
- 批次完成后按序应用
- 防止竞态污染

#### 10.2.2 Memory 多层架构

| 层级 | 作用域 | 存储位置 | 更新策略 |
|------|--------|----------|----------|
| Auto Memory | 用户/项目长期 | ~/.claude/memory/ | 后台提取 |
| Session Memory | 当前会话 | 会话目录 | 阈值触发 |
| Agent Memory | Agent类型专属 | agent-memory/ | Agent自维护 |
| Team Memory | 团队共享 | .claude/team/ | 同步机制 |

#### 10.2.3 会话持久化设计

**Append-only JSONL**:
- 主 transcript: `{sessionId}.jsonl`
- Sidechain: `subagents/agent-{agentId}.jsonl`
- 元数据尾部重挂: title/tag/mode

**恢复修复**:
- Progress桥接: 旧版progress链修复
- Snip移除: 重新接parentUuid
- Parallel tool result: 补兄弟节点

#### 10.2.4 Context Compact机制

**触发条件**:
- Token阈值: 上下文窗口 - 20K(summary预留) - 13K(缓冲)
- 熔断: 3次连续失败停止

**压缩流程**:
1. Strip images & attachments
2. Fork agent生成summary
3. PTL防御: 剥洋葱式重试
4. 状态补偿: file attachments + plans + skills

#### 10.2.5 Prompt缓存工程

**Section化设计**:
```typescript
// 静态段 (可缓存)
getSimpleIntroSection()
getSimpleSystemSection()
getActionsSection()

// 动态边界
SYSTEM_PROMPT_DYNAMIC_BOUNDARY

// 动态段 (可能变化)
systemPromptSection('memory', ...)
DANGEROUS_uncachedSystemPromptSection('mcp_instructions', ...)
```

**优先级覆盖**:
```
override > coordinator > agent > custom > default + append
```

#### 10.2.6 Sandbox安全架构

**四层结构**:
1. `shouldUseSandbox()` - 路由决策
2. `convertToSandboxRuntimeConfig()` - 配置翻译
3. `bashPermissions` - 权限检查
4. `Shell.ts` + `cleanupAfterCommand()` - 执行与清理

**逃逸防护**:
- Git bare repo清理
- Settings/skills目录保护
- 路径穿越检测

### 10.3 关键设计模式

#### 模式1: Fail-Closed默认策略
```typescript
const TOOL_DEFAULTS = {
  isConcurrencySafe: () => false,  // 默认不安全
  isReadOnly: () => false,         // 默认非只读
  isDestructive: () => false,
}
```

#### 模式2: 管线代理模式
```
模型输出 → 收集tool_use → 分批 → 执行 → 结果回流 → 下一轮
```

#### 模式3: 双轨通信
- Mailbox: 文件式异步通信
- Direct: 内存队列直接通信

#### 模式4: 状态机驱动
```
queued → executing → completed → yielded
```

## 11. 实现检查清单

### 11.1 工具并发调度

- [ ] 实现 `partitionToolCalls` 函数
- [ ] 为每个工具添加 `isConcurrencySafe` 方法
- [ ] 实现 `runToolsConcurrently` 和 `runToolsSerially`
- [ ] 添加并发安全测试

### 11.2 Memory 硬截断

- [ ] 定义 `MEMORY_CONSTANTS` 常量
- [ ] 实现 `truncateEntrypointContent` 函数
- [ ] 修改 `buildMemoryPrompt` 添加截断
- [ ] 添加截断日志和监控

### 11.3 Trust 分离

- [ ] 定义 `SAFE_ENVIRONMENT_VARIABLES` 白名单
- [ ] 实现 `applySafeEnvironmentVariables`
- [ ] 实现 `initializeTelemetryAfterTrust`
- [ ] 添加 trust 状态检查

### 11.4 Query 重构

- [ ] 将 query 改为 Generator 函数
- [ ] 实现 `shouldCompact` 和 `compact`
- [ ] 添加 `executePostSamplingHooks`
- [ ] 测试流式输出

### 11.5 MCP 命名

- [ ] 实现 `buildMcpToolName`
- [ ] 实现 `parseMcpToolName`
- [ ] 更新所有 MCP 工具名称
- [ ] 添加命名验证

### 11.6 Swarm 架构

- [ ] 定义 `BACKEND_REGISTRY`
- [ ] 实现 `InProcessBackend`
- [ ] 实现 `TmuxBackend`（可选）
- [ ] 添加 Backend 接口测试

### 11.7 会话持久化

- [ ] 实现 append-only JSONL写入
- [ ] 添加 metadata尾部重挂
- [ ] 实现 resume恢复修复
- [ ] 添加 sidechain支持

### 11.8 Context Compact

- [ ] 实现 token阈值监控
- [ ] 添加 compact熔断机制
- [ ] 实现 PTL防御
- [ ] 添加状态补偿

### 11.9 Prompt缓存

- [ ] 实现 section化设计
- [ ] 添加 DYNAMIC_BOUNDARY
- [ ] 实现 section缓存
- [ ] 添加优先级覆盖

---

## 11. 相关资源

- **源码分析仓库**: https://github.com/liuup/claude-code-analysis
- **Claude Code 官方**: https://claude.ai/code
- **MCP 协议**: https://modelcontextprotocol.io
- **OpenClaw 文档**: https://docs.openclaw.ai

---

## 12. 相关资源

- **源码分析仓库**: https://github.com/liuup/claude-code-analysis
- **Claude Code 官方**: https://claude.ai/code
- **MCP 协议**: https://modelcontextprotocol.io
- **OpenClaw 文档**: https://docs.openclaw.ai

## 13. OpenClaw 集成指南

### 13.1 架构差异说明

**Claude Code** 和 **OpenClaw** 的架构差异：

| 维度 | Claude Code | OpenClaw |
|------|-------------|----------|
| 运行环境 | 本地 CLI | 分布式 Agent 平台 |
| 工具执行 | 内核直接调度 | 通过工具系统调用 |
| Memory | 文件式 MEMORY.md | 插件式 memory-state.ts |
| 多 Agent | Swarm Backend Registry | Sub-agent + sessions_spawn |
| MCP | 内置 MCP 客户端 | 插件扩展 |

**集成策略**:
- ✅ **Memory 截断** - 通过技能实现 (`memory-truncation`)
- ✅ **工具并发** - 通过技能指导 Agent 决策
- ✅ **MCP 命名** - 通过技能文档规范
- ⚠️ **Query 重构** - 架构不同，仅作参考
- ⚠️ **Trust 分离** - OpenClaw 有自己的安全机制
- ⚠️ **Swarm** - OpenClaw 已有 sub-agent 系统

### 13.2 MCP 工具命名规范

**命名格式**:
```
mcp__<server_name>__<tool_name>
```

**示例**:
```
# 文件系统
mcp__filesystem__read_file
mcp__filesystem__write_file
mcp__filesystem__list_directory

# GitHub
mcp__github__create_issue
mcp__github__create_pull_request
mcp__github__search_code

# Slack
mcp__slack__send_message
mcp__slack__create_channel

# Puppeteer
mcp__puppeteer__screenshot
mcp__puppeteer__click
```

**命名规则**:
1. 前缀 `mcp__` 表示 MCP 工具
2. `server_name` 使用小写 + 下划线
3. `tool_name` 使用小写 + 下划线
4. 避免使用特殊字符

**解析函数**:
```typescript
function buildMcpToolName(serverName: string, toolName: string): string {
  return `mcp__${serverName}__${toolName}`;
}

function parseMcpToolName(fullName: string): { serverName: string; toolName: string } | null {
  const match = fullName.match(/^mcp__(.+?)__(.+)$/);
  if (!match) return null;
  return {
    serverName: match[1],
    toolName: match[2],
  };
}
```

### 13.3 已完成的集成

| 集成项 | 位置 | 状态 |
|--------|------|------|
| Memory 截断技能 | `~/.openclaw/skills/memory-truncation/` | ✅ 完成 |
| 工具并发指南 | 本技能文档 2.1 节 | ✅ 完成 |
| MCP 命名规范 | 本技能文档 13.2 节 | ✅ 完成 |
| 实现代码 | `implementation.js` | ✅ 完成 |

### 13.4 使用指南

**Memory 截断**:
```javascript
const { truncateEntrypointContent, checkFile } = require('./memory-truncation/truncate.js');

// 检查文件
const check = checkFile('~/.openclaw/workspace/MEMORY.md');
if (check.needsTruncation) {
  console.log(`需要截断: ${check.lineOverflow} 行溢出`);
}

// 执行截断
const result = truncateEntrypointContent(content);
console.log(`截断后: ${result.lineCount} 行, ${result.byteCount} 字节`);
```

**工具并发决策**:
```javascript
// Agent 根据技能指导判断
const concurrentSafeTools = ['read', 'web_search', 'web_fetch', 'memory_search'];
const unsafeTools = ['write', 'edit', 'exec', 'message'];

function canRunConcurrently(tools) {
  return tools.every(t => concurrentSafeTools.includes(t.name));
}
```

---

## 14. 文档索引

| 文档 | 内容 | 状态 |
|------|------|------|
| `SKILL.md` | 技能主文档 | ✅ |
| `implementation.js` | 实现代码 | ✅ |
| `INTEGRATION_PLAN.md` | OpenClaw集成方案 | ✅ |
| `memory-truncation/SKILL.md` | Memory截断技能 | ✅ |
| `memory-truncation/truncate.js` | 截断实现代码 | ✅ |

---

*本技能基于 Claude Code 泄露源码分析，提取核心架构设计模式*
*创建时间: 2026-04-07*
*版本: 1.2.0*
*集成状态: 已完成核心集成*