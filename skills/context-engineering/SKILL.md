---
name: context-engineering
description: AI Agent 上下文工程技能。当需要管理 AI Agent 的上下文状态、优化 Token 使用、设计多 Agent 协作、处理长周期任务时使用此技能。基于 Anthropic 最佳实践。
metadata:
  { "openclaw": { "emoji": "🧠", "category": "AI Engineering", "version": "1.0.0" } }
---

# 上下文工程 (Context Engineering)

> 基于 Anthropic 最佳实践的 AI Agent 上下文管理技能

## 📚 概述

上下文工程是 Prompt Engineering 的自然演进，专注于**管理和优化 AI Agent 的整个上下文状态**，而不仅仅是编写提示词。

**核心问题**: "什么样的上下文配置最有可能产生模型的期望行为？"

## 🎯 核心原则

### 1. 上下文是有限资源
```
关键认知:
├─ LLM 注意力预算有限
├─ 上下文腐化 (Context Rot): 随 Token 增加，回忆能力下降
├─ 边际收益递减
└─ 需要精心策划每个 Token

实践:
├─ 最小高信号 Token 集
├─ 定期清理和更新
├─ 优先级排序
└─ 动态加载
```

### 2. 系统提示词设计
```
最佳实践:
├─ 清晰直接的语言
├─ 合适的抽象层级 (Goldilocks Zone)
├─ 避免过度硬编码
├─ 避免过于模糊
├─ 使用 XML 标签或 Markdown 分区
└─ 最小但完整的信息集

结构示例:
<background_information>
  项目背景和目标
</background_information>

<instructions>
  具体指令和期望行为
</instructions>

<tool_guidance>
  工具使用说明
</tool_guidance>

<output_description>
  输出格式和要求
</output_description>
```

### 3. 工具设计原则
```
设计原则:
├─ 自包含和独立
├─ 功能不重叠
├─ 清晰的用途说明
├─ Token 高效的返回
├─ 描述性参数
└─ 鼓励高效行为

避免:
├─ 臃肿的工具集
├─ 功能重叠
├─ 模糊的决策点
└─ 返回冗余信息
```

### 4. 示例管理 (Few-shot Prompting)
```
推荐做法:
├─ 多样化典型示例
├─ 覆盖主要场景
├─ 避免边缘案例堆砌
├─ 示例质量 > 数量
└─ 定期更新示例集

示例结构:
<example>
  <input>用户输入</input>
  <output>期望输出</output>
  <explanation>为什么这样处理</explanation>
</example>
```

### 5. 消息历史管理
```
策略:
├─ 保留关键决策点
├─ 摘要长对话
├─ 删除冗余信息
├─ 标记重要上下文
└─ 定期压缩历史

压缩技术:
├─ 对话摘要
├─ 关键点提取
├─ 决策树记录
└─ 知识图谱
```

## 🔄 上下文检索策略

### 1. 即时检索 (Just-in-Time)
```
方法:
├─ 维护轻量级引用 (文件路径、查询、链接)
├─ 运行时动态加载
├─ 按需检索
└─ 避免预加载所有数据

优势:
├─ 节省上下文空间
├─ 保持上下文新鲜
├─ 支持渐进式披露
└─ 模拟人类认知

实现:
```python
class ContextManager:
    def __init__(self):
        self.references = {}  # 轻量级引用
        self.loaded_context = {}  # 已加载上下文
    
    def add_reference(self, key, reference):
        """添加引用 (不加载内容)"""
        self.references[key] = reference
    
    async def load_context(self, key):
        """按需加载上下文"""
        if key not in self.loaded_context:
            reference = self.references[key]
            content = await self.fetch_content(reference)
            self.loaded_context[key] = content
        return self.loaded_context[key]
    
    def prune_context(self, max_tokens):
        """修剪上下文，保持最小集"""
        # 基于优先级和使用频率
        pass
```

### 2. 混合策略 (Hybrid)
```
方法:
├─ 预加载关键数据 (快速)
├─ 运行时自主探索 (灵活)
├─ 根据任务动态调整
└─ 平衡速度和灵活性

适用场景:
├─ 法律/金融 (静态内容多)
├─ 代码分析 (需要探索)
├─ 数据分析 (混合需求)
└─ 长周期任务
```

### 3. 渐进式披露
```
原理:
├─ 分层加载信息
├─ 基于探索逐步发现
├─ 保持工作记忆精简
└─ 利用元数据信号

元数据信号:
├─ 文件层次结构
├─ 命名约定
├─ 时间戳
├─ 文件大小
└─ 关系图谱
```

## 📊 长周期任务管理

### 1. 笔记策略 (Note-taking)
```
目的:
├─ 跨轮次持久化
├─ 关键信息记录
├─ 决策追踪
└─ 状态管理

实现:
```python
class AgentNotes:
    def __init__(self):
        self.notes = {}
        self.decision_log = []
        self.state = {}
    
    def add_note(self, category, content):
        """添加笔记"""
        if category not in self.notes:
            self.notes[category] = []
        self.notes[category].append({
            'content': content,
            'timestamp': datetime.now(),
            'importance': 'high'  # 可调整
        })
    
    def get_summary(self):
        """获取笔记摘要 (用于上下文)"""
        summary = []
        for category, notes in self.notes.items():
            high_priority = [n for n in notes if n['importance'] == 'high']
            summary.append(f"{category}: {len(high_priority)} 关键点")
        return "\n".join(summary)
    
    def prune_old_notes(self, max_age_hours=24):
        """修剪旧笔记"""
        cutoff = datetime.now() - timedelta(hours=max_age_hours)
        for category in self.notes:
            self.notes[category] = [
                n for n in self.notes[category]
                if n['timestamp'] > cutoff or n['importance'] == 'high'
            ]
```

### 2. 状态管理
```
状态类型:
├─ 任务状态 (进行中/完成/阻塞)
├─ 知识状态 (已学习/待探索)
├─ 工具状态 (可用/不可用)
└─ 环境状态 (外部系统状态)

状态更新:
├─ 每轮决策后更新
├─ 关键事件触发
├─ 定期同步
└─ 异常时回滚
```

### 3. 上下文轮换
```
策略:
├─ 基于时间窗口
├─ 基于相关性评分
├─ 基于使用频率
└─ 基于任务阶段

实现:
```python
class ContextRotator:
    def __init__(self, max_context_tokens):
        self.max_tokens = max_context_tokens
        self.context_items = []
    
    def add_item(self, item, priority=1.0):
        """添加上下文项"""
        self.context_items.append({
            'content': item,
            'priority': priority,
            'age': 0,
            'access_count': 0
        })
    
    def get_optimized_context(self):
        """获取优化的上下文"""
        # 增加年龄
        for item in self.context_items:
            item['age'] += 1
        
        # 计算分数 (优先级高、最近访问、年轻的保留)
        scored = []
        for item in self.context_items:
            score = (
                item['priority'] * 3 +
                item['access_count'] * 2 +
                max(0, 10 - item['age'])
            )
            scored.append((score, item))
        
        # 排序并截断
        scored.sort(reverse=True)
        selected = []
        total_tokens = 0
        
        for score, item in scored:
            if total_tokens + len(item['content']) <= self.max_tokens:
                selected.append(item['content'])
                total_tokens += len(item['content'])
        
        return selected
    
    def mark_accessed(self, item_index):
        """标记为已访问 (增加权重)"""
        if item_index < len(self.context_items):
            self.context_items[item_index]['access_count'] += 1
```

## 🛠️ 实践工具

### 1. 上下文监控
```python
class ContextMonitor:
    def __init__(self):
        self.metrics = {
            'total_tokens': 0,
            'context_efficiency': 0,
            'recall_accuracy': 0,
        }
    
    def track_usage(self, tokens_used, task_success):
        """跟踪使用情况"""
        self.metrics['total_tokens'] += tokens_used
        # 计算效率指标
        self.metrics['context_efficiency'] = (
            task_success / max(1, tokens_used / 1000)
        )
    
    def get_recommendations(self):
        """获取优化建议"""
        recommendations = []
        
        if self.metrics['context_efficiency'] < 0.5:
            recommendations.append("上下文效率低，考虑精简 Token")
        
        if self.metrics['recall_accuracy'] < 0.8:
            recommendations.append("回忆准确率下降，考虑上下文轮换")
        
        return recommendations
```

### 2. Token 预算分配
```python
class TokenBudget:
    def __init__(self, total_budget):
        self.total = total_budget
        self.allocations = {
            'system_prompt': 0.1,  # 10%
            'tools': 0.15,         # 15%
            'examples': 0.15,      # 15%
            'history': 0.3,        # 30%
            'dynamic_context': 0.3, # 30%
        }
    
    def get_budget(self, category):
        """获取类别预算"""
        return int(self.total * self.allocations.get(category, 0.1))
    
    def adjust_allocation(self, category, new_percentage):
        """动态调整分配"""
        old_percentage = self.allocations.get(category, 0.1)
        diff = new_percentage - old_percentage
        
        # 从其他类别均匀扣除
        other_categories = [k for k in self.allocations if k != category]
        adjustment = diff / len(other_categories)
        
        self.allocations[category] = new_percentage
        for cat in other_categories:
            self.allocations[cat] -= adjustment
```

### 3. 上下文质量评分
```python
def score_context_quality(context_items):
    """评分上下文质量"""
    scores = {
        'relevance': 0,
        'conciseness': 0,
        'completeness': 0,
        'freshness': 0,
    }
    
    for item in context_items:
        # 相关性评分
        scores['relevance'] += item.get('relevance_score', 0.5)
        
        # 简洁性评分 (Token 效率)
        scores['conciseness'] += 1.0 / max(1, len(item['content']) / 100)
        
        # 完整性评分
        scores['completeness'] += item.get('completeness_score', 0.5)
        
        # 新鲜度评分
        age_hours = (datetime.now() - item['timestamp']).total_seconds() / 3600
        scores['freshness'] += max(0, 1.0 - age_hours / 24)
    
    # 平均分
    total_score = sum(scores.values()) / len(scores) / len(context_items)
    
    return {
        'total_score': total_score,
        'breakdown': scores,
        'recommendation': 'good' if total_score > 0.7 else 'needs_improvement'
    }
```

## 📋 检查清单

### 系统提示词
- [ ] 语言清晰直接
- [ ] 抽象层级合适
- [ ] 避免硬编码逻辑
- [ ] 避免模糊指导
- [ ] 使用分区结构
- [ ] 最小但完整

### 工具集
- [ ] 工具功能独立
- [ ] 无功能重叠
- [ ] 清晰的用途说明
- [ ] Token 高效返回
- [ ] 描述性参数
- [ ] 最小可行集

### 示例管理
- [ ] 多样化典型示例
- [ ] 覆盖主要场景
- [ ] 避免边缘案例堆砌
- [ ] 示例质量优先
- [ ] 定期更新

### 上下文检索
- [ ] 使用轻量级引用
- [ ] 运行时动态加载
- [ ] 渐进式披露
- [ ] 利用元数据信号
- [ ] 混合策略 (如适用)

### 长周期任务
- [ ] 笔记策略实现
- [ ] 状态管理机制
- [ ] 上下文轮换
- [ ] 定期清理
- [ ] 质量监控

---

## 🎯 使用示例

### 示例 1: 多轮对话管理
```python
from context_engineering import ContextManager, AgentNotes

# 初始化
context_mgr = ContextManager()
notes = AgentNotes()

# 添加引用 (不加载内容)
context_mgr.add_reference('project_docs', 'path/to/docs')
context_mgr.add_reference('api_spec', 'path/to/api.json')

# 对话过程中
async def handle_user_message(message):
    # 按需加载上下文
    relevant_docs = await context_mgr.load_context('project_docs')
    
    # 记录决策
    notes.add_note('decisions', f'选择了方案 A，因为...')
    
    # 获取优化的上下文
    context = context_mgr.get_optimized_context(
        max_tokens=100000,
        include_notes=notes.get_summary()
    )
    
    # 调用模型
    response = await call_llm(context, message)
    
    # 更新上下文
    context_mgr.mark_accessed('project_docs')
    context_mgr.prune_context()
    
    return response
```

### 示例 2: 长周期代码任务
```python
from context_engineering import ContextRotator, TokenBudget

# 初始化
rotator = ContextRotator(max_context_tokens=100000)
budget = TokenBudget(total_budget=200000)

# 添加初始上下文
rotator.add_item(system_prompt, priority=3.0)
rotator.add_item(tool_definitions, priority=2.0)
rotator.add_item(project_structure, priority=1.5)

# 任务执行过程
async def execute_coding_task(task):
    while not task.is_complete:
        # 获取优化上下文
        context = rotator.get_optimized_context()
        
        # 检查 Token 预算
        if len(context) > budget.get_budget('history'):
            # 压缩历史
            context = compress_history(context)
        
        # 执行步骤
        step_result = await llm_step(context, task.current_step)
        
        # 记录结果
        rotator.add_item(step_result, priority=1.0)
        rotator.mark_accessed(-1)
        
        # 定期清理
        if task.step_count % 10 == 0:
            rotator.prune_old_items(max_age_hours=2)
```

---

## 📚 参考资源

- [Anthropic Prompt Engineering](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview)
- [Model Context Protocol](https://modelcontextprotocol.io/docs/getting-started/intro)
- [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
- [Writing Tools for AI Agents](https://www.anthropic.com/engineering/writing-tools-for-agents)

---

*版本：1.0.0*  
*创建时间：2026-03-17*  
*基于：Anthropic Context Engineering Best Practices*
