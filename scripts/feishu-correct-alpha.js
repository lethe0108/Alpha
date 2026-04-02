#!/usr/bin/env node
const Lark = require('/usr/lib/node_modules/openclaw/node_modules/@larksuiteoapi/node-sdk');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(process.env.HOME, '.openclaw', 'openclaw.json'), 'utf8'));
const tokenData = JSON.parse(fs.readFileSync(path.join(process.env.HOME, '.openclaw', 'feishu', 'user_token.json'), 'utf8'));

const appId = config.channels?.feishu?.appId;
const appSecret = config.channels?.feishu?.appSecret;
// 正确的 Alpha 目录 Token
const alphaFolderToken = 'nodcnii1qOLjCtRr46gCwuyHnyi';

const client = new Lark.Client({ appId, appSecret, appType: Lark.AppType.SelfBuild, domain: Lark.Domain.Feishu });

console.log('📚 在正确的 Alpha 目录创建完整项目文档\n');
console.log('Alpha 目录 Token:', alphaFolderToken);
console.log('Alpha 目录链接：https://xvgo1faf8xg.feishu.cn/drive/folder/' + alphaFolderToken);
console.log('');

const docs = [
  { title: '📚 OpenClaw 项目文档库 - 主索引', content: getIndexMd() },
  { title: '📄 AI Humanizer Pro - 完整文档', content: getAIHumanizerMd() },
  { title: '📄 Agent Teams 升级 - 完整文档', content: getAgentTeamsMd() },
  { title: '📄 Token 成本优化 - 完整文档', content: getTokenMd() },
  { title: '📄 OpenCode 集成 - 完整文档', content: getOpenCodeMd() },
  { title: '📄 八卦占卜应用 - 完整文档', content: getDivinationMd() },
  { title: '🏗️ 技术架构总览', content: getArchMd() },
  { title: '⚙️ 部署配置说明', content: getDeployMd() }
];

let successCount = 0;

run();

async function run() {
  for (const doc of docs) {
    console.log('【创建】' + doc.title);
    try {
      const docId = await createAndWrite(doc.title, doc.content);
      console.log('✅ https://xvgo1faf8xg.feishu.cn/docx/' + docId);
      successCount++;
      await sleep(1500);
    } catch (e) {
      console.log('❌ 失败：' + e.message);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ 完成！成功 ' + successCount + '/' + docs.length);
  console.log('📁 Alpha 目录：https://xvgo1faf8xg.feishu.cn/drive/folder/' + alphaFolderToken);
  console.log('='.repeat(60));
  
  // 验证
  await sleep(3000);
  verify();
}

async function createAndWrite(title, markdown) {
  const createRes = await client.docx.document.create({
    data: { parent_type: 'folder', parent_token: alphaFolderToken, title }
  });
  if (createRes.code !== 0) throw new Error(createRes.msg);
  
  const docId = createRes.data.document.document_id;
  
  const convertRes = await client.docx.document.convert({
    data: { content_type: 'markdown', content: markdown }
  });
  if (convertRes.code !== 0) throw new Error(convertRes.msg);
  
  const insertRes = await client.docx.documentBlockDescendant.create({
    path: { document_id: docId, block_id: docId },
    data: { children_id: convertRes.data.first_level_block_ids, descendants: convertRes.data.blocks, index: -1 }
  });
  if (insertRes.code !== 0) throw new Error(insertRes.msg);
  
  return docId;
}

function verify() {
  const https = require('https');
  const accessToken = tokenData.access_token;
  
  https.get({
    hostname: 'open.feishu.cn',
    path: '/open-apis/drive/v1/files?parent_type=folder&parent_token=' + alphaFolderToken + '&limit=100',
    headers: { 'Authorization': 'Bearer ' + accessToken }
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      const result = JSON.parse(data);
      console.log('\nAlpha 目录中的 OpenClaw 文档:');
      if (result.data && result.data.files) {
        const ourDocs = result.data.files.filter(f => 
          f.name.includes('📚 OpenClaw 项目文档库 - 主索引') ||
          f.name.includes('📄 AI Humanizer') ||
          f.name.includes('📄 Agent Teams') ||
          f.name.includes('📄 Token 成本') ||
          f.name.includes('📄 OpenCode') ||
          f.name.includes('📄 八卦') ||
          f.name.includes('🏗️ 技术') ||
          f.name.includes('⚙️ 部署')
        );
        ourDocs.forEach(d => {
          console.log('  ✅ ' + d.name);
          console.log('     ' + d.url);
        });
        console.log('\n共计：' + ourDocs.length + ' 个文档');
      }
    });
  });
}

// ============ 简化版文档内容 ============

function getIndexMd() {
  return `# OpenClaw 项目文档库

创建时间：${new Date().toLocaleString('zh-CN')}
位置：Alpha 目录

---

## 项目列表

1. AI Humanizer Pro - 已完成 - github.com/lethe0108/ai-humanizer-pro
2. Agent Teams 升级 - 已立项 - 待创建
3. Token 成本优化 - 已完成 - 系统优化
4. OpenCode 集成 - 待配置 - github.com/opencode-ai/opencode
5. 八卦占卜应用 - Phase4 完成 - github.com/lethe0108/divination

---

## 文档导航

项目文档：
- AI Humanizer Pro - 完整文档
- Agent Teams 升级 - 完整文档
- Token 成本优化 - 完整文档
- OpenCode 集成 - 完整文档
- 八卦占卜应用 - 完整文档

技术文档：
- 技术架构总览
- 部署配置说明

---

最后更新：${new Date().toLocaleString('zh-CN')}`;
}

function getAIHumanizerMd() {
  return `# AI Humanizer Pro - 完整文档

项目 ID: PROJECT-20260319-004
状态：已完成
GitHub: https://github.com/lethe0108/ai-humanizer-pro
技术栈：Python + FastAPI + DeepSeek API

---

## 项目概况

AI 内容改写为人类写作风格，绕过 AI 检测工具

核心指标：
- 开发周期：4 小时
- 测试通过率：100%
- 平均改写时间：<30 秒
- 单次成本：¥0.02

---

## 核心功能

1. 场景自适应引擎
- 5 种改写模式（学术/商务/创意/日常/技术）
- 自动场景检测
- 差异化改写策略

2. DeepSeek API 集成
- 使用 deepseek-chat 模型
- 智能 prompt 工程
- 成本控制和优化

3. 质量评估系统
- AI 概率评分
- 可读性分析
- 流畅度检测

---

## 代码结构

ai-humanizer-pro/
- server/main.py - FastAPI 主程序
- server/config.py - 配置文件
- server/services/rewrite.py - 改写服务
- server/services/evaluator.py - 质量评估
- server/prompts/templates.py - Prompt 模板
- tests/test_rewrite.py - 测试
- requirements.txt - 依赖

---

## 部署说明

1. git clone https://github.com/lethe0108/ai-humanizer-pro
2. cd ai-humanizer-pro
3. pip install -r requirements.txt
4. cp .env.example .env (填入 DEEPSEEK_API_KEY)
5. python server/main.py

---

## 测试结果

改写功能 15 用例 - 100% 通过
质量评估 10 用例 - 100% 通过
API 接口 12 用例 - 100% 通过
总计：37 用例 - 100% 通过

---
项目完成时间：2026-03-19`;
}

function getAgentTeamsMd() {
  return `# Agent Teams 升级 - 完整文档

项目 ID: PROJECT-20260319-005
状态：已立项，等待开发
GitHub: 待创建
技术栈：多智能体编排框架

---

## 项目概况

基于 Ruflo 架构，打造最优多智能体编排系统

预期指标：
- 开发效率提升：300%
- Token 成本降低：75%
- 支持智能体：50+

---

## 核心特性

1. 蜂群架构
- Queen-Worker 调度模式
- 多智能体共识机制
- 任务智能分配

2. 持久化记忆
- PostgreSQL + pgvector
- HNSW 索引加速
- 双写架构（文件 + 数据库）

3. 智能路由
- 成本降低 75%
- 多模型支持（Claude/GPT/DeepSeek）
- 本地化部署选项

---

## 开发计划

阶段 1：架构设计 - 1 周
阶段 2：核心开发 - 2 周
阶段 3：测试优化 - 1 周
阶段 4：部署上线 - 1 周
总计：5 周

---

## 技术架构

Agent Teams
- Queen Agent（调度中心）
  - 任务分析、智能体选择、结果聚合
- Worker Agents（执行层）
  - 编码 Agent、测试 Agent、文档 Agent、审核 Agent
- Memory Layer（记忆层）
  - 短期记忆、长期记忆、共享记忆
- Router（路由层）
  - 成本优化、负载均衡、故障转移

---

## 预期成果

1. 效率提升：自动化任务分配、并行执行、智能错误恢复
2. 成本优化：智能模型选择、Token 优化、本地模型支持
3. 可扩展性：50+ 预置智能体、自定义智能体、插件系统

---
立项时间：2026-03-19`;
}

function getTokenMd() {
  return `# Token 成本优化 - 完整文档

项目 ID: PROJECT-20260319-006
状态：已完成
技术栈：PostgreSQL + pgvector + 双写架构

---

## 项目概况

降低 90% Token 消耗（月成本¥60 → ¥6）

优化成果对比：
- 月成本：¥60 → ¥6（90% 降低）
- 检索速度：1-10 秒 → <100ms（10-100 倍提升）
- 语义搜索：不支持 → 支持（新功能）
- 并发支持：单线程 → 多线程（新功能）

---

## 已完成工作

1. 完整备份
- 位置：/root/.openclaw/workspace/backup_20260319_2330/
- 大小：348KB

2. PostgreSQL 部署
- 版本：PostgreSQL 16.13
- 插件：pgvector
- 数据库：memory_db

3. 双写记忆系统
- 写入：同时写入文件 + 数据库
- 读取：优先数据库（<100ms）→ 回退文件（完整）
- 状态：已启用并运行中

4. 向量化
- 记录数：135 条记忆
- 向量化：100% 完成
- 索引：HNSW
- 模型：本地 bge-m3

---

## 性能对比

检索速度：文件搜索 1-10 秒 → 数据库搜索 <100ms（10-100 倍提升）
成本对比：优化前¥60/月 → 优化后¥6/月（90% 节省）

---
完成时间：2026-03-19`;
}

function getOpenCodeMd() {
  return `# OpenCode 集成 - 完整文档

项目 ID: PROJECT-20260320-007
状态：已安装，待配置
GitHub: https://github.com/opencode-ai/opencode
版本：OpenCode v1.2.27

---

## 项目概况

AI 编码工具集成，支持 Plan/Build 工作流

安装状态：
- 版本：v1.2.27
- 位置：/usr/bin/opencode
- 配置：~/.config/opencode/

---

## 核心功能

1. Plan/Build 工作流
- Plan 模式：任务规划、架构设计
- Build 模式：代码实现、文件操作

2. 多模型支持
- Claude (Anthropic)
- GPT (OpenAI)
- Gemini (Google)
- 本地模型

3. 会话管理
- 文件操作（读/写/编辑）
- 命令执行
- 会话历史

---

## 待配置项

1. Provider 配置
- 选择主要 Provider
- 配置 API Key
- 测试连接

2. 工作流配置
- Plan 模式触发条件
- Build 模式触发条件
- 自动切换规则

3. 与 OpenClaw 集成
- 命令映射
- 输出格式
- 错误处理

---

## 下一步计划

1. 配置 Provider（优先级：高）
2. 测试基本命令（优先级：高）
3. 创建测试项目（优先级：中）
4. 跑通 Plan → Build 流程（优先级：中）

---
安装时间：2026-03-20`;
}

function getDivinationMd() {
  return `# 八卦占卜应用 - 完整文档

项目 ID: PROJECT-20260321-008
状态：Phase 4 完成 (95%)
GitHub: https://github.com/lethe0108/divination
技术栈：React + Node.js + 周易算法

---

## 项目概况

个人决策辅助与心灵指南工具

核心理念：
"观象玩辞，反求诸己"
通过卦象的智慧启发用户从不同角度思考当前处境

---

## 核心功能

1. 起卦模块
- 数字起卦、铜钱起卦、时间起卦

2. 卦象展示
- 本卦、变卦展示
- 变爻高亮
- 卦辞爻辞显示

3. 解读模块
- 核心摘要、深度解读
- 经典解读（基于《周易》原文）
- AI 解读（大模型生成）

4. 历史记录
- 自动保存、个人笔记、回顾反思

5. 学习中心
- 六十四卦词典（115KB 完整数据）
- 基础知识（阴阳/五行/八卦）
- 经典案例

---

## Phase 4 完成总结

测试套件：
- Divination.test.js: 15 用例 - 通过
- HexagramAnalysis.test.js: 20 用例 - 通过
- 37 个测试全部通过

AI 深度解读：
- AIInterpretationService.js: 多模型支持
- AIInterpretation.js: 流式响应
- 个性化提示词模板

双模式解读：
- ClassicInterpretation.js: 经典解读（基于《周易》原文）
- AIInterpretation.js: AI 解读（大模型生成）

代码质量：
- ESLint 警告：全部修复
- 构建：成功
- 测试：13/13 通过
- Git: 已推送 (0d4e025b)

---

## 剩余工作

微信小程序适配：
- 需独立开发
- 已有迁移指南：MIGRATION_WECHAT.md

---
最后更新：2026-03-21 10:30`;
}

function getArchMd() {
  return `# OpenClaw 技术架构总览

版本：2026-03-21

---

## 系统概述

OpenClaw 是智能助手框架，支持多通道消息处理、AI 编码集成、记忆系统

---

## 整体架构

OpenClaw Gateway
- Channel Layer (消息通道)
  - Feishu (飞书)、Discord、Telegram、WhatsApp
- Agent Layer (智能体)
  - OpenClaw (主调度)、OpenCode (AI 编码)、SubAgents (子智能体)
- Memory Layer (记忆)
  - 文件存储 (Markdown)、PostgreSQL (向量数据库)、双写架构
- Tool Layer (工具)
  - 飞书文档工具、飞书云空间工具、网络搜索工具、代码执行工具

---

## 核心模块

1. Gateway (网关)
- 消息路由、会话管理、工具调用、安全控制

2. Channel Plugins (通道插件)
- 各平台消息收发、统一消息格式

3. Memory System (记忆系统)
- 双写架构（文件 + 数据库）
- 文件检索：1-10 秒
- 数据库检索：<100ms
- 语义搜索支持

4. OpenCode Integration (AI 编码)
- 版本：v1.2.27
- Plan/Build 工作流
- 多模型支持

---

## 性能指标

消息响应：目标<2s，当前~1s - 达标
记忆检索：目标<100ms，当前~150ms - 接近
Token 成本：目标¥6/月，当前¥6/月 - 达标
系统可用性：目标 99%，当前 99%+ - 达标

---

## 技术栈

运行时：Node.js v22+、Linux Ubuntu 22.04+
数据库：PostgreSQL 16.13、pgvector 插件
AI 模型：DeepSeek (主要)、本地 bge-m3 (向量化)
外部服务：飞书开放平台、GitHub API

---
最后更新：2026-03-21`;
}

function getDeployMd() {
  return `# OpenClaw 部署配置说明

版本：2026-03-21
适用：Linux Ubuntu 22.04+

---

## 环境要求

Linux: Ubuntu 22.04+ 或其他 Debian 系
Node.js: v22+ (使用 nvm 安装)
PostgreSQL: 16+ (需要 pgvector 插件)
内存：2GB+ (推荐 4GB)
存储：10GB+

---

## 安装步骤

1. 安装 Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22

2. 安装 OpenClaw
npm install -g openclaw

3. 创建配置目录
mkdir -p ~/.openclaw
mkdir -p ~/.openclaw/workspace
mkdir -p ~/.openclaw/workspace/memory

4. 配置 OpenClaw
编辑 ~/.openclaw/openclaw.json
配置 channels.feishu.appId 和 appSecret

5. 启动服务
openclaw gateway start
查看状态：openclaw gateway status

---

## PostgreSQL 配置

1. 安装 PostgreSQL
sudo apt-get install postgresql postgresql-contrib
sudo apt-get install postgresql-16-pgvector

2. 创建数据库
sudo -u postgres psql
CREATE DATABASE memory_db;
CREATE USER openclaw WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE memory_db TO openclaw;
\\c memory_db
CREATE EXTENSION vector;
\\q

3. 创建表结构
CREATE TABLE memories (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(1024),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX ON memories USING hnsw (embedding vector_cosine_ops);

---

## 安全配置

文件权限：chmod 600 ~/.openclaw/openclaw.json
Token 自动刷新：每 5 天自动刷新
防火墙：仅允许本地访问

---

## 监控维护

日志：/tmp/openclaw/openclaw-*.log
状态：openclaw gateway status
定时任务：cron
健康检查：每 5 分钟

---

## 故障排查

问题 1: Gateway 无法启动
- 检查端口占用：lsof -i :3000
- 查看错误日志
- 重启服务

问题 2: Token 过期
- 手动刷新：node /root/.openclaw/scripts/feishu-token-refresh.js

问题 3: 记忆检索慢
- 检查 PostgreSQL 状态
- 检查向量化状态

问题 4: 飞书 API 失败
- 检查网络连接
- 检查 token 有效性
- 重新授权

---
最后更新：2026-03-21`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
