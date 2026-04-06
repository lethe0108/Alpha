# 🤖 Agent Teams Framework - 多 Agent 协作开发框架

> **全局生效**: 所有开发类项目自动使用  
> **来源**: Anthropic + LangGraph + AutoGen + CrewAI  
> **创建时间**: 2026-03-17  
> **状态**: ✅ 全局激活

## 核心模式

### Initializer Agent
- 创建功能列表
- 创建进度文件
- 创建启动脚本
- 初始化 Git

### Commander Agent
- 选择功能
- 分配任务
- 审核成果
- 人机协作

### Specialist Agents
- Backend Agent (后端)
- Frontend Agent (前端)
- QA Agent (测试)
- Docs Agent (文档)

## 核心文件

- `claude-features.json` - 功能列表
- `claude-progress.txt` - 进度追踪
- `init.sh` - 启动脚本

## 自动化

- 每 20 分钟自动检查
- 每 20 分钟自动推进
- 每 20 分钟发送报告

## 文档

详细文档：[SKILL.md](SKILL.md)
