# Claude Code 源码深度分析报告

**分析时间**: 2026-04-07
**分析版本**: v1.0.0
**文档数量**: 10+ 核心架构文档

---

## 概述

本报告基于 Claude Code 泄露源码的深度分析，提取 10 个核心架构维度的设计模式、实现细节和最佳实践。

---

## 维度 1: 工具调用机制 (Tool Call Implementation)

### 1.1 核心机制解析

Claude Code 的工具调用系统采用**分层执行模型**，将工具调用分为三个阶段：

1. **解析阶段 (Parsing)**: 从模型输出中提取工具调用块
2. **分区阶段 (Partitioning)**: 按并发安全性分组
3. **执行阶段 (Execution)**: 串行或并发执行

**关键设计**: 工具不是简单函数，而是具有状态和行为的对象。

```typescript
interface Tool {
  // 核心调用方法
  call(input: unknown, context: ToolContext): Promise<ToolResult>
  
  // 并发安全性检查（运行时决定）
  isConcurrencySafe(input: unknown): boolean
  
  // 只读性检查
  isReadOnly(input: unknown): boolean
  
  // 破坏性检查（用于权限控制）
  isDestructive(input: unknown): boolean
}
```

### 1.2 代码实现模式

**分区算法** (`partitionToolCalls`) 采用贪心策略：

```typescript
function partitionToolCalls(toolUseMessages: ToolUseBlock[], ctx: ToolUseContext): Batch[] {
  return toolUseMessages.reduce((acc: Batch[], toolUse) => {
    const tool = findToolByName(ctx.options.tools, toolUse.name)
    // 关键：并发安全性是动态的，基于输入参数决定
    const isConcurrencySafe = Boolean(tool?.isConcurrencySafe(parsedInput.data))
    
    // 贪心合并：如果当前和上一批都是并发安全的，合并
    if (isConcurrencySafe && acc[acc.length - 1]?.isConcurrencySafe) {
      acc[acc.length - 1]!.blocks.push(toolUse)
    } else {
      acc.push({ isConcurrencySafe, blocks: [toolUse] })
    }
    return acc
  }, [])
}
```

**执行器状态机** (`StreamingToolExecutor`):

```
queued -> executing -> completed -> yielded
```

每个状态转换都有明确的触发条件和副作用：
- `queued`: 初始状态，等待执行
- `executing`: 开始执行，可被取消
- `completed`: 执行完成，结果暂存
- `yielded`: 结果已回流到 transcript

### 1.3 设计亮点

1. **动态并发安全**: 不是静态标记，而是基于输入参数动态判断
   ```typescript
   isConcurrencySafe(input) {
     // 检查是否操作同一文件
     return !isFileLocked(input.file_path)
   }
   ```

2. **结果回流机制**: 工具结果不是直接返回，而是通过 Generator yield 回流到 transcript，保持事件流的一致性

3. **取消支持**: 每个执行状态都支持取消，通过 AbortController 实现

4. **错误隔离**: 单个工具失败不影响其他工具，错误信息被封装在 ToolResult 中

### 1.4 OpenClaw 集成价值

| 当前问题 | Claude Code 方案 | 集成收益 |
|---------|----------------|---------|
| 工具串行执行 | 动态分区并发 | 提升 30-50% 执行效率 |
| 静态并发标记 | 运行时判断 | 更精确的并发控制 |
| 结果同步返回 | Generator 流式 | 更好的 UI 响应性 |
| 错误处理分散 | 统一错误封装 | 更健壮的错误恢复 |

### 1.5 集成实现建议

**阶段 1: 基础框架**
```typescript
// 修改 Tool 接口
interface OpenClawTool {
  name: string
  call: (input: any, context: ToolContext) => Promise<any>
  isConcurrencySafe?: (input: any) => boolean  // 可选，默认 false
  isReadOnly?: (input: any) => boolean        // 可选，默认 false
  isDestructive?: (input: any) => boolean     // 可选，默认 false
}
```

**阶段 2: 分区执行**
```typescript
// 在 tool loop 中集成
async function* executeTools(toolCalls: ToolCall[]) {
  const batches = partitionToolCalls(toolCalls)
  for (const batch of batches) {
    if (batch.isConcurrencySafe) {
      yield* executeConcurrently(batch.blocks)
    } else {
      yield* executeSerially(batch.blocks)
    }
  }
}
```

**阶段 3: 全功能**
- 添加工具结果缓存
- 实现工具调用超时控制
- 添加工具调用指标监控

---

## 维度 2: Agent Memory 系统

### 2.1 核心机制解析

Claude Code 采用**四层 Memory 架构**:

```
┌─────────────────────────────────────────┐
│           Team Memory (团队级)           │
│    跨项目共享，如编码规范、团队约定        │
├─────────────────────────────────────────┤
│          Agent Memory (Agent级)          │
│    特定 Agent 的持久化知识               │
│    scope: user / project / local         │
├─────────────────────────────────────────┤
│         Session Memory (会话级)          │
│    当前会话的上下文记忆                  │
├─────────────────────────────────────────┤
│          Auto Memory (自动级)            │
│    系统自动提取的关键信息                │
└─────────────────────────────────────────┘
```

**核心设计**: MEMORY.md 作为索引，实际记忆存储在单独文件中。

### 2.2 代码实现模式

**硬截断机制**:

```typescript
const MEMORY_CONSTANTS = {
  MAX_ENTRYPOINT_LINES: 200,      // 硬上限：200行
  MAX_ENTRYPOINT_BYTES: 25_000,   // 硬上限：25KB
  MAX_TOPIC_FILE_LINES: 500,      // 主题文件：500行
  MAX_TOPIC_FILE_BYTES: 100_000,  // 主题文件：100KB
}

function truncateEntrypointContent(raw: string): TruncatedContent {
  const lines = raw.split('\n')
  
  // 优先按行截断
  if (lines.length > MAX_ENTRYPOINT_LINES) {
    const truncated = lines.slice(0, MAX_ENTRYPOINT_LINES)
    truncated.push('\n... (truncated)')
    return { content: truncated.join('\n'), wasLineTruncated: true, ... }
  }
  
  // 其次按字节截断
  const byteLength = Buffer.byteLength(raw, 'utf8')
  if (byteLength > MAX_ENTRYPOINT_BYTES) {
    let truncated = raw
    while (Buffer.byteLength(truncated, 'utf8') > MAX_ENTRYPOINT_BYTES) {
      truncated = truncated.slice(0, -100)
    }
    truncated += '\n... (truncated)'
    return { content: truncated, wasLineTruncated: false, ... }
  }
  
  return { content: raw, wasLineTruncated: false, ... }
}
```

**Snapshot 机制**:

```typescript
interface MemorySnapshot {
  version: string      // 版本号，用于升级
  createdAt: Date
  entries: MemoryEntry[]
}

// 初始化时加载 Snapshot
async function loadMemorySnapshot(scope: MemoryScope): Promise<MemoryState> {
  const snapshotPath = getSnapshotPath(scope)
  if (await fileExists(snapshotPath)) {
    return loadFromSnapshot(snapshotPath)
  }
  // 首次使用，创建默认 Snapshot
  return createDefaultSnapshot(scope)
}
```

**Relevant Recall**:

```typescript
async function getRelevantMemories(query: string, limit: number = 5): Promise<MemoryEntry[]> {
  const allMemories = await loadAllMemories()
  
  // 简单的相似度排序（实际使用向量相似度）
  const scored = allMemories.map(m => ({
    memory: m,
    score: calculateSimilarity(query, m.content)
  }))
  
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.memory)
}
```

### 2.3 设计亮点

1. **双层截断策略**: 先行后字节，保持语义完整性
2. **Snapshot 版本控制**: 支持 Memory 格式升级
3. **Scope 隔离**: user/project/local 三级隔离，灵活又安全
4. **索引分离**: MEMORY.md 轻量，实际内容按需加载

### 2.4 OpenClaw 集成价值

| 当前问题 | Claude Code 方案 | 集成收益 |
|---------|----------------|---------|
| 无 Memory 硬限制 | 200行/25KB 硬截断 | 防止 token 溢出 |
| 单文件存储 | 索引+内容分离 | 更快的加载速度 |
| 无版本管理 | Snapshot 机制 | 支持格式迁移 |
| 全局共享 | Scope 隔离 | 更安全的多项目支持 |

### 2.5 集成实现建议

**阶段 1: 硬截断**
```typescript
// 修改 memory_search 和 memory_get
async function memorySearchWithTruncation(query: string) {
  const results = await memory_search({ query })
  return results.map(r => ({
    ...r,
    content: truncateEntrypointContent(r.content).content
  }))
}
```

**阶段 2: Snapshot 机制**
```typescript
// 创建 memory/snapshots/ 目录
// 定期保存 Memory 快照
// 支持从快照恢复
```

**阶段 3: Scope 支持**
```typescript
// 扩展 memory 工具参数
interface MemorySearchOptions {
  query: string
  scope?: 'user' | 'project' | 'local'
  maxResults?: number
}
```

---

## 维度 3: 多 Agent 架构

### 3.1 核心机制解析

Claude Code 支持三种多 Agent 模式：

1. **Subagent 模式**: 主 Agent 创建子 Agent 执行特定任务
2. **Coordinator 模式**: 协调 Agent 分配任务给多个工作 Agent
3. **Swarm Teammates**: 对等协作，多个 Agent 同时工作

**核心抽象**: AgentTool 统一入口

```typescript
// 通过 tool call 创建 teammate
{
  "name": "Agent",
  "input": {
    "teamName": "my-team",
    "name": "code-reviewer"
  }
}
// -> 触发 spawnTeammate(config)
```

### 3.2 代码实现模式

**Backend Registry 模式**:

```typescript
const BACKEND_REGISTRY: Record<string, TeammateBackend> = {
  'in-process': InProcessBackend,   // 同进程，AsyncLocalStorage 隔离
  'tmux':       TmuxBackend,        // tmux 会话隔离
  'iterm2':     ITerm2PaneBackend,  // iTerm2 窗口隔离
}

function spawnTeammate(config: TeammateConfig): TeammateHandle {
  const Backend = BACKEND_REGISTRY[config.backendType]
  if (!Backend) throw new Error(`Unknown backend: ${config.backendType}`)
  return new Backend(config).spawn()
}
```

**In-Process 隔离**:

```typescript
import { AsyncLocalStorage } from 'async_hooks'

const agentContext = new AsyncLocalStorage<AgentContext>()

class InProcessBackend {
  spawn(): TeammateHandle {
    const id = generateId()
    
    // 在隔离上下文中运行
    const runInContext = (fn: () => Promise<void>) => {
      return agentContext.run({ agentId: id, ... }, fn)
    }
    
    return {
      id,
      send: (msg) => runInContext(() => this.agent.process(msg)),
      ...
    }
  }
}
```

**通信机制**:

```typescript
// 双轨制通信
interface CommunicationChannel {
  // 轨道 1: Mailbox 文件通信（异步）
  mailbox: {
    send: (msg: Message) => Promise<void>
    receive: () => Promise<Message>
  }
  
  // 轨道 2: Direct Resume（同步）
  direct: {
    resume: (sessionId: string) => Promise<void>
  }
}
```

### 3.3 设计亮点

1. **Backend 可插拔**: 支持多种隔离级别，从轻量级到重量级
2. **AsyncLocalStorage 隔离**: Node.js 原生 API，零开销上下文隔离
3. **双轨通信**: Mailbox 适合异步，Direct 适合紧急恢复
4. **Leader Permission Bridge**: 子 Agent 的权限可回流到主 Agent

### 3.4 OpenClaw 集成价值

| 当前问题 | Claude Code 方案 | 集成收益 |
|---------|----------------|---------|
| 单 Agent 限制 | 多 Backend 支持 | 复杂任务分解 |
| 无隔离机制 | AsyncLocalStorage | 安全的并行执行 |
| 简单子进程 | Backend Registry | 灵活的部署选项 |
| 权限难传递 | Permission Bridge | 安全的权限继承 |

### 3.5 集成实现建议

**阶段 1: Subagent 基础**
```typescript
// 添加 spawn 工具
interface SpawnOptions {
  task: string
  systemPrompt?: string
  tools?: string[]  // 工具白名单
}

async function spawnSubagent(options: SpawnOptions): Promise<SubagentHandle> {
  // 使用 InProcessBackend
  const backend = new InProcessBackend({
    systemPrompt: options.systemPrompt || defaultPrompt,
    tools: filterTools(options.tools)
  })
  return backend.spawn()
}
```

**阶段 2: Backend 扩展**
```typescript
// 实现 TmuxBackend（用于隔离环境）
class TmuxBackend implements TeammateBackend {
  async spawn(): Promise<TeammateHandle> {
    const session = await createTmuxSession()
    // ...
  }
}
```

**阶段 3: Swarm 协调**
```typescript
// 实现 Coordinator Agent
class CoordinatorAgent {
  private teammates: Map<string, TeammateHandle>
  
  async distributeTask(task: Task): Promise<Result[]> {
    const assignments = this.assignToTeammates(task)
    return Promise.all(assignments.map(a => a.teammate.execute(a.subtask)))
  }
}
```

---

## 维度 4: 会话持久化与恢复

### 4.1 核心机制解析

Claude Code 采用**事件溯源 (Event Sourcing)** 模式持久化会话：

```
┌─────────────────────────────────────────┐
│         Append-only JSONL 事件流         │
├─────────────────────────────────────────┤
│  {"type": "user_message", "content": ...}│
│  {"type": "assistant_message", ...}      │
│  {"type": "tool_use", ...}               │
│  {"type": "tool_result", ...}            │
│  ...                                     │
└─────────────────────────────────────────┘
```

**分离架构**:
- **主 Transcript**: 核心对话事件
- **Sidechain Transcript**: 辅助事件（如 telemetry）

### 4.2 代码实现模式

**事件流结构**:

```typescript
interface EventStream {
  // 主事件流
  main: {
    path: string
    events: Event[]
    lastOffset: number
  }
  // Sidechain 事件流
  sidechains: Map<string, SidechainStream>
}

async function appendEvent(stream: EventStream, event: Event): Promise<void> {
  const line = JSON.stringify(event) + '\n'
  await fs.appendFile(stream.main.path, line)
  stream.main.events.push(event)
}
```

**Metadata 尾部重挂**:

```typescript
interface SessionMetadata {
  sessionId: string
  createdAt: Date
  updatedAt: Date
  messageCount: number
  // 不存储在每条事件中，而是定期重写到文件尾部
}

async function rewriteMetadata(stream: EventStream, metadata: SessionMetadata): Promise<void> {
  // 1. 读取所有事件
  const events = await readAllEvents(stream.main.path)
  
  // 2. 过滤掉旧的 metadata
  const dataEvents = events.filter(e => e.type !== 'metadata')
  
  // 3. 重写文件：事件 + 新 metadata
  const lines = [
    ...dataEvents.map(e => JSON.stringify(e)),
    JSON.stringify({ type: 'metadata', ...metadata })
  ]
  await fs.writeFile(stream.main.path, lines.join('\n'))
}
```

**Resume 修复机制**:

```typescript
interface ResumeRepair {
  // 1. Progress 桥接：恢复执行进度
  bridgeProgress(savedState: SessionState): Promise<void>
  
  // 2. Snip 移除：清理无效片段
  removeSnips(transcript: Transcript): Transcript
  
  // 3. Parallel Tool Result 恢复
  restoreParallelResults(transcript: Transcript): Promise<Transcript>
}

async function resumeSession(sessionId: string): Promise<Session> {
  const stream = await loadEventStream(sessionId)
  
  // 重建 conversation chain
  const events = await readAllEvents(stream.main.path)
  const messages = rebuildConversationChain(events)
  
  // 应用修复
  const repaired = await applyResumeRepairs(messages)
  
  return createSession(sessionId, repaired)
}
```

### 4.3 设计亮点

1. **Append-only**: 永不修改历史，只追加新事件
2. **Metadata 重挂**: 避免频繁更新，批量写入
3. **Resume 修复**: 智能处理中断恢复，不是简单重放
4. **远端 Ingress**: 支持会话同步到云端

### 4.4 OpenClaw 集成价值

| 当前问题 | Claude Code 方案 | 集成收益 |
|---------|----------------|---------|
| 无持久化 | JSONL 事件流 | 会话可恢复 |
| 简单 JSON 存储 | 事件溯源 | 完整历史追踪 |
| 恢复困难 | Resume 修复 | 优雅的中断恢复 |
| 本地存储 | 远端 Ingress | 跨设备同步 |

### 4.5 集成实现建议

**阶段 1: 事件流基础**
```typescript
// 创建 sessions/ 目录，使用 JSONL 格式
class SessionStorage {
  async appendEvent(sessionId: string, event: Event) {
    const line = JSON.stringify(event) + '\n'
    await fs.appendFile(`sessions/${sessionId}.jsonl`, line)
  }
  
  async loadSession(sessionId: string): Promise<Event[]> {
    const content = await fs.readFile(`sessions/${sessionId}.jsonl`, 'utf-8')
    return content.split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line))
  }
}
```

**阶段 2: Resume 支持**
```typescript
// 在会话启动时检查恢复
async function initializeSession(sessionId?: string) {
  if (sessionId && await sessionExists(sessionId)) {
    const events = await loadSession(sessionId)
    return resumeFromEvents(events)
  }
  return createNewSession()
}
```

**阶段 3: 远端同步**
```typescript
// 添加 ingress 同步
async function syncToRemote(sessionId: string) {
  const events = await loadSession(sessionId)
  await uploadToIngress({ sessionId, events })
}
```

---

## 维度 5: MCP 实现

### 5.1 核心机制解析

MCP (Model Context Protocol) 是 Claude Code 的扩展协议，支持连接外部工具服务器。

**核心设计**:
- **命名规范**: `mcp__{serverName}__{toolName}`
- **传输协议**: stdio / sse / ws / http
- **工具白名单**: IDE 集成时的安全控制

### 5.2 代码实现模式

**工具命名**:

```typescript
function buildMcpToolName(serverName: string, toolName: string): string {
  return `mcp__${serverName}__${toolName}`
}

function parseMcpToolName(fullName: string): { serverName: string; toolName: string } | null {
  const match = fullName.match(/^mcp__(.+?)__(.+)$/)
  if (!match) return null
  return { serverName: match[1], toolName: match[2] }
}

// 示例
buildMcpToolName('filesystem', 'read_file')  // "mcp__filesystem__read_file"
buildMcpToolName('github', 'create_issue')   // "mcp__github__create_issue"
```

**传输协议抽象**:

```typescript
interface McpTransport {
  type: 'stdio' | 'sse' | 'ws' | 'http'
  send(message: JSONRPCMessage): Promise<void>
  receive(): Promise<JSONRPCMessage>
  close(): Promise<void>
}

class StdioTransport implements McpTransport {
  private child: ChildProcess
  
  constructor(command: string, args: string[]) {
    this.child = spawn(command, args)
  }
  
  async send(message: JSONRPCMessage): Promise<void> {
    this.child.stdin.write(JSON.stringify(message) + '\n')
  }
  
  async receive(): Promise<JSONRPCMessage> {
    // 从 stdout 读取 JSON-RPC 消息
    return new Promise((resolve) => {
      this.child.stdout.once('data', (data) => {
        resolve(JSON.parse(data.toString()))
      })
    })
  }
}
```

**认证缓存**:

```typescript
const authCache = new Map<string, AuthToken>()
const AUTH_CACHE_TTL = 15 * 60 * 1000  // 15分钟

async function getAuthToken(serverName: string): Promise<AuthToken> {
  const cached = authCache.get(serverName)
  if (cached && Date.now() - cached.timestamp < AUTH_CACHE_TTL) {
    return cached
  }
  
  const fresh = await fetchAuthToken(serverName)
  authCache.set(serverName, { ...fresh, timestamp: Date.now() })
  return fresh
}
```

**Session 过期检测**:

```typescript
function isSessionExpiredError(error: unknown): boolean {
  // HTTP 404
  if (error instanceof HTTPError && error.status === 404) {
    return true
  }
  
  // JSON-RPC 错误码 -32001
  if (error instanceof JSONRPCError && error.code === -32001) {
    return true
  }
  
  return false
}
```

### 5.3 设计亮点

1. **命名空间隔离**: `mcp__` 前缀避免与内置工具冲突
2. **传输协议统一**: 四种协议统一为 McpTransport 接口
3. **认证防雪崩**: 15分钟 TTL 缓存，避免重复认证
4. **过期智能检测**: 多种错误码识别 session 过期

### 5.4 OpenClaw 集成价值

| 当前问题 | Claude Code 方案 | 集成收益 |
|---------|----------------|---------|
| 工具名冲突 | mcp__ 命名规范 | 清晰的命名空间 |
| 外部工具难集成 | 统一传输抽象 | 易于扩展 |
| 认证频繁 | 15分钟缓存 | 减少 API 调用 |
| 过期处理混乱 | 智能检测 | 更好的错误恢复 |

### 5.5 集成实现建议

**阶段 1: 命名规范**
```typescript
// 修改工具注册
function registerTool(tool: Tool) {
  const fullName = tool.isMcp 
    ? buildMcpToolName(tool.serverName, tool.name)
    : tool.name
  toolRegistry.set(fullName, tool)
}
```

**阶段 2: MCP 支持**
```typescript
// 添加 MCP 服务器配置
interface McpServerConfig {
  name: string
  transport: 'stdio' | 'http'
  command?: string  // for stdio
  url?: string      // for http
}

async function connectMcpServer(config: McpServerConfig) {
  const transport = createTransport(config)
  const tools = await discoverTools(transport)
  for (const tool of tools) {
    registerMcpTool(config.name, tool)
  }
}
```

**阶段 3: 完整集成**
```typescript
// 支持 mcp.json 配置文件
// 自动重连和 session 恢复
// 工具白名单控制
```

---

## 维度 6: Sandbox 安全

### 6.1 核心机制解析

Claude Code 采用**分层安全模型**:

```
┌─────────────────────────────────────────┐
│           应用层安全                      │
│    Trust 检查、权限控制、工具白名单        │
├─────────────────────────────────────────┤
│           Sandbox 层                      │
│    文件系统隔离、网络隔离、进程隔离        │
├─────────────────────────────────────────┤
│           宿主机层                        │
│    系统调用过滤、资源限制                 │
└─────────────────────────────────────────┘
```

### 6.2 代码实现模式

**路由决策**:

```typescript
function shouldUseSandbox(command: BashCommand): boolean {
  // 检查是否需要隔离
  if (command.includes('curl') || command.includes('wget')) {
    return true  // 网络操作需要隔离
  }
  
  if (command.includes('rm -rf') || command.includes('>')) {
    return true  // 破坏性操作需要隔离
  }
  
  // 检查是否在安全目录
  const workDir = getWorkingDirectory(command)
  if (isInProtectedDir(workDir)) {
    return true
  }
  
  return false
}
```

**语义翻译**:

```typescript
interface SandboxRuntimeConfig {
  readonly: boolean
  network: 'none' | 'limited' | 'full'
  mounts: MountConfig[]
  env: Record<string, string>
}

function convertToSandboxRuntimeConfig(
  bashPermissions: BashPermissions
): SandboxRuntimeConfig {
  return {
    readonly: bashPermissions.isReadOnly,
    network: bashPermissions.allowNetwork ? 'limited' : 'none',
    mounts: bashPermissions.allowedPaths.map(p => ({
      source: p,
      target: p,
      readOnly: bashPermissions.isReadOnly
    })),
    env: filterSafeEnvVars(bashPermissions.env)
  }
}
```

**权限检查**:

```typescript
interface BashPermissions {
  // 显式 deny 优先
  deniedCommands: string[]
  
  // 显式 ask 其次
  askCommands: string[]
  
  // 默认 allow
  allowedPaths: string[]
  allowNetwork: boolean
  isReadOnly: boolean
}

function checkBashPermission(
  command: string, 
  permissions: BashPermissions
): PermissionResult {
  // 1. 检查 deny 列表
  if (permissions.deniedCommands.some(d => command.includes(d))) {
    return { allowed: false, reason: 'Explicitly denied' }
  }
  
  // 2. 检查 ask 列表
  if (permissions.askCommands.some(a => command.includes(a))) {
    return { allowed: 'ask', reason: 'Requires approval' }
  }
  
  // 3. 默认允许
  return { allowed: true }
}
```

**Git 逃逸防护**:

```typescript
function isGitBareRepoEscapeAttempt(command: string): boolean {
  // 检测尝试访问 Git bare repo 外部
  const gitDirMatch = command.match(/--git-dir=(\S+)/)
  if (gitDirMatch) {
    const gitDir = gitDirMatch[1]
    const resolvedPath = path.resolve(gitDir)
    const allowedPath = path.resolve(process.cwd())
    
    if (!resolvedPath.startsWith(allowedPath)) {
      return true  // 尝试逃逸到允许目录外
    }
  }
  
  return false
}
```

### 6.3 设计亮点

1. **分层决策**: 显式 deny > 显式 ask > 默认 allow
2. **语义翻译**: 高层权限抽象到底层沙箱配置
3. **Git 逃逸防护**: 专门防护常见的 Git 沙箱逃逸
4. **目录保护**: Settings 和 skills 目录不可写

### 6.4 OpenClaw 集成价值

| 当前问题 | Claude Code 方案 | 集成收益 |
|---------|----------------|---------|
| 无沙箱隔离 | 分层安全模型 | 更安全的执行 |
| 权限控制简单 | deny/ask/allow 三层 | 精细的权限控制 |
| 无逃逸防护 | Git 逃逸检测 | 防止沙箱绕过 |
| 全局可写 | 目录保护 | 保护关键配置 |

### 6.5 集成实现建议

**阶段 1: 权限检查**
```typescript
// 添加权限配置
interface ExecPermissions {
  deniedPatterns: string[]
  askPatterns: string[]
  allowedPaths: string[]
  allowNetwork: boolean
}

function checkExecPermission(command: string, perms: ExecPermissions): boolean {
  if (perms.deniedPatterns.some(p => command.includes(p))) {
    throw new Error(`Command denied: ${command}`)
  }
  // ...
}
```

**阶段 2: 沙箱集成**
```typescript
// 集成 firejail 或类似工具
async function execInSandbox(command: string, config: SandboxConfig) {
  const args = ['--noprofile']
  if (config.readonly) args.push('--read-only')
  if (config.network === 'none') args.push('--net=none')
  
  return exec(`firejail ${args.join(' ')} ${command}`)
}
```

**阶段 3: 完整安全**
```typescript
// 添加安全扫描
// 自动检测危险命令
// 敏感文件访问审计
```

---

## 维度 7: 上下文管理

### 7.1 核心机制解析

Claude Code 采用**动态上下文窗口管理**:

```
总窗口容量
    │
    ▼
┌─────────────────────────────────────────┐
│           20K Summary 预留               │ ← 用于生成摘要
├─────────────────────────────────────────┤
│           有效窗口                        │ ← 实际可用
│  ┌─────────────────────────────────┐    │
│  │      Capped Max Tokens          │    │ ← 8000 优化
│  │  (优化 slot reservation)        │    │
│  └─────────────────────────────────┘    │
├─────────────────────────────────────────┤
│           AutoCompact 缓冲               │ ← 13K tokens
└─────────────────────────────────────────┘
```

### 7.2 代码实现模式

**窗口计算**:

```typescript
const CONTEXT_CONSTANTS = {
  SUMMARY_RESERVE_TOKENS: 20000,      // 20K 摘要预留
  CAPPED_DEFAULT_MAX_TOKENS: 8000,    // 优化 slot reservation
  AUTOCOMPACT_BUFFER_TOKENS: 13000,   // 13K 缓冲界限
}

function calculateEffectiveWindow(totalWindow: number): number {
  // 有效窗口 = 总窗口 - 摘要预留
  return totalWindow - CONTEXT_CONSTANTS.SUMMARY_RESERVE_TOKENS
}

function shouldTriggerCompact(currentTokens: number, maxTokens: number): boolean {
  // 达到缓冲界限时触发 compact
  const threshold = maxTokens - CONTEXT_CONSTANTS.AUTOCOMPACT_BUFFER_TOKENS
  return currentTokens > threshold
}
```

**熔断机制**:

```typescript
class CircuitBreaker {
  private failureCount = 0
  private readonly threshold = 3  // 3次连续失败
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  
  recordFailure(): void {
    this.failureCount++
    if (this.failureCount >= this.threshold) {
      this.state = 'open'
      setTimeout(() => this.state = 'half-open', 60000)  // 1分钟后尝试恢复
    }
  }
  
  recordSuccess(): void {
    this.failureCount = 0
    this.state = 'closed'
  }
  
  canExecute(): boolean {
    return this.state !== 'open'
  }
}
```

**PTL (Prompt Token Limit) 防御**:

```typescript
async function executeWithPTLDefense<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (isPTLError(error)) {
        // 剥洋葱式重试：逐层减少上下文
        const reductionFactor = Math.pow(0.8, attempt + 1)
        await reduceContext(reductionFactor)
        lastError = error
      } else {
        throw error
      }
    }
  }
  
  throw lastError!
}

function isPTLError(error: unknown): boolean {
  return error instanceof APIError && 
         error.code === 'context_length_exceeded'
}
```

**状态重启点补偿**:

```typescript
interface Checkpoint {
  id: string
  timestamp: number
  messages: Message[]
  toolState: ToolState
}

const checkpoints: Checkpoint[] = []

function createCheckpoint(): Checkpoint {
  const checkpoint = {
    id: generateId(),
    timestamp: Date.now(),
    messages: [...currentMessages],
    toolState: captureToolState()
  }
  checkpoints.push(checkpoint)
  
  // 只保留最近 5 个检查点
  if (checkpoints.length > 5) {
    checkpoints.shift()
  }
  
  return checkpoint
}

async function restoreCheckpoint(checkpointId: string): Promise<void> {
  const checkpoint = checkpoints.find(c => c.id === checkpointId)
  if (!checkpoint) throw new Error(`Checkpoint not found: ${checkpointId}`)
  
  currentMessages = [...checkpoint.messages]
  restoreToolState(checkpoint.toolState)
}
```

### 7.3 设计亮点

1. **预留摘要空间**: 20K tokens 专门用于生成摘要，避免摘要时溢出
2. **熔断保护**: 3次失败停止，防止级联故障
3. **剥洋葱重试**: 逐层减少上下文，优雅处理 PTL
4. **检查点机制**: 支持状态回滚，安全尝试

### 7.4 OpenClaw 集成价值

| 当前问题 | Claude Code 方案 | 集成收益 |
|---------|----------------|---------|
| 无窗口管理 | 动态计算 | 更精确的容量控制 |
| 硬截断 | AutoCompact | 更平滑的上下文压缩 |
| 无限重试 | 熔断机制 | 防止资源浪费 |
| PTL 崩溃 | 剥洋葱重试 | 优雅降级 |

### 7.5 集成实现建议

**阶段 1: 窗口管理**
```typescript
// 添加 token 估算
function estimateTokens(messages: Message[]): number {
  return messages.reduce((sum, m) => 
    sum + Math.ceil(m.content.length / 4), 0
  )
}

// 在 query 前检查
const estimated = estimateTokens(messages)
if (estimated > MAX_TOKENS * 0.8) {
  await compactMessages()
}
```

**阶段 2: 熔断机制**
```typescript
// 添加 API 调用熔断
const apiBreaker = new CircuitBreaker()

async function callAPIWithBreaker(messages: Message[]) {
  if (!apiBreaker.canExecute()) {
    throw new Error('API circuit breaker is open')
  }
  
  try {
    const result = await callAPI(messages)
    apiBreaker.recordSuccess()
    return result
  } catch (error) {
    apiBreaker.recordFailure()
    throw error
  }
}
```

**阶段 3: PTL 防御**
```typescript
// 集成到 tool loop
async function* executeWithDefense(toolCalls: ToolCall[]) {
  try {
    yield* executeTools(toolCalls)
  } catch (error) {
    if (isPTLError(error)) {
      // 减少上下文重试
      await reduceContext(0.8)
      yield* executeTools(toolCalls)
    }
  }
}
```

---

## 维度 8: Prompt 管理

### 8.1 核心机制解析

Claude Code 采用**分层 Prompt 架构**:

```
┌─────────────────────────────────────────┐
│         Override Prompt                  │ ← 最高优先级（用户强制）
├─────────────────────────────────────────┤
│        Coordinator Prompt                │ ← 协调 Agent 专用
├─────────────────────────────────────────┤
│          Agent Prompt                    │ ← 特定 Agent 配置
├─────────────────────────────────────────┤
│         Custom Prompt                    │ ← 用户自定义
├─────────────────────────────────────────┤
│         Default Prompt                   │ ← 系统默认
└─────────────────────────────────────────┘
```

### 8.2 代码实现模式

**多 Section 结构**:

```typescript
function getSystemPrompt(): string[] {
  return [
    // 静态段（缓存）
    getStaticSection(),
    
    // 动态边界标记
    '--- DYNAMIC_BOUNDARY ---',
    
    // 动态段（每次重新生成）
    getDynamicSection(),
  ]
}

function buildEffectiveSystemPrompt(context: PromptContext): string {
  const sections: string[] = []
  
  // 按优先级合并
  if (context.override) sections.push(context.override)
  if (context.coordinator) sections.push(context.coordinator)
  if (context.agent) sections.push(context.agent)
  if (context.custom) sections.push(context.custom)
  sections.push(context.default)
  
  return sections.join('\n\n')
}
```

**Section 缓存**:

```typescript
const sectionCache = new Map<string, string>()

function systemPromptSection(key: string, generator: () => string): string {
  if (!sectionCache.has(key)) {
    sectionCache.set(key, generator())
  }
  return sectionCache.get(key)!
}

// 危险：绕过缓存
function DANGEROUS_uncachedSystemPromptSection(generator: () => string): string {
  return generator()
}
```

**专项 Prompt**:

```typescript
const SPECIALIZED_PROMPTS = {
  // Compact 专用
  compact: `You are summarizing a conversation...`,
  
  // Session memory 提取
  sessionMemory: `Extract key information from this conversation...`,
  
  // Memory extraction
  memoryExtraction: `Identify what should be remembered...`,
}

function getSpecializedPrompt(type: keyof typeof SPECIALIZED_PROMPTS): string {
  return SPECIALIZED_PROMPTS[type]
}
```

### 8.3 设计亮点

1. **优先级覆盖**: 清晰的 5 级优先级，避免冲突
2. **动静分离**: 静态段缓存，动态段实时生成
3. **显式危险标记**: `DANGEROUS_` 前缀提醒慎用
4. **专项优化**: 不同场景使用专门优化的 prompt

### 8.4 OpenClaw 集成价值

| 当前问题 | Claude Code 方案 | 集成收益 |
|---------|----------------|---------|
| 单一 Prompt | 分层架构 | 更灵活的配置 |
| 全量生成 | Section 缓存 | 减少重复计算 |
| 通用 Prompt | 专项优化 | 更好的场景适配 |

### 8.5 集成实现建议

**阶段 1: 分层 Prompt**
```typescript
// 修改系统 prompt 构建
function buildSystemPrompt(context: SessionContext): string {
  const sections = []
  
  // 基础能力
  sections.push(getCapabilityPrompt())
  
  // 工具描述
  sections.push(getToolsPrompt(context.availableTools))
  
  // Memory
  if (context.memories) {
    sections.push(getMemoryPrompt(context.memories))
  }
  
  // 用户自定义
  if (context.customPrompt) {
    sections.push(context.customPrompt)
  }
  
  return sections.join('\n\n')
}
```

**阶段 2: 缓存优化**
```typescript
// 缓存工具描述（变化较少）
const toolsPromptCache = new Map<string, string>()

function getToolsPrompt(tools: Tool[]) {
  const key = tools.map(t => t.name).sort().join(',')
  if (!toolsPromptCache.has(key)) {
    toolsPromptCache.set(key, generateToolsPrompt(tools))
  }
  return toolsPromptCache.get(key)
}
```

**阶段 3: 专项 Prompt**
```typescript
// 添加 specialized prompts
const COMPACT_PROMPT = `Summarize the following conversation...`
const MEMORY_EXTRACTION_PROMPT = `Extract key facts to remember...`
```

---

## 维度 9: 工具结果处理

### 9.1 核心机制解析

Claude Code 的工具结果处理采用**统一封装 + 类型特化**模式：

```typescript
interface ToolResult {
  // 统一字段
  toolUseId: string
  status: 'success' | 'error' | 'canceled'
  
  // 类型特化内容
  content: TextContent | ImageContent | ErrorContent
  
  // 元数据
  timing: {
    startedAt: Date
    completedAt: Date
    durationMs: number
  }
}
```

### 9.2 代码实现模式

**结果封装**:

```typescript
function createToolResult(
  toolUseId: string,
  rawResult: unknown,
  timing: TimingInfo
): ToolResult {
  if (rawResult instanceof Error) {
    return {
      toolUseId,
      status: 'error',
      content: { type: 'error', message: rawResult.message, stack: rawResult.stack },
      timing
    }
  }
  
  if (isImageData(rawResult)) {
    return {
      toolUseId,
      status: 'success',
      content: { type: 'image', data: rawResult.data, mimeType: rawResult.mimeType },
      timing
    }
  }
  
  // 默认文本
  return {
    toolUseId,
    status: 'success',
    content: { type: 'text', text: String(rawResult) },
    timing
  }
}
```

**结果回流**:

```typescript
async function* executeTool(toolCall: ToolCall, context: ToolContext) {
  const startedAt = new Date()
  
  try {
    // 执行前通知
    yield { type: 'tool_start', toolUseId: toolCall.id }
    
    // 执行工具
    const rawResult = await tool.call(toolCall.input, context)
    
    // 封装结果
    const result = createToolResult(toolCall.id, rawResult, {
      startedAt,
      completedAt: new Date(),
      durationMs: Date.now() - startedAt.getTime()
    })
    
    // 回流到 transcript
    yield { type: 'tool_result', result }
    
  } catch (error) {
    yield {
      type: 'tool_result',
      result: createToolResult(toolCall.id, error, { startedAt, completedAt: new Date(), durationMs: 0 })
    }
  }
}
```

### 9.3 设计亮点

1. **统一封装**: 所有结果统一格式，便于处理
2. **类型特化**: 支持文本、图片、错误等多种内容
3. **完整时序**: 记录开始、结束、耗时
4. **流式回流**: 通过 Generator 实时 yield 结果

### 9.4 OpenClaw 集成价值

| 当前问题 | Claude Code 方案 | 集成收益 |
|---------|----------------|---------|
| 结果格式不一 | 统一封装 | 更简洁的处理逻辑 |
| 同步返回 | 流式回流 | 更好的实时反馈 |
| 无执行时序 | 完整 timing | 性能分析数据 |

### 9.5 集成实现建议

**阶段 1: 统一结果格式**
```typescript
interface ToolResult {
  toolName: string
  status: 'success' | 'error'
  content: any
  durationMs: number
}

async function wrapToolExecution<T>(
  toolName: string,
  fn: () => Promise<T>
): Promise<ToolResult> {
  const start = Date.now()
  try {
    const content = await fn()
    return {
      toolName,
      status: 'success',
      content,
      durationMs: Date.now() - start
    }
  } catch (error) {
    return {
      toolName,
      status: 'error',
      content: error.message,
      durationMs: Date.now() - start
    }
  }
}
```

---

## 维度 10: 遥测与可观测性

### 10.1 核心机制解析

Claude Code 的遥测系统采用**异步队列 + 批量上报**模式：

```
事件产生 -> 内存队列 -> 批量聚合 -> 异步上报
                │
                ▼
           本地持久化（失败时）
```

### 10.2 代码实现模式

**异步队列**:

```typescript
class TelemetryQueue {
  private queue: TelemetryEvent[] = []
  private flushTimer: NodeJS.Timeout | null = null
  private readonly FLUSH_INTERVAL = 5000  // 5秒
  private readonly BATCH_SIZE = 100
  
  enqueue(event: TelemetryEvent): void {
    this.queue.push(event)
    
    if (this.queue.length >= this.BATCH_SIZE) {
      this.flush()
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.FLUSH_INTERVAL)
    }
  }
  
  private async flush(): Promise<void> {
    if (this.queue.length === 0) return
    
    const batch = this.queue.splice(0, this.BATCH_SIZE)
    
    try {
      await this.sendBatch(batch)
    } catch (error) {
      // 失败时持久化到本地
      await this.persistFailedBatch(batch)
    }
    
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
  }
}
```

**事件结构**:

```typescript
interface TelemetryEvent {
  id: string
  timestamp: number
  type: 'tool_call' | 'api_call' | 'error' | 'session_start' | 'session_end'
  
  // 通用属性
  sessionId: string
  agentId: string
  
  // 类型特定属性
  properties: Record<string, unknown>
  
  // 性能指标
  metrics?: {
    durationMs: number
    tokenCount?: number
    contextSize?: number
  }
}
```

### 10.3 设计亮点

1. **异步非阻塞**: 事件产生不等待上报
2. **批量聚合**: 减少网络请求
3. **失败持久化**: 本地存储，稍后重试
4. **性能指标**: 内置 duration、token 等关键指标

### 10.4 OpenClaw 集成价值

| 当前问题 | Claude Code 方案 | 集成收益 |
|---------|----------------|---------|
| 同步日志 | 异步队列 | 不阻塞主流程 |
| 单条上报 | 批量聚合 | 减少网络开销 |
| 失败丢失 | 本地持久化 | 数据不丢失 |

### 10.5 集成实现建议

**阶段 1: 基础遥测**
```typescript
// 添加 telemetry 工具
class Telemetry {
  private events: TelemetryEvent[] = []
  
  record(event: TelemetryEvent) {
    this.events.push(event)
  }
  
  async flush() {
    if (this.events.length === 0) return
    await sendToServer(this.events)
    this.events = []
  }
}
```

---

## 总结

### 10 个核心维度对比

| 维度 | 关键设计 | 集成优先级 |
|------|---------|-----------|
| 工具调用 | 动态并发分区 | P0 |
| Agent Memory | 硬截断 + Snapshot | P0 |
| 多 Agent | Backend Registry | P1 |
| 会话持久化 | 事件溯源 | P1 |
| MCP | 统一传输抽象 | P1 |
| Sandbox | 分层安全 | P2 |
| 上下文管理 | AutoCompact | P0 |
| Prompt 管理 | 分层架构 | P1 |
| 工具结果 | 统一封装 | P2 |
| 遥测 | 异步队列 | P2 |

### 立即实施建议

1. **工具并发调度**: 立即实现 `partitionToolCalls`，收益最大
2. **Memory 硬截断**: 添加 200行/25KB 限制，防止 token 溢出
3. **上下文管理**: 实现 AutoCompact 和熔断机制

### 中期实施建议

1. **多 Agent 架构**: 实现 InProcessBackend
2. **会话持久化**: 迁移到 JSONL 事件流
3. **MCP 支持**: 添加 MCP 服务器连接能力

### 长期实施建议

1. **Sandbox 安全**: 集成沙箱执行环境
2. **遥测系统**: 构建完整的可观测性平台
