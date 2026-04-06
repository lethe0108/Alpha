# 🤖 Agent Teams 开发架构

> **版本**: 1.0.0  
> **来源**: Anthropic + LangGraph + AutoGen + CrewAI 最佳实践  
> **作用域**: 全局 (所有开发类项目)  
> **状态**: ✅ 全局激活

---

## 📋 架构概述

整合业界最佳实践的多 Agent 协作开发框架，实现自我驱动、持续进步的项目开发。

### 核心能力
1. **双 Agent 模式** - Initializer + Specialist Agents
2. **功能列表驱动** - claude-features.json
3. **进度追踪** - claude-progress.txt
4. **自动化调度** - 每 20 分钟自动推进
5. **人机协作** - 关键决策人工确认

---

## 🏗️ 架构设计

```
总指挥 Agent (Commander)
    ↓
功能列表 (claude-features.json)
    ↓
专业 Agent 团队:
├─ 后端开发 Agent
├─ 前端开发 Agent  
├─ 测试 QA Agent
└─ 文档 Agent
    ↓
进度追踪 (claude-progress.txt)
    ↓
自动调度器 (每 20 分钟)
```

---

## 🎯 核心组件

### 1. Initializer Agent (初始化 Agent)

**职责**: 项目启动时设置环境

**任务清单**:
```bash
# 1. 创建功能列表
claude-features.json  # 所有功能，初始 passes: false

# 2. 创建进度文件
claude-progress.txt   # 记录每个 Session 的工作

# 3. 创建启动脚本
init.sh              # 一键启动开发环境

# 4. 初始化 Git
git init
git add .
git commit -m "Initial setup"
```

**功能列表示例**:
```json
[
  {
    "id": "FEAT-001",
    "category": "backend",
    "description": "用户注册 API",
    "steps": [
      "创建用户模型",
      "实现注册接口",
      "编写单元测试",
      "端到端测试"
    ],
    "passes": false,
    "priority": "P0"
  }
]
```

---

### 2. Commander Agent (总指挥 Agent)

**职责**: 项目统筹、任务分配、进度监控

**核心方法**:
```python
class CommanderAgent:
    def select_feature(self, features: list) -> dict:
        """选择下一个功能"""
        pending = [f for f in features if not f['passes']]
        sorted_features = sorted(
            pending,
            key=lambda f: {'P0': 0, 'P1': 1, 'P2': 2}[f.get('priority', 'P2')]
        )
        return sorted_features[0]
    
    def assign_task(self, feature: dict) -> str:
        """分配任务给合适的 Agent"""
        if 'API' in feature['description'] or '后端' in feature['description']:
            return 'backend'
        elif '页面' in feature['description'] or '前端' in feature['description']:
            return 'frontend'
        elif '测试' in feature['description']:
            return 'qa'
        elif '文档' in feature['description']:
            return 'docs'
        else:
            return 'backend'
    
    def human_in_loop(self, decision: str, options: list):
        """需要用户确认的决策"""
        print(f"🤔 需要决策：{decision}")
        for i, opt in enumerate(options, 1):
            print(f"{i}. {opt}")
        # 等待用户输入
        choice = input("请选择：")
        return options[int(choice) - 1]
```

---

### 3. Specialist Agents (专业 Agent)

#### Backend Agent
```python
class BackendAgent:
    role = "后端开发工程师"
    expertise = ["FastAPI", "MySQL", "API 开发"]
    
    def implement_feature(self, feature: dict):
        # 1. 编写代码
        code = self.write_code(feature)
        
        # 2. 编写测试
        tests = self.write_tests(feature)
        
        # 3. 运行测试
        result = self.run_tests(tests)
        
        # 4. 提交代码
        if result['passed']:
            self.git_commit(f"feat: {feature['id']}")
            return {'success': True}
        return {'success': False}
```

#### Frontend Agent
```python
class FrontendAgent:
    role = "前端开发工程师"
    expertise = ["Vue 3", "TypeScript", "UI/UX"]
    
    def implement_feature(self, feature: dict):
        # 类似 Backend Agent
        pass
```

#### QA Agent
```python
class QAAgent:
    role = "质量保证工程师"
    expertise = ["单元测试", "集成测试", "端到端测试"]
    
    def verify_feature(self, feature: dict):
        # 运行测试套件
        results = []
        for step in feature['steps']:
            results.append(self.run_test(step))
        
        return {
            'passed': all(results),
            'report': self.generate_report(results)
        }
```

#### Docs Agent
```python
class DocsAgent:
    role = "技术文档工程师"
    expertise = ["API 文档", "用户手册", "技术写作"]
    
    def document_feature(self, feature: dict, code_changes: dict):
        # 1. 更新 API 文档
        if 'API' in code_changes:
            self.update_api_docs(code_changes['API'])
        
        # 2. 更新进度
        self.update_progress(feature)
        
        # 3. Git 提交
        self.git_commit(f"docs: {feature['id']}")
```

---

## 🔄 标准流程

### Session 流程（20 分钟）

```
┌─────────────────────────────────────────┐
│ Session 开始 (5 分钟)                    │
├─────────────────────────────────────────┤
│ 1. pwd - 查看工作目录                   │
│ 2. cat claude-progress.txt - 阅读进度  │
│ 3. cat claude-features.json - 查看列表 │
│ 4. git log --oneline -20 - 查看提交    │
│ 5. ./init.sh - 启动环境                 │
│ 6. 运行基础测试 - 确保正常             │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ 功能开发 (10-15 分钟)                    │
├─────────────────────────────────────────┤
│ 7. Commander 选择功能                    │
│ 8. Commander 分配任务                    │
│ 9. Specialist Agent 实现                 │
│ 10. QA Agent 验证                        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Session 结束 (5 分钟)                    │
├─────────────────────────────────────────┤
│ 11. 更新功能列表 (passes: true)         │
│ 12. Docs Agent 编写文档                 │
│ 13. Git 提交                            │
│ 14. 更新进度文件                        │
│ 15. 检查环境干净                        │
└─────────────────────────────────────────┘
```

---

## 📊 核心文件

### 1. claude-features.json

**规则**:
- ✅ 只能修改 `passes` 字段
- ❌ 不允许删除测试
- ❌ 不允许因为测试失败而修改测试

**格式**:
```json
[
  {
    "id": "FEAT-编号",
    "category": "分类",
    "description": "功能描述",
    "steps": ["步骤 1", "步骤 2"],
    "passes": false,
    "priority": "P0|P1|P2",
    "implemented_by": "Agent 名",
    "implemented_at": "2026-03-17"
  }
]
```

### 2. claude-progress.txt

**格式**:
```markdown
# 项目进度日志

## Session 1 (2026-03-17 08:00)
- Initializer Agent 完成
- 创建了功能列表 (50 个功能)
- 创建了 init.sh
- Git 仓库初始化

## Session 2 (2026-03-17 08:20)
- Commander Agent 完成
- Backend Agent 实现了 FEAT-001
- QA Agent 验证通过
- Git 提交：feat: FEAT-001
```

### 3. init.sh

**内容**:
```bash
#!/bin/bash
# 一键启动开发环境

# 1. 启动后端
cd backend && python3 -m uvicorn app.main:app --reload &

# 2. 启动前端
cd frontend && npm run dev &

# 3. 等待服务
sleep 5

# 4. 运行基础测试
./run_tests.sh
```

---

## ⏰ 自动化调度

### 自动检查器
```python
import schedule
import time

def auto_check():
    """每 20 分钟自动检查"""
    # 1. 读取进度
    with open('claude-features.json') as f:
        features = json.load(f)
    
    # 2. 计算完成度
    done = sum(1 for f in features if f['passes'])
    total = len(features)
    percent = done / total * 100
    
    # 3. 如果还有未完成，继续
    if percent < 100:
        start_next_session()
        generate_progress_report()
    else:
        log_progress('项目完成！')

# 每 20 分钟执行
schedule.every(20).minutes.do(auto_check)
```

### 进度报告生成器
```python
def generate_progress_report():
    """生成进度报告"""
    features = load_features()
    
    # 统计
    done = sum(1 for f in features if f['passes'])
    total = len(features)
    
    # 生成报告
    report = f"""
# 📊 项目进度报告

**时间**: {datetime.now()}

## 总体进度
- 完成：{done}/{total} ({done/total*100:.1f}%)

## 本次完成
- FEAT-XXX: XXX 功能

## 下次计划
- FEAT-XXX: XXX 功能
"""
    
    # 发送给用户
    send_to_user(report)
```

---

## ✅ 关键原则

### 1. 增量开发
```
❌ 一次实现 10 个功能
✅ 一次实现 1 个功能
```

### 2. 测试驱动
```
❌ 写完就标记完成
✅ 测试通过才能标记
```

### 3. 环境干净
```
❌ 留下 bug 和混乱
✅ 每次提交都可合并
```

### 4. 文档完整
```
❌ 不记录进度
✅ 每次 Session 都记录
```

---

## 📊 失败模式与解决

| 问题 | 解决方案 |
|------|---------|
| **过早宣布完成** | 功能列表 + 测试步骤 |
| **留下混乱环境** | 进度文件 + Git 提交 |
| ** premature 标记** | 端到端测试验证 |
| **不知道如何运行** | init.sh 启动脚本 |

---

## 🚀 快速开始

### 1. 创建 Initializer Agent
```bash
# 创建功能列表
python3 -c "
from initializer import InitializerAgent
agent = InitializerAgent()
agent.setup_environment('项目需求描述')
"
```

### 2. 启动自动化
```bash
# 启动调度器
python3 -c "
from scheduler import AutoScheduler
scheduler = AutoScheduler()
scheduler.start()
"
```

### 3. 监控进度
```bash
# 查看实时进度
cat claude-progress.txt | tail -20
cat claude-features.json | python3 -c "
import json, sys
f = json.load(sys.stdin)
done = sum(1 for x in f if x['passes'])
print(f'进度：{done}/{len(f)}')
"
```

---

## 📝 更新日志

### v1.0.0 (2026-03-17)
- ✅ 基于 Anthropic/LangGraph/AutoGen/CrewAI 创建
- ✅ Initializer + Specialist Agents 模式
- ✅ 功能列表驱动
- ✅ 进度追踪机制
- ✅ 自动化调度器
- ✅ 人机协作接口

---

*全局生效 - 所有开发类项目自动使用*  
*最后更新：2026-03-17*
