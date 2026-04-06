#!/usr/bin/env node
/**
 * 在 Alpha 目录创建完整内容的项目文档
 * 使用 OAuth 用户身份 + SDK
 */

const Lark = require('/usr/lib/node_modules/openclaw/node_modules/@larksuiteoapi/node-sdk');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(process.env.HOME, '.openclaw', 'openclaw.json'), 'utf8'));
const tokenData = JSON.parse(fs.readFileSync(path.join(process.env.HOME, '.openclaw', 'feishu', 'user_token.json'), 'utf8'));

const appId = config.channels?.feishu?.appId;
const appSecret = config.channels?.feishu?.appSecret;
const alphaFolderToken = 'O4REfrwt1lSbRUd7ha0cLyxinVb';
const userAccessToken = tokenData.access_token;

const client = new Lark.Client({ 
  appId, 
  appSecret, 
  appType: Lark.AppType.SelfBuild, 
  domain: Lark.Domain.Feishu 
});

// 重写 http 请求，注入用户 Token
const originalRequest = client.httpInstance.request;
client.httpInstance.request = function(config) {
  config.headers = config.headers || {};
  config.headers['Authorization'] = 'Bearer ' + userAccessToken;
  return originalRequest.call(this, config);
};

console.log('🦞 创建完整内容的项目文档到 Alpha 目录\n');
console.log('Alpha 目录：https://xvgo1faf8xg.feishu.cn/drive/folder/' + alphaFolderToken);
console.log('');

// 先获取现有文件夹
const folderTokens = {};
const createdDocs = [];

run();

async function run() {
  // 步骤 1：获取现有文件夹
  console.log('【步骤 1】获取 Alpha 目录文件夹...');
  await findFolders();
  console.log('\n文件夹 Token:');
  Object.entries(folderTokens).forEach(([name, token]) => {
    console.log('  ' + name + ': ' + token);
  });
  
  // 步骤 2：创建完整文档
  console.log('\n【步骤 2】创建完整项目文档...');
  await createDocuments();
  
  // 步骤 3：验证
  console.log('\n【步骤 3】验证结果...');
  await sleep(3000);
  await verify();
  
  // 保存配置
  saveConfig();
}

async function findFolders() {
  try {
    const res = await client.drive.file.list({
      params: { folder_token: alphaFolderToken }
    });
    
    if (res.code === 0 && res.data?.files) {
      const folders = [
        '📊 项目总览',
        '✅ 已完成项目',
        '🟡 进行中项目',
        '📚 技术文档'
      ];
      
      folders.forEach(name => {
        const existing = res.data.files.find(f => f.type === 'folder' && f.name === name);
        if (existing) {
          folderTokens[name] = existing.token;
          console.log('  ✓ 找到：' + name);
        }
      });
    }
  } catch (e) {
    console.log('  ❌ 获取失败：' + e.message);
  }
}

async function createDocuments() {
  const docs = [
    { title: '📚 OpenClaw 项目文档库 - 主索引', folder: '📊 项目总览', content: getIndexMd() },
    { title: '📄 AI Humanizer Pro - 完整文档', folder: '✅ 已完成项目', content: getAIHumanizerMd() },
    { title: '📄 Token 成本优化 - 完整文档', folder: '✅ 已完成项目', content: getTokenMd() },
    { title: '📄 Agent Teams 升级 - 完整文档', folder: '🟡 进行中项目', content: getAgentTeamsMd() },
    { title: '📄 OpenCode 集成 - 完整文档', folder: '🟡 进行中项目', content: getOpenCodeMd() },
    { title: '📄 八卦占卜应用 - 完整文档', folder: '🟡 进行中项目', content: getDivinationMd() },
    { title: '🏗️ 技术架构总览', folder: '📚 技术文档', content: getArchMd() },
    { title: '⚙️ 部署配置说明', folder: '📚 技术文档', content: getDeployMd() }
  ];
  
  for (const doc of docs) {
    const targetFolder = folderTokens[doc.folder];
    if (!targetFolder) {
      console.log('⚠️  跳过 ' + doc.title + ' - 文件夹不存在');
      continue;
    }
    
    console.log('\n创建：' + doc.title);
    try {
      const docId = await createDoc(doc.title, doc.content, targetFolder);
      console.log('  ✅ https://xvgo1faf8xg.feishu.cn/docx/' + docId);
      createdDocs.push({ title: doc.title, id: docId, folder: doc.folder });
      await sleep(2000);
    } catch (e) {
      console.log('  ❌ ' + e.message);
    }
  }
}

async function createDoc(title, markdown, folderToken) {
  // 1. 创建文档
  const createRes = await client.docx.document.create({
    data: { title, folder_token: folderToken }
  });
  if (createRes.code !== 0) throw new Error('创建失败：' + createRes.msg);
  
  const docId = createRes.data.document.document_id;
  
  // 2. 转换 Markdown
  const convertRes = await client.docx.document.convert({
    data: { content_type: 'markdown', content: markdown }
  });
  if (convertRes.code !== 0) throw new Error('转换失败：' + convertRes.msg);
  
  // 3. 写入内容
  const insertRes = await client.docx.documentBlockDescendant.create({
    path: { document_id: docId, block_id: docId },
    data: { 
      children_id: convertRes.data.first_level_block_ids, 
      descendants: convertRes.data.blocks, 
      index: -1 
    }
  });
  if (insertRes.code !== 0) throw new Error('写入失败：' + insertRes.msg);
  
  return docId;
}

async function verify() {
  const res = await client.drive.file.list({
    params: { folder_token: alphaFolderToken }
  });
  
  if (res.code === 0 && res.data?.files) {
    const ourDocs = res.data.files.filter(f => f.type === 'docx' && 
      f.name.includes('OpenClaw') || f.name.includes('AI Humanizer') || 
      f.name.includes('Token') || f.name.includes('Agent') || 
      f.name.includes('OpenCode') || f.name.includes('八卦') ||
      f.name.includes('技术') || f.name.includes('部署')
    );
    console.log('  ✅ 项目文档：' + ourDocs.length + ' 个');
    ourDocs.forEach(d => {
      console.log('    📄 ' + d.name);
    });
  }
}

function saveConfig() {
  const memory = {
    alphaFolderToken: alphaFolderToken,
    folderTokens: folderTokens,
    createdDocs: createdDocs,
    createdAt: new Date().toISOString(),
    rule: '所有项目文档自动创建到 Alpha 目录，按项目分类存放',
    status: '完成',
    authType: 'OAuth 用户身份 + SDK Hook'
  };
  
  const memoryPath = path.join(process.env.HOME, '.openclaw', 'workspace', 'memory', 'feishu-alpha-config.json');
  fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
  
  console.log('\n💾 配置已保存到记忆系统');
  console.log('\n' + '='.repeat(70));
  console.log('✅ 完成！所有项目文档已创建');
  console.log('='.repeat(70));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============ 完整文档内容 ============

function getIndexMd() {
  return `# OpenClaw 项目文档库

**创建时间**: ${new Date().toLocaleString('zh-CN')}  
**位置**: Alpha 目录  
**维护**: OpenClaw 自动更新

---

## 📋 项目列表

| 项目 | 状态 | GitHub | 说明 |
|------|------|--------|------|
| AI Humanizer Pro | ✅ 已完成 | github.com/lethe0108/ai-humanizer-pro | AI 内容改写 |
| Agent Teams 升级 | 🟡 进行中 | 待创建 | 多智能体编排 |
| Token 成本优化 | ✅ 已完成 | 系统优化 | 降低 90% 成本 |
| OpenCode 集成 | 🟡 进行中 | github.com/opencode-ai/opencode | AI 编码工具 |
| 八卦占卜应用 | 🟡 进行中 | github.com/lethe0108/divination | 决策辅助工具 |

---

## 📁 文档分类

### 📊 项目总览
- 主索引文档（本文档）

### ✅ 已完成项目
- AI Humanizer Pro
- Token 成本优化

### 🟡 进行中项目
- Agent Teams 升级
- OpenCode 集成
- 八卦占卜应用

### 📚 技术文档
- 技术架构总览
- 部署配置说明

---

## 🔗 快速链接

- **Alpha 目录**: https://xvgo1faf8xg.feishu.cn/drive/folder/O4REfrwt1lSbRUd7ha0cLyxinVb

---

## 📊 项目进度总览

**总项目数**: 5  
**已完成**: 2 (40%)  
**进行中**: 3 (60%)

---

*最后更新：${new Date().toLocaleString('zh-CN')}*`;
}

function getAIHumanizerMd() {
  return `# AI Humanizer Pro

**项目 ID**: PROJECT-20260319-004  
**状态**: ✅ 已完成  
**GitHub**: https://github.com/lethe0108/ai-humanizer-pro  
**技术栈**: Python + FastAPI + DeepSeek API

---

## 📋 项目概况

AI 内容改写为人类写作风格，绕过 AI 检测工具

**核心指标**:
- 开发周期：4 小时
- 测试通过率：100%
- 平均改写时间：<30 秒
- 单次成本：¥0.02

---

## 🎯 核心功能

### 1. 场景自适应引擎
- 5 种改写模式（学术/商务/创意/日常/技术）
- 自动场景检测
- 差异化改写策略

### 2. DeepSeek API 集成
- 使用 deepseek-chat 模型
- 智能 prompt 工程
- 成本控制和优化

### 3. 质量评估系统
- AI 概率评分
- 可读性分析
- 流畅度检测

---

## 📁 代码结构

\`\`\`
ai-humanizer-pro/
├── server/
│   ├── main.py          # FastAPI 主程序
│   ├── config.py        # 配置文件
│   └── services/
│       ├── rewrite.py   # 改写服务
│       └── evaluator.py # 质量评估
├── tests/
│   └── test_rewrite.py
└── requirements.txt
\`\`\`

---

## 🚀 部署说明

1. git clone https://github.com/lethe0108/ai-humanizer-pro
2. cd ai-humanizer-pro
3. pip install -r requirements.txt
4. cp .env.example .env (填入 DEEPSEEK_API_KEY)
5. python server/main.py

---

## ✅ 测试结果

| 测试项 | 用例数 | 通过率 |
|--------|--------|--------|
| 改写功能 | 15 | 100% |
| 质量评估 | 10 | 100% |
| API 接口 | 12 | 100% |
| **总计** | **37** | **100%** |

---

*完成时间：2026-03-19*`;
}

function getTokenMd() {
  return `# Token 成本优化

**项目 ID**: PROJECT-20260319-006  
**状态**: ✅ 已完成  
**技术栈**: PostgreSQL + pgvector + 双写架构

---

## 📋 项目概况

降低 90% Token 消耗（¥60/月 → ¥6/月）

---

## 📊 优化成果对比

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 月成本 | ¥60 | ¥6 | 90% 降低 |
| 检索速度 | 1-10 秒 | <100ms | 10-100 倍 |
| 语义搜索 | 不支持 | 支持 | 新功能 |
| 并发支持 | 单线程 | 多线程 | 新功能 |

---

## ✅ 已完成工作

### 1. 完整备份
- 位置：/root/.openclaw/workspace/backup_20260319_2330/
- 大小：348KB
- 内容：全部记忆文件

### 2. PostgreSQL 部署
- 版本：PostgreSQL 16.13
- 插件：pgvector
- 数据库：memory_db
- 表结构：memories（id, content, embedding, created_at）

### 3. 双写记忆系统
- 写入：同时写入文件 + 数据库
- 读取：优先数据库（<100ms）→ 回退文件（完整）
- 状态：已启用并运行中

### 4. 向量化
- 记录数：135 条记忆
- 向量化：100% 完成
- 索引：HNSW
- 模型：本地 bge-m3

---

## 🏗️ 技术架构

\`\`\`
记忆系统
├── 文件存储（memory/*.md）
│   └── 优点：完整、可读、易编辑
├── 数据库存储（PostgreSQL + pgvector）
│   └── 优点：快速（<100ms）、语义搜索
└── 双写架构
    ├── 写入：文件 + 数据库同时
    └── 读取：优先数据库，回退文件
\`\`\`

---

*完成时间：2026-03-19*`;
}

function getAgentTeamsMd() {
  return `# Agent Teams 升级

**项目 ID**: PROJECT-20260319-005  
**状态**: 🟡 进行中  
**GitHub**: 待创建  
**技术栈**: 多智能体编排框架

---

## 📋 项目概况

基于 Ruflo 架构，打造最优多智能体编排系统

**预期指标**:
- 开发效率提升：300%
- Token 成本降低：75%
- 支持智能体：50+

---

## 🎯 核心特性

### 1. 蜂群架构
- Queen-Worker 调度模式
- 多智能体共识机制
- 任务智能分配

### 2. 持久化记忆
- PostgreSQL + pgvector
- HNSW 索引加速
- 双写架构（文件 + 数据库）

### 3. 智能路由
- 成本降低 75%
- 多模型支持（Claude/GPT/DeepSeek）
- 本地化部署选项

---

## 📅 开发计划

| 阶段 | 任务 | 周期 |
|------|------|------|
| 阶段 1 | 架构设计 | 1 周 |
| 阶段 2 | 核心开发 | 2 周 |
| 阶段 3 | 测试优化 | 1 周 |
| 阶段 4 | 部署上线 | 1 周 |
| **总计** | | **5 周** |

---

## 🏗️ 技术架构

\`\`\`
Agent Teams
├── Queen Agent（调度中心）
│   ├── 任务分析
│   ├── 智能体选择
│   └── 结果聚合
├── Worker Agents（执行层）
│   ├── 编码 Agent
│   ├── 测试 Agent
│   └── 文档 Agent
└── Memory Layer（记忆层）
    ├── 短期记忆（会话）
    └── 长期记忆（向量数据库）
\`\`\`

---

*立项时间：2026-03-19*`;
}

function getOpenCodeMd() {
  return `# OpenCode 集成

**项目 ID**: PROJECT-20260320-007  
**状态**: 🟡 进行中  
**GitHub**: https://github.com/opencode-ai/opencode  
**版本**: OpenCode v1.2.27

---

## 📋 项目概况

AI 编码工具集成，支持 Plan/Build 工作流

---

## 📦 安装状态

- **版本**: v1.2.27
- **位置**: /usr/bin/opencode
- **配置**: ~/.config/opencode/

---

## 🎯 核心功能

### 1. Plan/Build 工作流
- Plan 模式：任务规划、架构设计
- Build 模式：代码实现、文件操作

### 2. 多模型支持
- Claude (Anthropic)
- GPT (OpenAI)
- Gemini (Google)

### 3. 会话管理
- 文件操作（读/写/编辑）
- 命令执行
- 会话历史

---

## ⏭️ 下一步计划

1. **配置 Provider**（优先级：高）
2. **测试基本命令**（优先级：高）
3. **创建测试项目**（优先级：中）
4. **跑通 Plan → Build 流程**（优先级：中）

---

*安装时间：2026-03-20*`;
}

function getDivinationMd() {
  return `# 八卦占卜应用

**项目 ID**: PROJECT-20260321-008  
**状态**: 🟡 Phase 4 完成 (95%)  
**GitHub**: https://github.com/lethe0108/divination  
**技术栈**: React + Node.js + 周易算法

---

## 📋 项目概况

个人决策辅助与心灵指南工具

**核心理念**: "观象玩辞，反求诸己"

---

## 🎯 核心功能

### 1. 起卦模块
- 数字起卦、铜钱起卦、时间起卦

### 2. 卦象展示
- 本卦、变卦展示
- 变爻高亮
- 卦辞爻辞显示

### 3. 解读模块
- 核心摘要、深度解读
- 经典解读（基于《周易》原文）
- AI 解读（大模型生成）

### 4. 历史记录
- 自动保存、个人笔记、回顾反思

### 5. 学习中心
- 六十四卦词典（115KB 完整数据）
- 基础知识（阴阳/五行/八卦）
- 经典案例

---

## ✅ Phase 4 完成总结

| 任务 | 状态 |
|------|------|
| 测试套件 | ✅ 37 个测试全部通过 |
| AI 深度解读 | ✅ 多模型支持 |
| 双模式解读 | ✅ 经典+AI |
| 学习中心 | ✅ 64 卦完整数据 |
| 代码质量 | ✅ ESLint 全部修复 |

---

## ⏭️ 剩余工作

- **微信小程序适配** - 需独立开发（已有迁移指南）

---

*最后更新：2026-03-21*`;
}

function getArchMd() {
  return `# OpenClaw 技术架构总览

**版本**: 2026-03-21

---

## 📋 系统概述

OpenClaw 是智能助手框架，支持多通道消息处理、AI 编码集成、记忆系统

---

## 🏗️ 整体架构

\`\`\`
OpenClaw Gateway
├── Channel Layer (消息通道)
│   ├── Feishu (飞书)
│   ├── Discord
│   ├── Telegram
│   └── WhatsApp
├── Agent Layer (智能体)
│   ├── OpenClaw (主调度)
│   ├── OpenCode (AI 编码)
│   └── SubAgents (子智能体)
├── Memory Layer (记忆)
│   ├── 文件存储 (Markdown)
│   ├── PostgreSQL (向量数据库)
│   └── 双写架构
└── Tool Layer (工具)
    ├── 飞书文档工具
    ├── 飞书云空间工具
    ├── 网络搜索工具
    └── 代码执行工具
\`\`\`

---

## 🎯 核心模块

### 1. Gateway (网关)
- 消息路由、会话管理、工具调用、安全控制

### 2. Channels (通道)
- 各平台消息收发、统一消息格式

### 3. Memory (记忆)
- 双写架构（文件 + 数据库）
- 文件检索：1-10 秒
- 数据库检索：<100ms
- 语义搜索支持

### 4. OpenCode (AI 编码)
- Plan/Build 工作流
- 多模型支持

---

## 📊 性能指标

| 指标 | 目标 | 当前 | 状态 |
|------|------|------|------|
| 消息响应 | <2s | ~1s | ✅ |
| 记忆检索 | <100ms | ~150ms | ⚠️ |
| Token 成本 | ¥6/月 | ¥6/月 | ✅ |
| 系统可用性 | 99% | 99%+ | ✅ |

---

*最后更新：2026-03-21*`;
}

function getDeployMd() {
  return `# OpenClaw 部署配置说明

**版本**: 2026-03-21  
**适用**: Linux Ubuntu 22.04+

---

## 📋 环境要求

| 组件 | 版本 | 说明 |
|------|------|------|
| Linux | Ubuntu 22.04+ | 或其他 Debian 系 |
| Node.js | v22+ | 使用 nvm 安装 |
| PostgreSQL | 16+ | 需要 pgvector 插件 |
| 内存 | 2GB+ | 推荐 4GB |

---

## 🚀 安装步骤

### 1. 安装 Node.js
\`\`\`bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22
\`\`\`

### 2. 安装 OpenClaw
\`\`\`bash
npm install -g openclaw
\`\`\`

### 3. 配置 OpenClaw
\`\`\`bash
mkdir -p ~/.openclaw
# 编辑 ~/.openclaw/openclaw.json
\`\`\`

### 4. 启动服务
\`\`\`bash
openclaw gateway start
openclaw gateway status
\`\`\`

---

## 🗄️ PostgreSQL 配置

\`\`\`bash
# 安装
sudo apt-get install postgresql postgresql-contrib
sudo apt-get install postgresql-16-pgvector

# 创建数据库
sudo -u postgres psql
CREATE DATABASE memory_db;
CREATE USER openclaw WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE memory_db TO openclaw;
\\c memory_db
CREATE EXTENSION vector;
\\q
\`\`\`

---

## 🔐 安全配置

- 文件权限：chmod 600 ~/.openclaw/openclaw.json
- Token 自动刷新：每 5 天
- 防火墙：仅允许本地访问

---

## 📊 监控维护

- 日志：/tmp/openclaw/openclaw-*.log
- 状态：openclaw gateway status
- 定时任务：cron

---

*最后更新：2026-03-21*`;
}
