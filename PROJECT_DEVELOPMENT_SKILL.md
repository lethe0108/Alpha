# 🚀 项目开发技能 - 完整使用指南

**创建时间**: 2026-03-17 17:55  
**状态**: ✅ 全局激活  
**模式**: 多 Agent 并发 + Mailbox + 自我驱动

---

## 📋 全局技能清单（7 个）

| 优先级 | 技能名称 | 用途 | 状态 |
|--------|---------|------|------|
| **1** | **project-development** | 项目开发入口 | ✅ 主入口 ⭐ |
| 2 | agent-teams-framework | 多 Agent 框架 | ✅ 底层支持 |
| 3 | long-running-agents | 长周期 Agent | ✅ 最佳实践 |
| 4 | web-search-global | Brave Search | ✅ 搜索 |
| 5 | multi-search-engine | 17 个搜索引擎 | ✅ 搜索 |
| 6 | agent-orchestration | Agent 编排 | ✅ 编排 |
| 7 | context-engineering | 上下文工程 | ✅ 记忆 |

---

## 🎯 快速开始

### 一句话启动项目

```python
from project_development import quick_start

# 启动项目
project = quick_start(
    name="POT - AI 提示词优化工具",
    requirements=[
        "用户认证系统",
        "提示词优化功能",
        "模板库管理"
    ]
)
```

### 详细方式

```python
from project_development import ProjectDevelopment

# 1. 创建项目
project = ProjectDevelopment(
    name="POT - AI 提示词优化工具",
    description="开发一个 AI 提示词优化平台",
    requirements=[
        "用户认证系统",
        "提示词优化功能",
        "模板库管理",
        "授权系统"
    ],
    tech_stack={
        "backend": "FastAPI",
        "frontend": "Vue 3",
        "database": "MySQL"
    },
    deadline="2026-04-27"
)

# 2. 初始化环境
project.initialize()

# 3. 启动开发
project.start()

# 4. 监控进度（每 20 分钟自动发送报告）
while True:
    import time
    time.sleep(60)
    progress = project.get_progress()
    print(f"进度：{progress['percent']:.1f}%")
```

---

## 🏗️ 架构说明

```
用户输入需求
    ↓
ProjectDevelopment (入口)
    ↓
Initializer (初始化环境)
    ↓
┌─────────────────────────────────────────┐
│          Redis Mailbox (消息队列)        │
│  - 任务队列                              │
│  - 结果队列                              │
│  - 发布/订阅                             │
└─────────────────────────────────────────┘
    ↓         ↓         ↓         ↓
Commander  Backend  Frontend  QA  Docs
    ↓         ↓         ↓         ↓    ↓
└─────────────────────────────────────────┘
              ↓
        进度报告 (每 20 分钟)
              ↓
           用户
```

---

## 📖 完整流程

### Step 1: 创建项目

```python
from project_development import ProjectDevelopment

project = ProjectDevelopment(
    # 基本信息
    name="项目名称",
    description="项目描述",
    
    # 需求列表（会自动拆解成功能）
    requirements=[
        "用户认证系统",
        "提示词优化功能",
        "模板库管理"
    ],
    
    # 技术栈
    tech_stack={
        "backend": "FastAPI",
        "frontend": "Vue 3",
        "database": "MySQL"
    },
    
    # 截止日期
    deadline="2026-04-27",
    
    # Agent 配置（可选）
    agent_config={
        "max_agents": 4,  # 最大并发数
        "timeout": 600,   # 超时时间（秒）
        "retry": 3        # 重试次数
    },
    
    # Mailbox 配置（可选）
    mailbox_config={
        "host": "localhost",
        "port": 6379,
        "db": 0
    },
    
    # 报告配置（可选）
    report_config={
        "interval": 1200  # 报告间隔（秒）= 20 分钟
    }
)
```

### Step 2: 初始化环境

```python
project.initialize()

# 自动创建：
# ✅ claude-features.json - 功能列表
# ✅ claude-progress.txt - 进度文件
# ✅ init.sh - 启动脚本
# ✅ Git 仓库初始化
# ✅ Redis Mailbox 验证
```

### Step 3: 启动开发

```python
project.start()

# 自动启动：
# ✅ Commander Agent (总指挥)
# ✅ Backend Agent (后端开发)
# ✅ Frontend Agent (前端开发)
# ✅ QA Agent (测试)
# ✅ Docs Agent (文档)
# ✅ 进度报告 (每 20 分钟)
```

### Step 4: 监控进度

```python
# 查看进度
progress = project.get_progress()
print(f"完成：{progress['done']}/{progress['total']}")
print(f"进度：{progress['percent']:.1f}%")

# 查看当前任务
tasks = project.get_current_tasks()
for task in tasks:
    print(f"{task['agent']}: {task['pending']} 个待处理")

# 查看 Agent 状态
status = project.get_agent_status()
for agent, state in status.items():
    print(f"{agent}: {state}")
```

---

## 📊 进度报告示例

```markdown
# 📊 项目进度报告

**项目**: POT - AI 提示词优化工具  
**时间**: 2026-03-17 18:00  
**进度**: 35% (↑10%)

## 总体进度
- 完成：70/200 功能
- 进行中：3 个任务
- 待完成：127 个功能

## 本次完成
✅ FEAT-070: 用户登录 API
✅ FEAT-071: 登录页面
✅ FEAT-072: 密码加密

## 进行中
🔄 FEAT-073: 授权系统 (Backend, 60%)
🔄 FEAT-074: 模板列表 (Frontend, 30%)
🔄 FEAT-075: 单元测试 (QA, 80%)

## Agent 状态
- Commander: 🟢 运行中
- Backend: 🟢 运行中
- Frontend: 🟢 运行中
- QA: 🟢 运行中
- Docs: 🟢 运行中

## Mailbox 状态
- 任务队列：3 条消息
- 结果队列：0 条消息
- 处理速度：15 任务/小时

## 下次报告
2026-03-17 18:20 (20 分钟后)
```

---

## 🎯 关键特性

### 1. 多 Agent 并发

```
✅ 4-8 个 Agent 同时工作
✅ Redis Mailbox 异步通信
✅ 不互相阻塞
✅ 效率提升 3-5 倍
```

### 2. 自我驱动

```
✅ 每 20 分钟自动检查
✅ 自动推进下一个任务
✅ 完成前不停止
✅ 无需人工催促
```

### 3. 进度透明

```
✅ 每 20 分钟发送报告
✅ 实时更新功能列表
✅ Git 提交历史可查
✅ 随时查看状态
```

### 4. 质量保证

```
✅ 测试通过才能标记完成
✅ QA Agent 独立验证
✅ 文档同步更新
✅ 代码审查
```

---

## 🔧 配置说明

### Agent 配置

```python
agent_config = {
    "max_agents": 4,      # 最大并发 Agent 数 (推荐 4-8)
    "timeout": 600,       # 单个任务超时 (秒)
    "retry": 3,           # 失败重试次数
    "block_on_failure": False  # 失败时是否阻塞
}
```

### Mailbox 配置

```python
mailbox_config = {
    "host": "localhost",  # Redis 主机
    "port": 6379,         # Redis 端口
    "db": 0,              # Redis 数据库
    "password": None,     # 密码（可选）
    "prefix": "mailbox"   # Key 前缀
}
```

### 报告配置

```python
report_config = {
    "interval": 1200,     # 报告间隔 (秒) = 20 分钟
    "send_to": None,      # 报告接收者（邮箱/飞书等）
    "format": "markdown"  # 报告格式
}
```

---

## 📝 文件结构

```
项目目录/
├── claude-features.json    # 功能列表
├── claude-progress.txt     # 进度日志
├── init.sh                # 启动脚本
├── progress_report.md     # 进度报告
├── .git/                  # Git 仓库
├── backend/               # 后端代码
├── frontend/              # 前端代码
└── docs/                  # 文档
```

---

## ⚠️ 注意事项

### 1. Redis 服务

```bash
# 检查 Redis 状态
redis-cli ping  # 应该返回 PONG

# 启动 Redis
redis-server --daemonize yes

# 停止 Redis
redis-cli shutdown
```

### 2. 并发数

```
推荐：4-8 个 Agent
最大：取决于 CPU 和内存
每个 Agent 内存：~50-100MB
每个 Agent CPU: 5-20%
```

### 3. 超时设置

```
单个任务超时：600 秒 (10 分钟)
超时后自动重试：3 次
3 次失败后标记为失败
```

---

## 🚀 完整示例

```python
from project_development import quick_start

# 快速启动项目
project = quick_start(
    name="电商网站",
    requirements=[
        "用户注册登录",
        "商品展示",
        "购物车功能",
        "订单管理",
        "支付集成"
    ],
    tech_stack={
        "backend": "FastAPI",
        "frontend": "Vue 3",
        "database": "MySQL"
    },
    deadline="2026-05-01"
)

# 项目会自动：
# 1. 创建功能列表 (5 个需求 → 50+ 个功能)
# 2. 初始化环境
# 3. 启动 5 个 Agent
# 4. 开始开发
# 5. 每 20 分钟发送报告
# 6. 直到 100% 完成

# 监控进度
while True:
    import time
    time.sleep(300)  # 每 5 分钟检查一次
    
    progress = project.get_progress()
    print(f"进度：{progress['percent']:.1f}%")
    
    if progress['percent'] >= 100:
        print("🎉 项目完成！")
        break
```

---

## 📞 南哥，配置完成！

### 全局技能已就绪

**入口技能**: `project-development`  
**位置**: `/root/.openclaw/skills/project-development/`  
**状态**: ✅ 全局激活（优先级 1）

### 使用方式

```python
# 任何新项目
from project_development import quick_start

project = quick_start(
    name="项目名称",
    requirements=["需求 1", "需求 2", "需求 3"]
)

# 然后就可以不管了
# 它会自动开发，每 20 分钟发送报告
# 直到 100% 完成
```

### 核心优势

1. ✅ **多 Agent 并发** - 4-8 个 Agent 同时工作
2. ✅ **Mailbox 通信** - Redis 异步消息队列
3. ✅ **自我驱动** - 无需催促，自动推进
4. ✅ **进度透明** - 每 20 分钟发送报告

---

**南哥，现在所有开发项目都可以用这个入口技能，一键启动多 Agent 并发开发！** 🚀
