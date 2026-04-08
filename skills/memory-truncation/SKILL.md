---
name: memory-truncation
scope: global
summary: "Memory 硬截断保护 - 防止 MEMORY.md 溢出导致 token 超限"
description: Memory 硬截断保护技能。防止 MEMORY.md 文件溢出导致 token 超限，确保 Memory 系统稳定运行。全局技能。
read_when:
  - 管理 MEMORY.md 文件大小
  - 防止 context 溢出
  - 优化 Memory 使用
title: "Memory Truncation"
---

# Memory 硬截断保护

## 核心规则

MEMORY.md 是长记忆文件，但**必须**有硬性大小限制，防止 token 溢出导致模型无法正常工作。

### 硬性上限

| 限制类型 | 上限值 | 说明 |
|----------|--------|------|
| 行数上限 | 200 行 | MAX_ENTRYPOINT_LINES |
| 字节上限 | 25 KB | MAX_ENTRYPOINT_BYTES (~25,000 bytes) |
| 主题文件 | 500 行 / 100 KB | MAX_TOPIC_FILE_LINES/BYTES |

**⚠️ 重要**: 这些是**硬上限**，不可突破。超过时必须截断。

---

## 截断策略

### 1. 优先保留内容

| 优先级 | 内容类型 | 保留策略 |
|--------|----------|----------|
| P0 | 核心身份 | 必须保留（我是谁、主人是谁） |
| P1 | 重要关系 | 必须保留（朋友、关键联系人） |
| P1 | 核心原则 | 必须保留（安全规则、工作规范） |
| P2 | 重要里程碑 | 尽量保留（重大事件、学习成果） |
| P3 | 进行中项目 | 按重要性保留 |
| P4 | 待办事项 | 可以删减 |
| P5 | 详细记录 | 可以总结压缩 |

### 2. 截断执行方式

当文件超过上限时，执行以下步骤：

1. **优先保留**: 核心身份、重要关系、核心原则（优先级 P0-P1）
2. **压缩中间**: 将详细记录压缩为简要摘要
3. **删除末尾**: 删除过时的待办事项和次要内容
4. **添加标记**: 在末尾添加截断标记

```markdown
... (截断，详细内容见 memory/ 目录)
```

### 3. 溢出保护机制

如果单次截断后仍超限：

1. 二次截断 - 删除更多次要内容
2. 分离存储 - 将详细内容移至 `memory/YYYY-MM-DD.md` 主题文件
3. 紧急压缩 - 使用 AI 生成压缩摘要

---

## 使用截断工具

### JavaScript 实现

位置: `~/.openclaw/skills/memory-truncation/truncate.js`

```javascript
const MEMORY_CONSTANTS = {
  MAX_ENTRYPOINT_LINES: 200,
  MAX_ENTRYPOINT_BYTES: 25_000,
};

function truncateEntrypointContent(raw) {
  const lines = raw.split('\n');
  
  // 行数截断
  if (lines.length > MEMORY_CONSTANTS.MAX_ENTRYPOINT_LINES) {
    const truncated = lines.slice(0, MEMORY_CONSTANTS.MAX_ENTRYPOINT_LINES);
    truncated.push('\n... (truncated)');
    return truncated.join('\n');
  }
  
  // 字节截断
  const byteLength = Buffer.byteLength(raw, 'utf8');
  if (byteLength > MEMORY_CONSTANTS.MAX_ENTRYPOINT_BYTES) {
    let truncated = raw;
    while (Buffer.byteLength(truncated, 'utf8') > MEMORY_CONSTANTS.MAX_ENTRYPOINT_BYTES) {
      truncated = truncated.slice(0, -100);
    }
    truncated += '\n... (truncated)';
    return truncated;
  }
  
  return raw;
}
```

### CLI 工具

位置: `~/.openclaw/skills/memory-truncation/truncate-cli.js`

```bash
# 检查文件大小
node truncate-cli.js check ~/.openclaw/workspace/MEMORY.md

# 执行截断
node truncate-cli.js truncate ~/.openclaw/workspace/MEMORY.md

# 分离存储
node truncate-cli.js split ~/.openclaw/workspace/MEMORY.md
```

---

## 最佳实践

### 日常维护

1. **定期检查**: 每周检查 MEMORY.md 大小
2. **主动清理**: 删除过时内容和已完成的待办
3. **分离存储**: 详细日志存放在 `memory/YYYY-MM-DD.md`
4. **压缩摘要**: 里程碑事件用简要摘要替代详细描述

### 写入原则

1. **只写重要信息** - 不是所有对话都要记录
2. **结构化存储** - 使用标题和分类便于查找
3. **定期回顾** - 梳理记忆，删除冗余
4. **备份存档** - 重要详细内容存档到主题文件

---

## 与 OpenClaw 集成

### Memory 插件机制

OpenClaw 使用 `memory-state.ts` 提供插件式 Memory 注册：

```typescript
registerMemoryPromptSection(builder)  // 注册 prompt builder
buildMemoryPromptSection(params)      // 构建 prompt section
```

本技能作为 Memory 使用的指导规范，不直接修改 OpenClaw 核心。

Agent 在读写 MEMORY.md 时应遵循此技能的截断规则。

---

## 相关资源

- **Claude Code 源码分析**: `~/.openclaw/skills/claude-code-architecture/`
- **MEMORY.md**: `~/.openclaw/workspace/MEMORY.md`
- **Memory 目录**: `~/.openclaw/workspace/memory/`

---

*创建时间: 2026-04-07*
*版本: 1.0.0*
*基于 Claude Code 架构分析*