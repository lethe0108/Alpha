# 🚀 项目开发入口技能

> **版本**: 1.0.0  
> **作用域**: 全局 (所有开发类项目)  
> **状态**: ✅ 全局激活  
> **模式**: 多 Agent 并发 + Mailbox 通信 + 自我驱动

---

## 📋 快速开始

### 一句话启动
```python
from project_development import ProjectDevelopment

# 创建项目
project = ProjectDevelopment("项目需求描述")

# 启动开发（自动运行直到完成）
project.start()
```

---

## 🎯 核心能力

### 1. 多 Agent 并发协作
- ✅ Commander Agent (总指挥)
- ✅ Backend Agent (后端开发)
- ✅ Frontend Agent (前端开发)
- ✅ QA Agent (测试)
- ✅ Docs Agent (文档)

### 2. Mailbox 通信
- ✅ Redis 消息队列
- ✅ 异步非阻塞
- ✅ 支持 4-8 个并发 Agent
- ✅ 优先级调度

### 3. 自我驱动
- ✅ 每 20 分钟自动检查
- ✅ 自动推进下一个任务
- ✅ 自动发送进度报告
- ✅ 完成前不停止

---

## 🏗️ 架构设计

```
用户输入需求
    ↓
ProjectDevelopment (入口)
    ↓
Initializer Agent (初始化)
    ↓
┌─────────────────────────────────────────┐
│          Redis Mailbox (消息队列)        │
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

## 📖 完整使用流程

### Step 1: 创建项目

```python
from project_development import ProjectDevelopment

# 创建项目
project = ProjectDevelopment(
    name="POT - AI 提示词优化工具",
    description="开发一个 AI 提示词优化平台，包含 Web 端和浏览器插件",
    requirements=[
        "用户认证系统",
        "提示词优化功能",
        "模板库管理",
        "授权系统"
    ],
    tech_stack=["FastAPI", "Vue 3", "MySQL"],
    deadline="2026-04-27"
)
```

### Step 2: 初始化环境

```python
# 初始化项目环境
project.initialize()

# 这一步会自动：
# 1. 创建 claude-features.json (功能列表)
# 2. 创建 claude-progress.txt (进度文件)
# 3. 创建 init.sh (启动脚本)
# 4. 初始化 Git 仓库
# 5. 启动 Redis Mailbox
```

### Step 3: 启动开发

```python
# 启动多 Agent 开发
project.start()

# 这一步会自动：
# 1. 启动 Commander Agent
# 2. 启动 Backend/Frontend/QA/Docs Agent
# 3. 开始自动开发
# 4. 每 20 分钟发送进度报告
# 5. 直到 100% 完成
```

### Step 4: 监控进度

```python
# 查看实时进度
project.get_progress()

# 查看当前任务
project.get_current_tasks()

# 查看 Agent 状态
project.get_agent_status()

# 接收进度报告（每 20 分钟自动发送）
# 报告会自动发送到用户
```

### Step 5: 项目完成

```python
# 项目完成后自动生成：
# 1. 完整的源代码
# 2. 测试报告
# 3. 部署文档
# 4. 用户手册
# 5. Git 提交历史
```

---

## 🔧 详细配置

### 项目配置

```python
project = ProjectDevelopment(
    # 基本信息
    name="项目名称",
    description="项目描述",
    
    # 需求列表
    requirements=[
        "功能需求 1",
        "功能需求 2",
        "功能需求 3"
    ],
    
    # 技术栈
    tech_stack={
        "backend": "FastAPI",
        "frontend": "Vue 3",
        "database": "MySQL",
        "cache": "Redis"
    },
    
    # 时间要求
    deadline="2026-04-27",
    
    # Agent 配置
    agent_config={
        "max_agents": 4,  # 最大并发 Agent 数
        "timeout": 600,   # 单个任务超时 (秒)
        "retry": 3        # 失败重试次数
    },
    
    # Mailbox 配置
    mailbox_config={
        "host": "localhost",
        "port": 6379,
        "db": 0
    },
    
    # 报告配置
    report_config={
        "interval": 1200,  # 报告间隔 (秒) = 20 分钟
        "send_to": "user@example.com"  # 报告接收者
    }
)
```

---

## 📊 进度报告

### 自动发送（每 20 分钟）

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

## 🎯 分步说明

### Phase 1: Initializer (Session 1)

**做什么**:
```python
# 1. 分析需求
requirements = analyze_requirements(user_input)

# 2. 创建功能列表
features = create_feature_list(requirements)
save_to_json(features, 'claude-features.json')

# 3. 创建进度文件
create_file('claude-progress.txt', '# 项目进度日志\n')

# 4. 创建启动脚本
create_file('init.sh', generate_init_script())

# 5. 初始化 Git
run_command('git init')
run_command('git add .')
run_command('git commit -m "Initial setup"')

# 6. 启动 Mailbox
start_redis_mailbox()
```

**输出**:
- claude-features.json
- claude-progress.txt
- init.sh
- .git/

---

### Phase 2: Commander (Session 2-N)

**做什么**:
```python
# 1. 读取功能列表
features = load_features()

# 2. 选择最高优先级的未完成功能
pending = [f for f in features if not f['passes']]
next_feature = select_priority(pending)

# 3. 分配给合适的 Agent
agent_type = assign_agent(next_feature)
mailbox.send_message(
    to=agent_type,
    content=next_feature,
    from_agent="commander",
    type="task"
)

# 4. 等待结果
result = mailbox.receive_message(
    to="commander",
    timeout=600
)

# 5. 验证结果
if verify_result(result):
    next_feature['passes'] = True
    save_features(features)
```

---

### Phase 3: Specialist Agents (并行)

**Backend Agent**:
```python
while True:
    task = mailbox.receive_message("backend", timeout=300)
    if task:
        # 实现功能
        code = implement_backend(task.content)
        
        # 编写测试
        tests = write_tests(code)
        
        # 运行测试
        if run_tests(tests):
            # 提交代码
            git_commit(f"feat: {task.content['id']}")
            
            # 发送结果
            mailbox.send_message(
                to="commander",
                content={"status": "success"},
                from_agent="backend",
                type="result"
            )
```

**Frontend Agent**: 类似 Backend

**QA Agent**:
```python
while True:
    task = mailbox.receive_message("qa", timeout=300)
    if task:
        # 验证功能
        result = verify_feature(task.content)
        
        # 发送报告
        mailbox.send_message(
            to="commander",
            content={"passed": result},
            from_agent="qa",
            type="result"
        )
```

**Docs Agent**:
```python
while True:
    task = mailbox.receive_message("docs", timeout=300)
    if task:
        # 编写文档
        write_api_docs(task.content)
        update_progress(task.content)
        
        # 提交文档
        git_commit(f"docs: {task.content['id']}")
```

---

## 📝 完整代码示例

### 完整项目文件

```python
# project_development.py

from mailbox import RedisMailbox
from datetime import datetime
import json

class ProjectDevelopment:
    """项目开发入口类"""
    
    def __init__(
        self,
        name: str,
        description: str,
        requirements: list = None,
        tech_stack: dict = None,
        deadline: str = None,
        agent_config: dict = None,
        mailbox_config: dict = None,
        report_config: dict = None
    ):
        self.name = name
        self.description = description
        self.requirements = requirements or []
        self.tech_stack = tech_stack or {}
        self.deadline = deadline
        self.agent_config = agent_config or {}
        self.mailbox_config = mailbox_config or {}
        self.report_config = report_config or {}
        
        # 初始化 Mailbox
        self.task_mailbox = RedisMailbox(prefix="mailbox:tasks")
        self.result_mailbox = RedisMailbox(prefix="mailbox:results")
        
        # Agent 实例
        self.agents = {}
    
    def initialize(self):
        """初始化项目环境"""
        print(f"🚀 初始化项目：{self.name}")
        
        # 1. 创建功能列表
        features = self._create_feature_list()
        with open('claude-features.json', 'w') as f:
            json.dump(features, f, ensure_ascii=False, indent=2)
        
        # 2. 创建进度文件
        with open('claude-progress.txt', 'w') as f:
            f.write(f"# 项目进度日志\n\n")
            f.write(f"## 项目：{self.name}\n")
            f.write(f"## 创建时间：{datetime.now()}\n\n")
        
        # 3. 创建启动脚本
        self._create_init_script()
        
        # 4. 初始化 Git
        self._init_git()
        
        # 5. 启动 Agent
        self._start_agents()
        
        print("✅ 初始化完成")
    
    def start(self):
        """启动开发"""
        print("🚀 启动多 Agent 开发...")
        
        # 启动 Commander
        self._start_commander()
        
        # 启动 Specialist Agents
        self._start_specialists()
        
        # 启动进度报告
        self._start_reporting()
        
        print("✅ 开发已启动，每 20 分钟发送进度报告")
    
    def get_progress(self):
        """获取进度"""
        with open('claude-features.json') as f:
            features = json.load(f)
        
        done = sum(1 for feat in features if feat.get('passes', False))
        total = len(features)
        
        return {
            "done": done,
            "total": total,
            "percent": done / total * 100
        }
    
    def _create_feature_list(self):
        """创建功能列表"""
        features = []
        feature_id = 1
        
        for req in self.requirements:
            features.append({
                "id": f"FEAT-{feature_id:03d}",
                "category": "requirement",
                "description": req,
                "steps": [
                    "实现功能",
                    "编写测试",
                    "验证功能",
                    "编写文档"
                ],
                "passes": False,
                "priority": "P0"
            })
            feature_id += 1
        
        return features
    
    def _create_init_script(self):
        """创建启动脚本"""
        script = """#!/bin/bash
# 项目启动脚本

# 启动 Redis
redis-server --daemonize yes

# 启动后端
cd backend && python3 -m uvicorn app.main:app --reload &

# 启动前端
cd frontend && npm run dev &

# 等待服务
sleep 5

# 运行测试
./run_tests.sh

echo "✅ 所有服务已启动"
"""
        
        with open('init.sh', 'w') as f:
            f.write(script)
        
        import os
        os.chmod('init.sh', 0o755)
    
    def _init_git(self):
        """初始化 Git"""
        import subprocess
        subprocess.run(['git', 'init'], check=True)
        subprocess.run(['git', 'add', '.'], check=True)
        subprocess.run(['git', 'commit', '-m', 'Initial setup'], check=True)
    
    def _start_agents(self):
        """启动 Agent"""
        from agents import CommanderAgent, BackendAgent, FrontendAgent, QAAgent, DocsAgent
        
        self.agents['commander'] = CommanderAgent(self.task_mailbox, self.result_mailbox)
        self.agents['backend'] = BackendAgent(self.task_mailbox, self.result_mailbox)
        self.agents['frontend'] = FrontendAgent(self.task_mailbox, self.result_mailbox)
        self.agents['qa'] = QAAgent(self.task_mailbox, self.result_mailbox)
        self.agents['docs'] = DocsAgent(self.task_mailbox, self.result_mailbox)
    
    def _start_commander(self):
        """启动 Commander"""
        import threading
        threading.Thread(target=self.agents['commander'].run, daemon=True).start()
    
    def _start_specialists(self):
        """启动 Specialist Agents"""
        import threading
        for name in ['backend', 'frontend', 'qa', 'docs']:
            threading.Thread(target=self.agents[name].run, daemon=True).start()
    
    def _start_reporting(self):
        """启动进度报告"""
        import threading
        import time
        
        def report_loop():
            interval = self.report_config.get('interval', 1200)  # 20 分钟
            while True:
                time.sleep(interval)
                self._send_report()
        
        threading.Thread(target=report_loop, daemon=True).start()
    
    def _send_report(self):
        """发送进度报告"""
        progress = self.get_progress()
        
        report = f"""
# 📊 项目进度报告

**项目**: {self.name}
**时间**: {datetime.now()}
**进度**: {progress['percent']:.1f}% ({progress['done']}/{progress['total']})

## 下次报告
20 分钟后
"""
        
        # 这里可以集成邮件、飞书等通知方式
        print(report)


# 使用示例
if __name__ == "__main__":
    project = ProjectDevelopment(
        name="POT - AI 提示词优化工具",
        description="开发一个 AI 提示词优化平台",
        requirements=[
            "用户认证系统",
            "提示词优化功能",
            "模板库管理"
        ],
        tech_stack={
            "backend": "FastAPI",
            "frontend": "Vue 3",
            "database": "MySQL"
        }
    )
    
    project.initialize()
    project.start()
    
    # 保持运行
    import time
    while True:
        time.sleep(60)
```

---

## 🎯 关键原则

### 1. 多 Agent 并发
```
✅ 4-8 个 Agent 同时工作
✅ Mailbox 异步通信
✅ 不互相阻塞
```

### 2. 自我驱动
```
✅ 每 20 分钟自动检查
✅ 自动推进下一个任务
✅ 完成前不停止
```

### 3. 进度透明
```
✅ 每 20 分钟发送报告
✅ 实时更新功能列表
✅ Git 提交历史可查
```

### 4. 质量保证
```
✅ 测试通过才能标记完成
✅ QA Agent 独立验证
✅ 文档同步更新
```

---

## 📝 更新日志

### v1.0.0 (2026-03-17)
- ✅ 初始版本
- ✅ 多 Agent 并发支持
- ✅ Redis Mailbox 集成
- ✅ 自我驱动机制
- ✅ 自动进度报告

---

*全局生效 - 所有开发类项目自动使用*  
*最后更新：2026-03-17*
