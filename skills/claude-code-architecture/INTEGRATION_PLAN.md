# OpenClaw 集成方案

**基于 Claude Code 架构优化的 OpenClaw 改进计划**

**版本**: 1.0.0
**创建时间**: 2026-04-07
**优先级**: P0/P1/P2

---

## 目录

1. [执行摘要](#执行摘要)
2. [集成路线图](#集成路线图)
3. [P0 优先级实现](#p0-优先级实现)
4. [P1 优先级实现](#p1-优先级实现)
5. [P2 优先级实现](#p2-优先级实现)
6. [代码示例](#代码示例)
7. [测试策略](#测试策略)
8. [风险与缓解](#风险与缓解)

---

## 执行摘要

### 目标

将 Claude Code 源码中的 10 个核心架构优化点集成到 OpenClaw，提升系统性能、安全性和可维护性。

### 关键收益

| 指标 | 预期改进 |
|------|---------|
| 工具执行效率 | +30-50% |
| Token 溢出防护 | 100% 防护 |
| 会话恢复能力 | 从 0% 到 100% |
| 多 Agent 支持 | 新增能力 |
| 上下文管理 | 更平滑的降级 |

### 实施周期

- **P0 (关键)**: 2-3 周
- **P1 (重要)**: 4-6 周
- **P2 (增强)**: 6-8 周

---

## 集成路线图

```
时间线
─────────────────────────────────────────────────────────────>

Week 1-2:  P0 - 工具并发调度 + Memory 硬截断
Week 3:    P0 - 上下文管理优化
Week 4-5:  P1 - 多 Agent 基础 + 会话持久化
Week 6:    P1 - MCP 支持 + Prompt 分层
Week 7-8:  P2 - Sandbox + 遥测系统

并行工作:
├── 核心框架修改 (工具并发、Memory)
├── Agent 架构重构 (多 Agent、会话)
└── 基础设施增强 (MCP、Sandbox、遥测)
```

---

## P0 优先级实现

### 1. 工具并发调度 (Tool Concurrency)

**目标**: 实现工具调用的智能分区并发执行

**实现步骤**:

#### 阶段 1: 修改 Tool 接口 (Day 1-2)

```typescript
// file: src/core/tools/types.ts

export interface Tool {
  name: string
  description: string
  parameters: JSONSchema
  
  // 新增：并发安全性检查
  isConcurrencySafe?: (input: unknown) => boolean
  
  // 新增：只读性检查
  isReadOnly?: (input: unknown) => boolean
  
  // 新增：破坏性检查
  isDestructive?: (input: unknown) => boolean
  
  // 执行函数
  execute: (input: unknown, context: ToolContext) => Promise<unknown>
}

// 默认实现
export const defaultToolChecks = {
  isConcurrencySafe: () => false,  // 默认串行
  isReadOnly: () => false,
  isDestructive: () => true,
}
```

#### 阶段 2: 实现分区算法 (Day 3-4)

```typescript
// file: src/core/tools/partition.ts

export interface ToolCall {
  id: string
  name: string
  input: unknown
}

export interface ToolBatch {
  isConcurrencySafe: boolean
  calls: ToolCall[]
}

export function partitionToolCalls(
  calls: ToolCall[],
  toolRegistry: Map<string, Tool>
): ToolBatch[] {
  return calls.reduce<ToolBatch[]>((acc, call) => {
    const tool = toolRegistry.get(call.name)
    const isSafe = tool?.isConcurrencySafe?.(call.input) ?? false
    
    // 贪心合并策略
    if (isSafe && acc.length > 0 && acc[acc.length - 1].isConcurrencySafe) {
      acc[acc.length - 1].calls.push(call)
    } else {
      acc.push({ isConcurrencySafe: isSafe, calls: [call] })
    }
    
    return acc
  }, [])
}
```

#### 阶段 3: 实现并发执行器 (Day 5-7)

```typescript
// file: src/core/tools/executor.ts

import { EventEmitter } from 'events'

export interface ToolExecutionEvent {
  type: 'start' | 'complete' | 'error'
  toolCallId: string
  result?: unknown
  error?: Error
  timing: {
    startedAt: Date
    completedAt?: Date
  }
}

export class ToolExecutor extends EventEmitter {
  async *executeBatches(
    batches: ToolBatch[],
    toolRegistry: Map<string, Tool>,
    context: ToolContext
  ): AsyncGenerator<ToolExecutionEvent> {
    for (const batch of batches) {
      if (batch.isConcurrencySafe) {
        yield* this.executeConcurrently(batch.calls, toolRegistry, context)
      } else {
        yield* this.executeSerially(batch.calls, toolRegistry, context)
      }
    }
  }
  
  private async *executeConcurrently(
    calls: ToolCall[],
    toolRegistry: Map<string, Tool>,
    context: ToolContext
  ): AsyncGenerator<ToolExecutionEvent> {
    const startedAt = new Date()
    
    // 启动所有任务
    const promises = calls.map(async (call) => {
      const tool = toolRegistry.get(call.name)!
      try {
        const result = await tool.execute(call.input, context)
        return { call, result, error: null }
      } catch (error) {
        return { call, result: null, error }
      }
    })
    
    // 按完成顺序 yield 结果
    const results = await Promise.all(promises)
    
    for (const { call, result, error } of results) {
      if (error) {
        yield {
          type: 'error',
          toolCallId: call.id,
          error: error as Error,
          timing: { startedAt, completedAt: new Date() }
        }
      } else {
        yield {
          type: 'complete',
          toolCallId: call.id,
          result,
          timing: { startedAt, completedAt: new Date() }
        }
      }
    }
  }
  
  private async *executeSerially(
    calls: ToolCall[],
    toolRegistry: Map<string, Tool>,
    context: ToolContext
  ): AsyncGenerator<ToolExecutionEvent> {
    for (const call of calls) {
      const startedAt = new Date()
      const tool = toolRegistry.get(call.name)!
      
      yield { type: 'start', toolCallId: call.id, timing: { startedAt } }
      
      try {
        const result = await tool.execute(call.input, context)
        yield {
          type: 'complete',
          toolCallId: call.id,
          result,
          timing: { startedAt, completedAt: new Date() }
        }
      } catch (error) {
        yield {
          type: 'error',
          toolCallId: call.id,
          error: error as Error,
          timing: { startedAt, completedAt: new Date() }
        }
      }
    }
  }
}
```

#### 阶段 4: 集成到主循环 (Day 8-10)

```typescript
// file: src/core/agent/Agent.ts

export class Agent {
  private toolExecutor = new ToolExecutor()
  
  async *processWithTools(
    messages: Message[],
    toolCalls: ToolCall[]
  ): AsyncGenerator<AgentEvent> {
    // 1. 分区
    const batches = partitionToolCalls(toolCalls, this.toolRegistry)
    
    // 2. 执行并流式返回结果
    for await (const event of this.toolExecutor.executeBatches(
      batches,
      this.toolRegistry,
      this.context
    )) {
      // 转换并 yield
      yield this.convertToAgentEvent(event)
      
      // 添加到消息历史
      if (event.type === 'complete' || event.type === 'error') {
        messages.push(this.createToolResultMessage(event))
      }
    }
  }
}
```

**验收标准**:
- [ ] read/fetch/search 等读取工具可并发执行
- [ ] write/exec 等写入工具串行执行
- [ ] 混合调用时自动分区
- [ ] 性能提升 30%+

---

### 2. Memory 硬截断保护

**目标**: 防止 MEMORY.md 内容过长导致 token 溢出

**实现步骤**:

#### 阶段 1: 定义常量 (Day 1)

```typescript
// file: src/core/memory/constants.ts

export const MEMORY_CONSTANTS = {
  // 入口文件限制
  MAX_ENTRYPOINT_LINES: 200,
  MAX_ENTRYPOINT_BYTES: 25_000,
  
  // 主题文件限制
  MAX_TOPIC_FILE_LINES: 500,
  MAX_TOPIC_FILE_BYTES: 100_000,
  
  // 相关记忆数量
  MAX_RELEVANT_MEMORIES: 5,
  
  // 摘要预留
  SUMMARY_RESERVE_TOKENS: 20000,
} as const
```

#### 阶段 2: 实现截断函数 (Day 2-3)

```typescript
// file: src/core/memory/truncate.ts

import { MEMORY_CONSTANTS } from './constants'

export interface TruncatedContent {
  content: string
  lineCount: number
  byteCount: number
  wasLineTruncated: boolean
  wasByteTruncated: boolean
  originalLines: number
  originalBytes: number
}

export function truncateEntrypointContent(raw: string): TruncatedContent {
  const lines = raw.split('\n')
  const originalLines = lines.length
  const originalBytes = Buffer.byteLength(raw, 'utf8')
  
  // 优先按行截断
  if (originalLines > MEMORY_CONSTANTS.MAX_ENTRYPOINT_LINES) {
    const truncated = lines.slice(0, MEMORY_CONSTANTS.MAX_ENTRYPOINT_LINES)
    truncated.push('\n... (truncated)')
    const content = truncated.join('\n')
    
    return {
      content,
      lineCount: MEMORY_CONSTANTS.MAX_ENTRYPOINT_LINES,
      byteCount: Buffer.byteLength(content, 'utf8'),
      wasLineTruncated: true,
      wasByteTruncated: false,
      originalLines,
      originalBytes,
    }
  }
  
  // 其次按字节截断
  if (originalBytes > MEMORY_CONSTANTS.MAX_ENTRYPOINT_BYTES) {
    let truncated = raw
    while (Buffer.byteLength(truncated, 'utf8') > MEMORY_CONSTANTS.MAX_ENTRYPOINT_BYTES) {
      truncated = truncated.slice(0, -100)
    }
    truncated += '\n... (truncated)'
    
    return {
      content: truncated,
      lineCount: truncated