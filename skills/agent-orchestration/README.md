# 🤖 Agent Orchestration Skill - 多 Agent 协作编排

> **Created**: 2026-03-17  
> **Version**: 1.0.0  
> **Status**: ✅ Active

## 技能概述
基于 LangGraph、AutoGen、CrewAI 等主流框架的最佳实践，实现高效的多 Agent 协作编排。

## 核心能力
1. **角色定义** - 明确每个 Agent 的职责和专长
2. **任务分配** - 智能拆解和分配任务
3. **状态追踪** - 实时监控进度和决策日志
4. **人机协作** - 关键节点的人流环确认

## 应用场景
- 复杂项目管理（如 POT 项目）
- 多 Agent 协作开发
- 技术问题解决
- 学习和研究任务

## 使用方法
```python
# 1. 定义角色
roles = define_roles([...])

# 2. 创建 Agent
agents = create_agents(roles)

# 3. 配置通信
setup_communication(check_interval=20)

# 4. 实施追踪
enable_tracking(log_decisions=True)

# 5. 人机协作
setup_hitl(require_approval_for=["关键决策"])
```

## 参考框架
- LangGraph - 状态管理和人流环
- AutoGen - AgentChat 模式
- CrewAI - 角色定义和任务分配
