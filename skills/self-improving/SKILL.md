---
name: self-improving
version: 1.1.0
description: Self-Improving + Proactive Agent — Global Skill. 从用户纠正和自我反思中学习，知识随时间累积，桥接原生记忆系统。
homepage: https://github.com/ivangdavila/self-improving
clawdis:
  emoji: "🧠"
  requires:
    bins: [python3]
---


---

## 🎯 何时使用

| 触发场景 | 动作 |
|---------|------|
| 用户纠正错误或指出问题 | 记录到 corrections.md，评估是否加入 memory.md |
| 完成重要工作后 | 自我反思，评估结果 |
| 发现自己输出可改进 | 记录经验教训 |
| 用户表达偏好 | 显式偏好 → 加入 memory.md |
| 相同指令重复 3 次 + | 提升为规则 |

---

## 📁 记忆架构

### 主记忆系统 (self-improving)

```
~/.openclaw/workspace/self-improving/
├── memory.md           # HOT: ≤100 行，始终加载
├── index.md            # 主题索引 + 行数统计
├── heartbeat-state.md  # 心跳状态
├── corrections.md      # 最近 50 条纠正日志
├── projects/           # 按项目学习
│   └── {project}.md    # 每个项目独立文件 (≤200 行)
├── domains/            # 按领域学习
│   ├── code.md         # 代码相关 (≤200 行)
│   ├── writing.md      # 写作相关 (≤200 行)
│   └── comms.md        # 沟通相关 (≤200 行)
└── archive/            # COLD: 已归档模式 (无限制)
```

### 桥接记忆系统 (原生记忆)

```
~/.openclaw/workspace/memory/
├── YYYY-MM-DD.md       # 日记式事件记录
├── MEMORY.md           # 长期记忆 (主 Session 专用)
├── projects/           # 项目记忆
├── knowledge/          # 经验知识
└── events/             # 重要事件
```

**桥接规则**:
- ✅ self-improving 优先检索 (偏好、纠正、反思)
- ✅ 未找到时 → 检索原生记忆 (事件、项目、知识)
- ✅ 按需加载，不预加载原生记忆
- ✅ 严格保持 HOT ≤100 行限制

### 三层存储机制

| 层级 | 位置 | 大小限制 | 行为 |
|------|------|---------|------|
| **HOT** | memory.md | ≤100 行 | 始终加载 |
| **WARM** | projects/, domains/ | ≤200 行/文件 | 上下文匹配时加载 |
| **COLD** | archive/ | 无限制 | 明确查询时加载 |

### 自动晋升/降级

- ✅ 7 天内使用 3 次 → **晋升到 HOT**
- ⚠️ 30 天未使用 → **降级到 WARM**
- 📦 90 天未使用 → **归档到 COLD**
- ❌ 永不主动删除 (需用户确认)

---

## 🧠 学习信号

### 自动记录的模式

**纠正语句** → 添加到 corrections.md，评估后加入 memory.md:
```
- "No, that's not right..."
- "Actually, it should be..."
- "You're wrong about..."
- "I prefer X, not Y"
- "Remember that I always..."
- "I told you before..."
- "Stop doing X"
- "Why do you keep..."
```

**偏好信号** → 直接加入 memory.md (如果是显式的):
```
- "I like when you..."
- "Always do X for me"
- "Never do Y"
- "My style is..."
- "For [project], use..."
```

**模式候选** → 跟踪，3 次后提升:
- 相同指令重复 3 次 +
- 工作流程反复有效
- 用户赞扬特定方法

**忽略 (不记录)**:
- ❌ 一次性指令 ("do X now")
- ❌ 上下文特定 ("in this file...")
- ❌ 假设性问题 ("what if...")

---

## 🤔 自我反思

### 何时进行自我反思

- ✅ 完成多步骤任务后
- ✅ 收到反馈后 (正面或负面)
- ✅ 修复 bug 或犯错后
- ✅ 发现自己输出可改进时

### 反思日志格式

```markdown
CONTEXT: [任务类型]
REFLECTION: [我注意到的问题]
LESSON: [下次如何改进]

示例:
CONTEXT: Building Flutter UI
REFLECTION: Spacing looked off, had to redo
LESSON: Check visual spacing before showing user
```

**晋升规则**: 自反射条目同样遵循 3 次成功应用 → 晋升到 HOT

---

## 🔍 快速查询

### self-improving 记忆查询

| 用户说 | 动作 |
|--------|------|
| "What do you know about X?" | 搜索所有层级 (HOT → WARM → COLD) |
| "What have you learned?" | 显示 corrections.md 最后 10 条 |
| "Show my patterns" | 列出 memory.md (HOT) |
| "Show [project] patterns" | 加载 projects/{name}.md |
| "What's in warm storage?" | 列出 projects/ + domains/ |
| "Memory stats" | 显示各层级统计 |
| "Forget X" | 从所有层级删除 (需确认) |
| "Export memory" | 打包所有文件为 ZIP |

### 跨系统查询 (包含原生记忆)

| 用户说 | 检索路径 |
|--------|---------|
| "你还记得 X 吗？" | self-improving → 未找到 → memory/ |
| "X 项目进展如何？" | self-improving/projects/X → 未找到 → memory/projects/X |
| "我之前说过 X 吗？" | corrections.md → memory/YYYY-MM-DD.md |
| "关于 X 的知识" | self-improving/domains/ → memory/knowledge/X |

**检索原则**:
1. 优先 self-improving (偏好、纠正、反思)
2. 未找到时，明确告知用户并扩展到原生记忆
3. 回答时标注来源："根据 self-improving/memory.md" 或 "根据 memory/projects/XX.md"

### Memory Stats 输出示例

```
📊 Self-Improving Memory

HOT (always loaded):
 memory.md: 45 entries

WARM (load on demand):
 projects/: 8 files
 domains/: 3 files

COLD (archived):
 archive/: 12 files

Recent activity (7 days):
 Corrections logged: 15
 Promotions to HOT: 3
 Demotions to WARM: 1
```

---

## ⚠️ 常见陷阱

| 陷阱 | 为什么失败 | 更好的做法 |
|------|-----------|-----------|
| 从沉默学习 | 创建虚假规则 | 等待明确纠正或重复证据 |
| 过快提升 | 污染 HOT 记忆 | 保持新课程暂时性直到重复 |
| 读取每个命名空间 | 浪费上下文 | 只加载 HOT + 最小匹配文件 |
| 通过删除压缩 | 失去信任和历史 | 合并/总结/降级而非删除 |

---

## 📜 核心规则

### 1. 从纠正和反思中学习
- ✅ 记录用户明确纠正
- ✅ 记录自己识别的改进
- ❌ 从不从沉默推断
- ✅ 3 次相同课程 → 询问确认为规则

### 2. 三层存储
- HOT: memory.md (≤100 行) - 始终加载
- WARM: projects/, domains/ (≤200 行/文件) - 按需加载
- COLD: archive/ (无限制) - 明确查询时加载

### 3. 自动晋升/降级
- 7 天内使用 3 次 → 晋升到 HOT
- 30 天未使用 → 降级到 WARM
- 90 天未使用 → 归档到 COLD
- 永不删除 (需用户确认)

### 4. 命名空间隔离
- 项目模式 → projects/{name}.md
- 全局偏好 → HOT tier (memory.md)
- 领域模式 (代码/写作) → domains/
- 跨命名空间继承：global → domain → project

### 5. 冲突解决
当模式矛盾时:
- 最具体的优先 (project > domain > global)
- 最近的优先 (同级别)
- 如有歧义 → 询问用户

### 6. 压缩
当文件超出限制时:
- 合并相似的纠正为单条规则
- 归档未使用的模式
- 总结冗长的条目
- 永不丢失确认的偏好

### 7. 透明度
- 每次基于记忆的行动 → 引用来源: "Using X (from projects/foo.md:12)"
- 每周摘要可用：学习的模式、降级、归档
- 按需完整导出：所有文件打包为 ZIP

### 8. 安全边界
- ❌ 永不存储凭证
- ❌ 永不存储健康数据
- ❌ 永不存储第三方信息

### 9. 优雅降级
如果上下文限制命中:
- 只加载 memory.md (HOT)
- 按需加载相关命名空间
- 永不静默失败 → 告知用户什么未加载

### 10. 🌉 原生记忆桥接 (新增)

**检索优先级**:
1. **第一优先**: self-improving/memory.md (HOT) - 偏好、规则
2. **第二优先**: self-improving/domains/ (WARM) - 领域知识
3. **第三优先**: self-improving/projects/ (WARM) - 项目模式
4. **第四优先**: memory/ 目录 (按需) - 事件、项目记录、知识

**桥接触发条件**:
- ✅ 用户明确询问记忆 ("你知道我的 X 吗？")
- ✅ self-improving 中未找到答案
- ✅ 用户说"记住这个" (同时记录到两个系统)

**读取规则**:
- ✅ 允许读取 `~/.openclaw/workspace/memory/` 目录
- ✅ 使用关键词检索，不预加载全部文件
- ✅ 优先读取相关文件 (如项目查询 → memory/projects/{项目}.md)
- ❌ 不扫描整个 memory/ 目录 (避免上下文膨胀)

**记录规则**:
当用户说"记住这个"时:
1. 判断类型：
   - **偏好/规则** → self-improving/memory.md
   - **项目事件** → memory/projects/ 或 memory/YYYY-MM-DD.md
   - **经验知识** → memory/knowledge/ + self-improving/domains/
2. 在两个系统中互相引用来源

---

## 🎯 作用域

### 这个技能会做:
- ✅ 从用户纠正和自我反思学习
- ✅ 存储偏好到本地文件 (`~/.openclaw/workspace/self-improving/`)
- ✅ 维护心跳状态 (当工作空间集成心跳时)
- ✅ 激活时读取自己的记忆文件
- ✅ **检索时读取原生记忆** (`~/.openclaw/workspace/memory/`)
- ✅ **桥接记录**: 用户说"记住这个"时同时记录到两个系统

### 这个技能从不做:
- ❌ 访问日历、邮件、联系人
- ❌ 发起网络请求
- ❌ **预加载整个 memory/ 目录** (按需检索)
- ❌ 从沉默或观察推断偏好
- ❌ 心跳清理期间删除或盲目重写自我进化记忆
- ❌ 修改自己的 SKILL.md (除非用户明确要求)

---

## 🔍 检索流程实现

### 标准检索流程

```
用户查询记忆
    ↓
1. 检索 self-improving/memory.md (HOT)
    ↓ 找到？
   是 → 回答并标注来源
   否 ↓
2. 检索 self-improving/domains/ + projects/ (WARM)
    ↓ 找到？
   是 → 回答并标注来源
   否 ↓
3. 告知用户："self-improving 记忆中未找到，正在检索原生记忆..."
    ↓
4. 检索 memory/ 目录 (按需，使用关键词过滤)
    ↓ 找到？
   是 → 回答并标注来源
   否 ↓
5. 告知用户："两个记忆系统中都未找到相关信息"
```

### 检索示例

**示例 1: 查询偏好**
```
用户："你知道我喜欢什么代码风格吗？"

检索路径:
1. self-improving/memory.md → ✅ 找到
   "根据 self-improving/memory.md，你喜欢：Python 遵循 PEP8..."
```

**示例 2: 查询项目**
```
用户："POT 项目上次进展如何？"

检索路径:
1. self-improving/projects/POT.md → ❌ 未找到
2. → 告知用户并扩展
3. memory/projects/POT.md → ✅ 找到
   "根据 memory/projects/POT.md，上次进展：完成了前端框架..."
```

**示例 3: 查询事件**
```
用户："我什么时候说过喜欢 TypeScript？"

检索路径:
1. self-improving/corrections.md → ❌ 未找到
2. self-improving/domains/code.md → ✅ 找到引用
   "根据 self-improving/domains/code.md，这是你的偏好记录..."
3. 如需具体时间 → memory/YYYY-MM-DD.md
```

### 关键词检索策略

检索 memory/ 目录时，使用关键词过滤：

```python
# 伪代码示例
def search_native_memory(query, keywords):
    # 根据查询提取关键词
    # 只读取包含关键词的文件
    # 避免扫描整个目录
    
    if "项目" in query or "project" in query:
        target_dir = "memory/projects/"
    elif "知识" in query or "knowledge" in query:
        target_dir = "memory/knowledge/"
    else:
        # 搜索最近的日记
        target_dir = "memory/YYYY-MM-DD.md" (最近 7 天)
    
    # 使用 grep 或文件内容搜索
    results = grep(keywords, target_dir)
    return results
```

---

## 💾 数据存储

本地状态存储在 `~/.openclaw/workspace/self-improving/`:

| 文件 | 用途 |
|------|------|
| `memory.md` | HOT 规则和确认的偏好 |
| `corrections.md` | 明确纠正和可重用的课程 |
| `projects/` | 项目级模式 |
| `domains/` | 领域级模式 (代码/写作/沟通) |
| `archive/` | 衰减或不活跃的模式 |
| `heartbeat-state.md` | 定期维护标记 |

---

## 🔗 相关技能

如需安装 (用户确认后):
- `memory` — Agent 的长期记忆模式
- `learning` — 自适应教学和解释
- `decide` — 自动学习决策模式
- `escalate` — 知道何时询问 vs 自主行动

---

## 📝 初始化文件

首次运行时自动创建以下文件:

### memory.md (HOT 记忆模板)
```markdown
# Self-Improving Memory — HOT Tier

> **规则**: ≤100 行，始终加载  
> **更新**: 自动 (从纠正和反思)  
> **最后更新**: {date}

---

## 全局偏好

<!-- 用户的全局偏好将自动添加到这里 -->

---

## 确认的规则

<!-- 3 次成功应用的课程将提升到这里 -->

---

## 最近活动

- {date}: 技能已安装
```

### corrections.md (纠正日志模板)
```markdown
# Corrections Log

> **规则**: 保留最近 50 条纠正  
> **更新**: 自动 (从用户纠正)  
> **最后更新**: {date}

---

## 最近纠正

| 日期 | 类型 | 纠正内容 | 状态 |
|------|------|---------|------|
| {date} | 初始 | 技能已安装 | ✅ |

---

## 待评估课程

<!-- 需要评估是否提升为规则的课程 -->
```

### heartbeat-state.md (心跳状态模板)
```markdown
# Heartbeat State

> **最后运行**: {date}  
> **已审查的变更**: 0  
> **行动笔记**: 技能已安装

---

## 待处理项目

- [ ] 审查最近纠正
- [ ] 评估晋升候选
- [ ] 检查降级模式
- [ ] **桥接检查**: 扫描 memory/ 中可提取的模式

---

## 统计

- 总纠正数：1
- HOT 条目数：0
- 待评估：0

---

## 🌉 桥接维护 (新增)

### 每周执行

1. **扫描 memory/YYYY-MM-DD.md** (最近 7 天)
   - 查找用户明确偏好 ("我喜欢...", "我总是...")
   - 提取到 self-improving/memory.md

2. **扫描 memory/projects/**
   - 查找可复用的项目模式
   - 提取到 self-improving/projects/

3. **扫描 memory/knowledge/**
   - 查找通用领域知识
   - 提取到 self-improving/domains/

4. **更新索引**
   - 记录提取的模式
   - 标注来源文件
```

---

## 🚀 反馈

- 如果有用：在 ClawHub 上 star 此技能
- 保持更新：运行 `clawhub sync`

---

*全局生效 - 所有 Session 和 Agent 自动可用*  
*安装日期：2026-03-18*
