# Claude Code 架构优化技能

**技能ID**: `claude-code-architecture`
**版本**: 1.0.0
**创建时间**: 2026-04-07
**状态**: 全局可用

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

### 2.1 核心模式

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

## 10. 实现检查清单

### 10.1 工具并发调度

- [ ] 实现 `partitionToolCalls` 函数
- [ ] 为每个工具添加 `isConcurrencySafe` 方法
- [ ] 实现 `runToolsConcurrently` 和 `runToolsSerially`
- [ ] 添加并发安全测试

### 10.2 Memory 硬截断

- [ ] 定义 `MEMORY_CONSTANTS` 常量
- [ ] 实现 `truncateEntrypointContent` 函数
- [ ] 修改 `buildMemoryPrompt` 添加截断
- [ ] 添加截断日志和监控

### 10.3 Trust 分离

- [ ] 定义 `SAFE_ENVIRONMENT_VARIABLES` 白名单
- [ ] 实现 `applySafeEnvironmentVariables`
- [ ] 实现 `initializeTelemetryAfterTrust`
- [ ] 添加 trust 状态检查

### 10.4 Query 重构

- [ ] 将 query 改为 Generator 函数
- [ ] 实现 `shouldCompact` 和 `compact`
- [ ] 添加 `executePostSamplingHooks`
- [ ] 测试流式输出

### 10.5 MCP 命名

- [ ] 实现 `buildMcpToolName`
- [ ] 实现 `parseMcpToolName`
- [ ] 更新所有 MCP 工具名称
- [ ] 添加命名验证

### 10.6 Swarm 架构

- [ ] 定义 `BACKEND_REGISTRY`
- [ ] 实现 `InProcessBackend`
- [ ] 实现 `TmuxBackend`（可选）
- [ ] 添加 Backend 接口测试

---

## 11. 相关资源

- **源码分析仓库**: https://github.com/liuup/claude-code-analysis
- **Claude Code 官方**: https://claude.ai/code
- **MCP 协议**: https://modelcontextprotocol.io
- **OpenClaw 文档**: https://docs.openclaw.ai

---

*本技能基于 Claude Code 泄露源码分析，提取核心架构设计模式*
*创建时间: 2026-04-07*
*版本: 1.0.0*