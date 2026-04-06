# 🤖 长周期 Agent 开发框架

> **来源**: Anthropic Engineering - "Effective harnesses for long-running agents"  
> **版本**: 1.0.0  
> **作用域**: 全局 (所有开发类项目)  
> **状态**: ✅ 全局激活

---

## 📋 核心问题

长周期 Agent 开发的核心挑战：
1. **上下文断裂** - 每个新 Session 不记得之前的工作
2. **一次性尝试** - Agent 试图一次完成所有功能，导致半途而废
3. **过早宣布完成** - 看到一些进展就declare job done
4. **环境混乱** - 离开时留下 bug 和未文档化的进度

---

## 🎯 解决方案：双 Agent 模式

### 1️⃣ Initializer Agent (初始化 Agent)

**职责**: 第一个 Session 设置环境

**任务清单**:
```bash
# 1. 创建功能列表文件
claude-features.json  # 所有功能的 JSON 列表，初始都标记为 failing

# 2. 创建进度追踪文件
claude-progress.txt   # 记录每个 Agent 完成的工作

# 3. 创建启动脚本
init.sh              # 一键启动开发环境和测试

# 4. 初始化 Git 仓库
git init
git add .
git commit -m "Initial setup by initializer agent"
```

**功能列表示例** (`claude-features.json`):
```json
[
  {
    "id": "FEAT-001",
    "category": "functional",
    "description": "用户可以打开新聊天并发送消息",
    "steps": [
      "导航到主界面",
      "点击'新聊天'按钮",
      "输入消息并发送",
      "收到 AI 响应"
    ],
    "passes": false,
    "priority": "P0"
  },
  {
    "id": "FEAT-002",
    "category": "functional",
    "description": "用户可以查看聊天历史",
    "steps": [
      "查看侧边栏",
      "点击历史对话",
      "加载对话内容"
    ],
    "passes": false,
    "priority": "P1"
  }
]
```

---

### 2️⃣ Coding Agent (开发 Agent)

**职责**: 每个 Session 实现一个功能

**标准流程**:
```bash
# Session 开始 - 了解状态
pwd                          # 查看工作目录
cat claude-progress.txt      # 阅读进度记录
cat claude-features.json     # 查看功能列表
git log --oneline -20        # 查看最近的提交

# 启动环境
./init.sh                    # 启动开发服务器

# 基础测试
# 运行端到端测试，确保基础功能正常

# 选择一个功能
# 从功能列表中选择优先级最高的未完成功能

# 实现功能
# 只实现一个功能，不要贪多

# 测试验证
# 端到端测试，确保功能正常工作

# Session 结束 - 清理现场
git add .
git commit -m "feat: 实现 XX 功能 (FEAT-001)"
echo "Session 完成：实现了 FEAT-001" >> claude-progress.txt
```

---

## 📊 核心文件

### 1. claude-features.json (功能列表)

**规则**:
- ✅ 只能修改 `passes` 字段（从 false 改为 true）
- ❌ 不允许删除或修改测试内容
- ❌ 不允许因为测试失败而修改测试

**格式**:
```json
[
  {
    "id": "FEAT-编号",
    "category": "功能分类",
    "description": "功能描述",
    "steps": ["步骤 1", "步骤 2", "..."],
    "passes": false,
    "priority": "P0|P1|P2",
    "implemented_by": "Session ID",
    "implemented_at": "2026-03-17"
  }
]
```

### 2. claude-progress.txt (进度追踪)

**格式**:
```markdown
# 项目进度日志

## Session 1 (2026-03-17 08:00)
- Initializer Agent 完成
- 创建了功能列表 (50 个功能)
- 创建了 init.sh 启动脚本
- Git 仓库初始化

## Session 2 (2026-03-17 08:20)
- Coding Agent 完成
- 实现了 FEAT-001: 用户登录
- Git 提交：feat: 实现用户登录 (FEAT-001)

## Session 3 (2026-03-17 08:40)
- Coding Agent 完成
- 实现了 FEAT-002: 提示词优化
- Git 提交：feat: 实现提示词优化 (FEAT-002)
```

### 3. init.sh (启动脚本)

**内容**:
```bash
#!/bin/bash
# 一键启动开发环境

# 1. 启动后端
cd backend && python3 -m uvicorn app.main:app --reload &

# 2. 启动前端
cd frontend && npm run dev &

# 3. 等待服务启动
sleep 5

# 4. 运行基础测试
./run_tests.sh

# 5. 打开浏览器
open http://localhost:3000
```

---

## 🎯 开发流程

### Phase 1: 初始化 (Session 1)

**Initializer Agent 执行**:

```bash
# 1. 创建项目结构
mkdir -p backend frontend tests docs

# 2. 创建功能列表
# 根据用户需求，列出 50-200 个具体功能
# 每个功能都有明确的测试步骤
# 所有功能初始状态都是 passes: false

# 3. 创建进度文件
echo "# 项目进度日志" > claude-progress.txt

# 4. 创建启动脚本
cat > init.sh << 'EOF'
#!/bin/bash
# 启动开发环境
...
EOF
chmod +x init.sh

# 5. 初始化 Git
git init
git add .
git commit -m "Initial setup by initializer agent"

# 6. 记录进度
echo "## Session 1 - Initializer" >> claude-progress.txt
echo "- 创建了功能列表" >> claude-progress.txt
echo "- 创建了启动脚本" >> claude-progress.txt
```

---

### Phase 2: 增量开发 (Session 2-N)

**Coding Agent 执行**:

```bash
# === Session 开始 (5 分钟) ===

# 1. 了解环境
pwd
ls -la

# 2. 阅读进度
cat claude-progress.txt | tail -20
cat claude-features.json | python3 -c "
import json, sys
features = json.load(sys.stdin)
done = sum(1 for f in features if f['passes'])
total = len(features)
print(f'进度：{done}/{total} ({done/total*100:.1f}%)')
pending = [f for f in features if not f['passes']]
print('待完成:')
for f in pending[:5]:
    print(f\"  - {f['id']}: {f['description'][:50]}...\")
"

# 3. 查看 Git 历史
git log --oneline -10

# 4. 启动环境
./init.sh

# 5. 基础测试
# 确保现有功能正常

# === 功能开发 (10-15 分钟) ===

# 6. 选择一个功能
# 选择优先级最高的未完成功能

# 7. 实现功能
# 只实现这一个功能，不要贪多

# 8. 测试验证
# 端到端测试，确保功能正常
# 只有测试通过才能标记为 passes: true

# === Session 结束 (5 分钟) ===

# 9. 更新功能列表
# 将 passes 改为 true

# 10. Git 提交
git add .
git commit -m "feat: 实现 XXX (FEAT-XXX)"

# 11. 记录进度
echo "## Session X - $(date)" >> claude-progress.txt
echo "- 实现了 FEAT-XXX: XXX 功能" >> claude-progress.txt
echo "- Git 提交：feat: 实现 XXX (FEAT-XXX)" >> claude-progress.txt

# 12. 检查点
# 确保环境干净，没有 bug
# 确保文档完整
```

---

## ✅ 关键原则

### 1. 增量开发
```
❌ 错误：一次实现 10 个功能
✅ 正确：一次实现 1 个功能，测试通过后再继续
```

### 2. 测试驱动
```
❌ 错误：写完代码就标记完成
✅ 正确：端到端测试通过后才能标记 passes: true
```

### 3. 环境干净
```
❌ 错误：留下 bug 和混乱的代码
✅ 正确：每次提交都是可合并到 main 的质量
```

### 4. 文档完整
```
❌ 错误：不记录进度
✅ 正确：每次 Session 都更新 claude-progress.txt
```

---

## 📈 进度追踪

### 功能完成度
```bash
# 查看进度
cat claude-features.json | python3 -c "
import json, sys
features = json.load(sys.stdin)
done = sum(1 for f in features if f['passes'])
total = len(features)
print(f'完成度：{done}/{total} ({done/total*100:.1f}%)')

# 按分类统计
from collections import Counter
cats = Counter(f['category'] for f in features)
done_cats = Counter(f['category'] for f in features if f['passes'])
print('\\n分类统计:')
for cat in cats:
    print(f\"  {cat}: {done_cats[cat]}/{cats[cat]}\")
"
```

### Git 历史
```bash
# 查看提交历史
git log --oneline

# 查看最近提交详情
git show --stat
```

---

## 🎯 最佳实践

### 1. 功能拆分
```
❌ 太大：实现用户系统
✅ 合适：实现用户注册功能
✅ 合适：实现用户登录功能
✅ 合适：实现密码重置功能
```

### 2. 测试验证
```bash
# 端到端测试示例
# 测试用户登录
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 验证响应
# 必须返回 access_token 才算通过
```

### 3. 提交规范
```bash
# 好的提交信息
feat: 实现用户登录 (FEAT-002)
fix: 修复登录页面的表单验证 bug
docs: 更新 API 文档

# 不好的提交信息
更新代码
修复 bug
```

---

## 🔧 工具集成

### 自动化工具
```python
# 进度检查脚本
def check_progress():
    with open('claude-features.json') as f:
        features = json.load(f)
    
    done = sum(1 for f in features if f['passes'])
    total = len(features)
    percent = done / total * 100
    
    print(f"进度：{done}/{total} ({percent:.1f}%)")
    
    # 返回未完成的功能
    return [f for f in features if not f['passes']]

# 功能选择
def select_next_feature(pending_features):
    # 按优先级排序
    priority_order = {'P0': 0, 'P1': 1, 'P2': 2}
    sorted_features = sorted(
        pending_features,
        key=lambda f: priority_order.get(f.get('priority', 'P2'), 2)
    )
    
    # 返回最高优先级的功能
    return sorted_features[0]
```

---

## 📊 失败模式与解决方案

| 问题 | Initializer Agent | Coding Agent |
|------|------------------|--------------|
| **过早宣布完成** | 创建功能列表，所有功能初始为 failing | 每次只实现一个功能，测试通过才能标记 |
| **留下混乱环境** | 创建进度文件和 Git 仓库 | Session 开始阅读进度，结束提交并记录 |
| ** premature 标记完成** | 设置明确的测试步骤 | 端到端测试通过后才能标记 passes: true |
| **不知道如何运行** | 创建 init.sh 启动脚本 | Session 开始运行 init.sh |

---

## 🚀 快速开始模板

### 项目结构
```
my-project/
├── claude-features.json    # 功能列表
├── claude-progress.txt     # 进度追踪
├── init.sh                # 启动脚本
├── run_tests.sh           # 测试脚本
├── .git/                  # Git 仓库
├── backend/               # 后端代码
├── frontend/              # 前端代码
└── docs/                  # 文档
```

### Initializer Agent 提示词
```markdown
你是一个初始化 Agent。你的任务是设置项目环境：

1. 创建 claude-features.json
   - 根据用户需求列出所有功能
   - 每个功能都有明确的测试步骤
   - 所有功能初始状态：passes: false

2. 创建 claude-progress.txt
   - 记录 Initializer Agent 完成的工作

3. 创建 init.sh
   - 一键启动开发环境
   - 运行基础测试

4. 初始化 Git 仓库
   - git init
   - git add .
   - git commit -m "Initial setup"

5. 记录进度
   - 更新 claude-progress.txt
```

### Coding Agent 提示词
```markdown
你是一个开发 Agent。你的任务是一次实现一个功能：

Session 开始:
1. pwd - 查看工作目录
2. cat claude-progress.txt - 阅读进度
3. cat claude-features.json - 查看功能列表
4. git log --oneline -20 - 查看最近提交
5. ./init.sh - 启动开发环境
6. 运行基础测试 - 确保现有功能正常

功能开发:
7. 选择一个未完成的最高优先级功能
8. 只实现这一个功能
9. 端到端测试验证
10. 只有测试通过才能标记 passes: true

Session 结束:
11. 更新 claude-features.json (passes: true)
12. git add . && git commit -m "feat: XXX (FEAT-XXX)"
13. 更新 claude-progress.txt
14. 确保环境干净，没有 bug
```

---

## 📝 更新日志

### v1.0.0 (2026-03-17)
- ✅ 基于 Anthropic Engineering 文章创建
- ✅ 双 Agent 模式（Initializer + Coding）
- ✅ 功能列表系统
- ✅ 进度追踪机制
- ✅ 启动脚本模板
- ✅ 端到端测试要求

---

*全局生效 - 所有开发类项目自动使用*  
*最后更新：2026-03-17*  
*来源：https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents*
