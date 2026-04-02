---
name: opencode-integration
description: OpenCode 集成技能。使用 OpenCode 进行代码生成、项目管理和 AI 编码任务。支持 Plan/Build 工作流、会话管理、模型选择。
scope: global
priority: 2
triggers:
  - 用户要求写代码或开发功能
  - 需要代码审查或重构
  - 创建新项目或初始化
  - 管理 OpenCode 会话
dependencies:
  - opencode (CLI 工具)
  - sessions_spawn (子 Agent 孵化)
metadata:
  author: 小 p (Alpha)
  created: 2026-03-20
  updated: 2026-03-26
  tags: [编码，OpenCode, 开发，AI 编程]
---

# OpenCode 集成技能

> **版本**: 1.0.0  
> **创建时间**: 2026-03-20  
> **作者**: 小 p (Alpha)  
> **状态**: 🟢 已激活

---

## 📋 技能概述

**OpenCode** 是开源 AI 编码助手，本技能提供：
- OpenCode 命令封装和调用
- Plan/Build 工作流管理
- 会话创建、附加、导出
- 模型和 Provider 配置
- 项目初始化和管理

---

## 🔧 安装状态

```bash
# OpenCode 版本
opencode --version  # v1.2.27

# 安装位置
which opencode  # /usr/bin/opencode

# 配置目录
~/.config/opencode/

# 数据目录
~/.local/share/opencode/
```

---

## 🚀 核心命令

### 1. 启动 OpenCode

```bash
# TUI 模式 (终端界面)
opencode [project_path]

# 无头模式 (后台服务)
opencode serve --port 3000

# Web 界面
opencode web

# 运行单条消息
opencode run "描述你的任务"
```

### 2. 会话管理

```bash
# 列出会话
opencode session list

# 附加到会话
opencode attach <session_url>

# 导出会话
opencode export <sessionID>

# 导入会话
opencode import <file.json>
```

### 3. Provider 配置

```bash
# 列出 Providers
opencode providers list

# 登录 Provider
opencode providers login

# 登出
opencode providers logout
```

### 4. 模型管理

```bash
# 列出可用模型
opencode models

# 列出特定 Provider 的模型
opencode models <provider>
```

---

## 📖 Plan/Build 工作流

### Plan 模式 (规划)
1. 切换到 Plan 模式 (Tab 键)
2. 描述任务，要求生成计划
3. 审查计划，提出反馈
4. 迭代直到计划完善

### Build 模式 (执行)
1. 切换到 Build 模式 (Tab 键)
2. 要求执行已批准的方案
3. 如有问题，切回 Plan 模式
4. 重复直到完成

### 最佳实践
- ✅ 永远先 Plan 后 Build
- ✅ 不要跳过规划阶段
- ✅ 在 Build 模式下不回答问题
- ✅ 使用 `/undo` 撤销错误更改
- ✅ 使用 `/share` 分享会话

---

## 🔐 配置 Providers

### 可用 Providers
- OpenCode Zen (推荐，已验证模型)
- Anthropic (Claude)
- OpenAI (GPT)
- Google (Gemini)
- GitHub Copilot
- 75+ 其他模型 (via Models.dev)

### 配置步骤
1. 运行 `opencode providers login`
2. 选择 Provider
3. 按提示添加 API Key
4. 验证配置

### 推荐配置
```bash
# 使用 OpenCode Zen (最简单)
opencode providers login
# 选择 opencode，访问 opencode.ai/auth

# 或使用自己的 API Key
# 编辑 ~/.config/opencode/config.json
```

---

## 📁 项目初始化

```bash
# 进入项目目录
cd /path/to/project

# 启动 OpenCode
opencode

# 初始化项目 (生成 AGENTS.md)
/init
```

**AGENTS.md** 包含：
- 项目结构说明
- 编码规范
- 技术栈信息
- 帮助 OpenCode 理解项目

---

## 🛠️ 常用 Slash 命令

| 命令 | 说明 |
|------|------|
| `/sessions` | 打开会话选择器 |
| `/agents` | 切换 Agent (Plan/Build) |
| `/models` | 打开模型选择器 |
| `/init` | 初始化项目 |
| `/undo` | 撤销上次更改 |
| `/redo` | 重做撤销的更改 |
| `/share` | 分享会话链接 |
| `/connect` | 连接 Provider |

---

## 📊 使用场景

### 1. 代码生成
```bash
opencode run "创建一个 React 组件，实现待办事项列表"
```

### 2. 代码解释
```
解释 @src/api/index.ts 中的认证逻辑
```

### 3. 功能开发
```
Plan 模式：设计用户删除功能，包括软删除和回收站
Build 模式：实现已批准的方案
```

### 4. 代码重构
```
重构 @packages/functions/src/api/index.ts，参考 @packages/functions/src/notes.ts 的模式
```

---

## 🔍 集成到 OpenClaw

### 作为工具调用
```bash
# 通过 exec 调用
exec: opencode run "任务描述"

# 读取会话输出
read: ~/.local/share/opencode/sessions/<id>.json
```

### 记忆系统整合
- 记录成功的 OpenCode 工作流
- 保存常用的命令模式
- 记录配置和最佳实践

---

## ⚠️ 注意事项

### 终端要求
- 需要支持 TUI 的终端 (WezTerm, Alacritty, Kitty, Ghostty)
- 服务器环境可能需要配置 PTY

### API Key 管理
- API Key 存储在 `~/.local/share/opencode/auth.json`
- 不要分享或提交到版本控制
- 定期轮换 Key

### 隐私
- OpenCode 不存储代码或上下文
- 适合隐私敏感环境
- 但 API 请求会发送到 Provider

---

## 📚 学习资源

- **官方文档**: https://opencode.ai/docs
- **GitHub**: https://github.com/anomalyco/opencode
- **模型列表**: https://models.dev
- **社区**: Discord/论坛

---

## 🤝 与 OpenClaw 协作

**最佳协作模式**:

```
用户 → OpenClaw (理解需求) → OpenCode (执行编码)
       ↓
     规划任务
     管理会话
     验证结果
     记录学习
```

**OpenClaw 的职责**:
1. 理解用户的高层次需求
2. 制定任务计划
3. 调用 OpenCode 执行
4. 审查输出质量
5. 记录经验到记忆系统

**OpenCode 的职责**:
1. 代码生成和修改
2. 项目结构分析
3. 技术实现细节
4. 代码解释和文档

---

*最后更新：2026-03-20 - OpenCode v1.2.27 安装完成，技能集成就绪*
