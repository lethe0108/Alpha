# ✅ 长周期 Agent 开发框架安装完成

**安装时间**: 2026-03-17 17:20  
**来源**: Anthropic Engineering  
**状态**: 🎉 全局生效

---

## 📋 核心原则

### 1. 双 Agent 模式
- **Initializer Agent** - 第一个 Session 设置环境
- **Coding Agent** - 每个 Session 实现一个功能

### 2. 增量开发
- 一次只实现一个功能
- 测试通过才能标记完成
- 离开时环境必须干净

### 3. 进度追踪
- `claude-features.json` - 功能列表
- `claude-progress.txt` - 进度日志
- Git 提交历史

### 4. 端到端测试
- 每个功能都必须测试
- 只有测试通过才能标记 passes: true
- 不允许因为测试失败而修改测试

---

## 🎯 全局技能列表（5 个）

| 序号 | 技能名称 | 用途 | 状态 |
|------|---------|------|------|
| 1 | **long-running-agents** | 长周期开发框架 | ✅ 新增 ⭐ |
| 2 | **web-search-global** | Brave Search | ✅ |
| 3 | **multi-search-engine** | 17 个搜索引擎 | ✅ |
| 4 | **agent-orchestration** | 多 Agent 协作 | ✅ |
| 5 | **context-engineering** | 上下文工程 | ✅ |

---

## 🚀 立即应用到 POT 项目

### 第一步：创建功能列表
```bash
cd /root/.openclaw/workspace/prompt-master

# 创建 claude-features.json
# 列出所有剩余功能，每个都有测试步骤
```

### 第二步：创建进度文件
```bash
# 创建 claude-progress.txt
# 记录当前已完成的工作
```

### 第三步：创建启动脚本
```bash
# 创建 init.sh
# 一键启动后端 + 前端 + 测试
```

### 第四步：初始化 Git
```bash
git add .
git commit -m "Initial setup by initializer agent"
```

---

## 📊 标准 Session 流程

### Session 开始 (5 分钟)
```bash
pwd
cat claude-progress.txt | tail -20
cat claude-features.json  # 查看进度
git log --oneline -10
./init.sh  # 启动环境
运行基础测试
```

### 功能开发 (10-15 分钟)
```bash
选择一个未完成的功能
实现这个功能
端到端测试
只有测试通过才能标记完成
```

### Session 结束 (5 分钟)
```bash
更新 claude-features.json (passes: true)
git add . && git commit -m "feat: XXX (FEAT-XXX)"
更新 claude-progress.txt
检查环境干净
```

---

## 🎯 POT 项目应用

### 当前状态
- 完成度：85%
- 剩余：15%

### 剩余功能列表
```json
[
  {
    "id": "FEAT-041",
    "description": "前端完整联调测试",
    "passes": false,
    "priority": "P0"
  },
  {
    "id": "FEAT-042",
    "description": "授权系统完整测试",
    "passes": false,
    "priority": "P0"
  },
  {
    "id": "FEAT-043",
    "description": "性能基准测试",
    "passes": false,
    "priority": "P1"
  },
  {
    "id": "FEAT-044",
    "description": "Bug 修复",
    "passes": false,
    "priority": "P1"
  }
]
```

---

**南哥，长周期 Agent 开发框架已安装并全局生效！现在所有开发项目都会自动使用这个最佳实践！** 🎉

**下次 Session 开始，我会按照这个框架执行，确保自我驱动、持续进步！** 🚀
