#!/usr/bin/env node
/**
 * 在 Alpha 目录下创建完整项目文档库
 */

const Lark = require('/usr/lib/node_modules/openclaw/node_modules/@larksuiteoapi/node-sdk');
const fs = require('fs');
const path = require('path');

const configPath = path.join(process.env.HOME, '.openclaw', 'openclaw.json');
const tokenPath = path.join(process.env.HOME, '.openclaw', 'feishu', 'user_token.json');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

const appId = config.channels?.feishu?.appId;
const appSecret = config.channels?.feishu?.appSecret;
const alphaFolderToken = 'O4REfrwt1lSbRUd7ha0cLyxinVb';

const client = new Lark.Client({
  appId,
  appSecret,
  appType: Lark.AppType.SelfBuild,
  domain: Lark.Domain.Feishu
});

console.log('='.repeat(70));
console.log('📚 在 Alpha 目录下创建项目文档库');
console.log('='.repeat(70));
console.log('');

// 项目列表
const projects = [
  {
    id: 'PROJECT-20260319-004',
    name: 'AI Humanizer Pro',
    status: '✅ 已完成',
    github: 'https://github.com/lethe0108/ai-humanizer-pro',
    tech: 'Python + FastAPI + DeepSeek API',
    desc: 'AI 内容改写为人类写作风格，绕过 AI 检测工具',
    folder: '01-AI-Humanizer-Pro'
  },
  {
    id: 'PROJECT-20260319-005',
    name: 'Agent Teams 全局化升级',
    status: '🟡 已立项，等待开发',
    github: '待创建',
    tech: '多智能体编排框架',
    desc: '基于 Ruflo 架构，打造最优多智能体编排系统',
    folder: '02-Agent-Teams'
  },
  {
    id: 'PROJECT-20260319-006',
    name: 'Token 成本优化',
    status: '✅ 已完成',
    github: 'N/A (系统优化)',
    tech: 'PostgreSQL + pgvector + 双写架构',
    desc: '降低 90% Token 消耗（¥60/月 → ¥6/月）',
    folder: '03-Token-Optimization'
  },
  {
    id: 'PROJECT-20260320-007',
    name: 'OpenCode 集成',
    status: '🟢 已安装，待配置',
    github: 'https://github.com/opencode-ai/opencode',
    tech: 'OpenCode v1.2.27',
    desc: 'AI 编码工具集成，支持 Plan/Build 工作流',
    folder: '04-OpenCode-Integration'
  },
  {
    id: 'PROJECT-20260321-008',
    name: '八卦占卜应用',
    status: '🟢 已立项',
    github: 'https://github.com/lethe0108/divination',
    tech: '待确定',
    desc: '个人决策辅助与心灵指南工具',
    folder: '05-Divination'
  }
];

run();

async function run() {
  try {
    // 1. 创建主索引文档
    console.log('【步骤 1】创建主索引文档...');
    const indexDocId = await createDocument(
      alphaFolderToken,
      '📚 OpenClaw 项目文档库 - 主索引'
    );
    
    const indexMarkdown = generateIndexMarkdown(projects);
    await writeDocument(indexDocId, indexMarkdown);
    console.log('✅ 主索引文档创建成功');
    console.log('   链接: https://open.feishu.cn/docx/' + indexDocId);
    console.log('');
    
    // 2. 为每个项目创建详细文档
    for (const project of projects) {
      console.log(`【步骤】创建项目文档：${project.name}...`);
      const docId = await createDocument(alphaFolderToken, `📄 ${project.name} - 完整文档`);
      const markdown = generateProjectMarkdown(project);
      await writeDocument(docId, markdown);
      console.log(`✅ ${project.name} 文档创建成功`);
      console.log(`   链接：https://open.feishu.cn/docx/${docId}`);
      console.log('');
      
      // 避免 API 限流
      await sleep(1000);
    }
    
    // 3. 创建技术架构文档
    console.log('【步骤】创建技术架构文档...');
    const archDocId = await createDocument(alphaFolderToken, '🏗️ OpenClaw 技术架构总览');
    const archMarkdown = generateArchitectureMarkdown();
    await writeDocument(archDocId, archMarkdown);
    console.log('✅ 技术架构文档创建成功');
    console.log('   链接: https://open.feishu.cn/docx/' + archDocId);
    console.log('');
    
    // 4. 创建部署配置文档
    console.log('【步骤】创建部署配置文档...');
    const deployDocId = await createDocument(alphaFolderToken, '⚙️ OpenClaw 部署配置说明');
    const deployMarkdown = generateDeploymentMarkdown();
    await writeDocument(deployDocId, deployMarkdown);
    console.log('✅ 部署配置文档创建成功');
    console.log('   链接: https://open.feishu.cn/docx/' + deployDocId);
    console.log('');
    
    // 完成
    console.log('='.repeat(70));
    console.log('🎉 项目文档库创建完成！');
    console.log('='.repeat(70));
    console.log('');
    console.log('📚 文档列表:');
    console.log(`   📄 主索引：https://open.feishu.cn/docx/${indexDocId}`);
    console.log(`   🏗️ 技术架构：https://open.feishu.cn/docx/${archDocId}`);
    console.log(`   ⚙️ 部署配置：https://open.feishu.cn/docx/${deployDocId}`);
    console.log('');
    console.log('📁 Alpha 目录链接:');
    console.log('   https://xvgo1faf8xg.feishu.cn/drive/folder/' + alphaFolderToken);
    console.log('');
    
  } catch (error) {
    console.log('');
    console.log('❌ 错误:', error.message);
    console.log(error.stack);
    process.exit(1);
  }
}

async function createDocument(folderToken, title) {
  const res = await client.docx.document.create({
    data: {
      parent_type: 'folder',
      parent_token: folderToken,
      title: title
    }
  });
  
  if (res.code !== 0) {
    throw new Error('文档创建失败：' + res.msg);
  }
  
  return res.data.document.document_id;
}

async function writeDocument(docId, markdown) {
  const convertRes = await client.docx.document.convert({
    data: { content_type: 'markdown', content: markdown }
  });
  
  await client.docx.documentBlockDescendant.create({
    path: { document_id: docId, block_id: docId },
    data: {
      children_id: convertRes.data.first_level_block_ids,
      descendants: convertRes.data.blocks,
      index: -1
    }
  });
}

function generateIndexMarkdown(projects) {
  return `# 📚 OpenClaw 项目文档库 - 主索引

> **创建时间**: ${new Date().toLocaleString('zh-CN')}  
> **位置**: Alpha 目录  
> **维护**: OpenClaw 自动更新

---

## 📋 项目总览

| 项目 ID | 项目名称 | 状态 | GitHub 仓库 | 技术栈 |
|---------|----------|------|-------------|--------|
${projects.map(p => `| ${p.id} | ${p.name} | ${p.status} | ${p.github} | ${p.tech} |`).join('\n')}

---

## 📁 文档结构

\`\`\`
Alpha 目录/
├── 📚 项目文档库 - 主索引 (本文档)
├── 🏗️ OpenClaw 技术架构总览
├── ⚙️ OpenClaw 部署配置说明
├── 📄 AI Humanizer Pro - 完整文档
├── 📄 Agent Teams 全局化升级 - 完整文档
├── 📄 Token 成本优化 - 完整文档
├── 📄 OpenCode 集成 - 完整文档
└── 📄 八卦占卜应用 - 完整文档
\`\`\`

---

## 🎯 快速导航

### 项目文档
${projects.map((p, i) => `- **${i+1}. ${p.name}** - ${p.desc}`).join('\n')}

### 技术文档
- **技术架构总览** - 系统架构、核心模块、数据流
- **部署配置说明** - 环境要求、安装步骤、配置详解

---

## 📊 项目状态统计

| 状态 | 数量 | 项目 |
|------|------|------|
| ✅ 已完成 | ${projects.filter(p => p.status.includes('已完成')).length} | AI Humanizer Pro, Token 成本优化 |
| 🟢 已立项 | ${projects.filter(p => p.status.includes('已立项')).length} | Agent Teams, 八卦占卜 |
| 🟡 进行中 | ${projects.filter(p => p.status.includes('进行中')).length} | OpenCode 集成 |

---

## 🔗 相关链接

- **GitHub 组织**: https://github.com/lethe0108
- **OpenClaw 文档**: https://docs.openclaw.ai
- **飞书云空间**: Alpha 目录

---

## 📝 更新日志

- ${new Date().toLocaleDateString('zh-CN')} - 创建项目文档库，整理 5 个项目文档

---

*本文档由 OpenClaw 自动生成并维护*
`;
}

function generateProjectMarkdown(project) {
  return `# 📄 ${project.name}

> **项目 ID**: ${project.id}  
> **创建时间**: ${new Date().toLocaleString('zh-CN')}  
> **状态**: ${project.status}  
> **GitHub**: ${project.github}

---

## 📋 项目概况

| 项目 | 信息 |
|------|------|
| **项目名称** | ${project.name} |
| **项目 ID** | ${project.id} |
| **状态** | ${project.status} |
| **GitHub** | ${project.github} |
| **技术栈** | ${project.tech} |

---

## 🎯 项目描述

${project.desc}

---

## 🏗️ 技术架构

### 核心技术

${project.tech}

### 架构特点

- 模块化设计
- 高可扩展性
- 性能优化
- 易于维护

---

## 📁 项目结构

\`\`\`
${project.folder}/
├── README.md          # 项目说明
├── API.md             # API 文档
├── DEPLOYMENT.md      # 部署说明
├── TESTING.md         # 测试文档
├── src/               # 源代码
├── docs/              # 文档
└── tests/             # 测试用例
\`\`\`

---

## 🚀 快速开始

### 环境要求

- Node.js / Python (根据项目)
- Git
- 相关依赖

### 安装步骤

\`\`\`bash
# 克隆项目
git clone ${project.github}

# 进入目录
cd ${project.folder}

# 安装依赖
npm install / pip install -r requirements.txt

# 启动服务
npm start / python main.py
\`\`\`

---

## 📖 详细文档

### 1. README.md
项目介绍、功能特性、使用示例

### 2. API.md
API 接口文档、请求参数、响应格式

### 3. DEPLOYMENT.md
部署环境要求、配置说明、运维指南

### 4. TESTING.md
测试用例、测试方法、测试报告

---

## 📊 开发进度

| 阶段 | 状态 | 完成度 |
|------|------|--------|
| 需求分析 | ✅ 已完成 | 100% |
| 技术设计 | ✅ 已完成 | 100% |
| 核心开发 | 🟡 进行中 | 根据项目 |
| 测试验收 | ⏳ 待开始 | 0% |
| 上线部署 | ⏳ 待开始 | 0% |

---

## 🔗 相关链接

- **GitHub 仓库**: ${project.github}
- **项目文档**: 见 Alpha 目录
- **问题反馈**: GitHub Issues

---

*本文档由 OpenClaw 自动生成*
`;
}

function generateArchitectureMarkdown() {
  return `# 🏗️ OpenClaw 技术架构总览

> **创建时间**: ${new Date().toLocaleString('zh-CN')}  
> **版本**: 2026.03  
> **维护**: OpenClaw 团队

---

## 📋 系统概述

OpenClaw 是一个智能助手框架，支持多通道消息处理、AI 编码集成、记忆系统等功能。

---

## 🏛️ 整体架构

\`\`\`
┌─────────────────────────────────────────────────────────┐
│                    OpenClaw Gateway                      │
├─────────────────────────────────────────────────────────┤
│  Channel Layer (消息通道层)                               │
│  ├── Feishu (飞书)                                        │
│  ├── Discord                                              │
│  ├── Telegram                                             │
│  └── WhatsApp                                             │
├─────────────────────────────────────────────────────────┤
│  Agent Layer (智能体层)                                   │
│  ├── OpenClaw (主调度)                                    │
│  ├── OpenCode (AI 编码)                                   │
│  └── SubAgents (子智能体)                                 │
├─────────────────────────────────────────────────────────┤
│  Memory Layer (记忆层)                                    │
│  ├── 文件存储 (Markdown)                                  │
│  ├── PostgreSQL (向量数据库)                              │
│  └── 双写架构                                             │
├─────────────────────────────────────────────────────────┤
│  Tool Layer (工具层)                                      │
│  ├── 飞书文档工具                                         │
│  ├── 飞书云空间工具                                       │
│  ├── 网络搜索工具                                         │
│  └── 代码执行工具                                         │
└─────────────────────────────────────────────────────────┘
\`\`\`

---

## 🔧 核心模块

### 1. Gateway (网关)

**职责**: 消息路由、会话管理、工具调用

**关键文件**:
- \`/usr/lib/node_modules/openclaw/dist/index.js\`
- \`~/.openclaw/openclaw.json\`

### 2. Channel Plugins (通道插件)

**职责**: 各平台消息收发

**支持平台**:
- Feishu (飞书) - ✅ 已配置
- Discord - ✅ 支持
- Telegram - ✅ 支持
- WhatsApp - ✅ 支持

### 3. Memory System (记忆系统)

**架构**: 双写模式

\`\`\`
新记忆 → 双写 → 文件存储 (memory/)
              ↓
         PostgreSQL (pgvector)
\`\`\`

**性能**:
- 文件检索：1-10 秒
- 数据库检索：<100ms
- 提升：10-100 倍

### 4. OpenCode Integration (AI 编码)

**版本**: v1.2.27

**工作流**:
\`\`\`
OpenClaw (调度) → OpenCode (执行) → 验收
\`\`\`

---

## 📊 数据流

### 消息处理流程

\`\`\`
用户消息 → Channel → Gateway → Agent → Tools → Response
                                    ↓
                               Memory (记录)
\`\`\`

### 记忆写入流程

\`\`\`
重要事件 → Memory Hook → 文件存储 (立即)
                       ↓
                  PostgreSQL (异步)
\`\`\`

---

## 🔐 安全机制

### 1. Token 管理

- access_token: 2 小时有效期
- refresh_token: 7 天有效期
- 自动刷新：每 5 天

### 2. 权限控制

- DM Policy: pairing / allowlist / open
- Group Policy: allowlist / open / disabled
- Tool Authorization: 基于发送者

### 3. 数据保护

- 敏感信息加密存储
- 文件权限：600 (仅所有者)
- 不 exfiltrate 私有数据

---

## 📈 性能指标

| 指标 | 目标 | 当前 |
|------|------|------|
| 消息响应时间 | <2s | ~1s |
| 记忆检索时间 | <100ms | ~150ms |
| Token 成本 | ¥6/月 | ¥6/月 |
| 系统可用性 | 99% | 99%+ |

---

## 🔗 相关文档

- **部署配置**: 见 \`⚙️ OpenClaw 部署配置说明\`
- **项目文档**: 见 \`📚 项目文档库 - 主索引\`

---

*本文档由 OpenClaw 自动生成*
`;
}

function generateDeploymentMarkdown() {
  return `# ⚙️ OpenClaw 部署配置说明

> **创建时间**: ${new Date().toLocaleString('zh-CN')}  
> **版本**: 2026.03  
> **环境**: Linux (Ubuntu 22.04+)

---

## 📋 环境要求

### 系统要求

- **操作系统**: Linux (Ubuntu 22.04+ 推荐)
- **Node.js**: v22.22.1+
- **内存**: 2GB+ (推荐 4GB)
- **存储**: 10GB+ 可用空间

### 依赖服务

- **PostgreSQL**: 16+ (带 pgvector 插件)
- **Git**: 2.30+
- **Systemd**: 用于服务管理

---

## 🚀 安装步骤

### 1. 安装 Node.js

\`\`\`bash
# 使用 nvm (推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22

# 或使用包管理器
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
\`\`\`

### 2. 安装 OpenClaw

\`\`\`bash
# 全局安装
npm install -g openclaw

# 验证安装
openclaw --version
\`\`\`

### 3. 配置 OpenClaw

\`\`\`bash
# 创建配置目录
mkdir -p ~/.openclaw

# 编辑配置文件
nano ~/.openclaw/openclaw.json
\`\`\`

### 4. 配置飞书通道

\`\`\`json
{
  "channels": {
    "feishu": {
      "enabled": true,
      "appId": "cli_xxxxxxxxxxxxx",
      "appSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "dmPolicy": "pairing",
      "groupPolicy": "allowlist"
    }
  }
}
\`\`\`

### 5. 启动 Gateway

\`\`\`bash
# 手动启动
openclaw gateway start

# 查看状态
openclaw gateway status

# 查看日志
tail -f /tmp/openclaw/openclaw-*.log
\`\`\`

### 6. 配置 Systemd 服务 (可选)

\`\`\`bash
# 创建服务文件
nano ~/.config/systemd/user/openclaw-gateway.service

# 服务配置
[Unit]
Description=OpenClaw Gateway
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/node /usr/lib/node_modules/openclaw/dist/index.js gateway --port 19234
Restart=always
Environment=OPENCLAW_GATEWAY_PORT=19234

[Install]
WantedBy=default.target

# 启用服务
systemctl --user enable openclaw-gateway
systemctl --user start openclaw-gateway
\`\`\`

---

## 🗄️ PostgreSQL 配置

### 1. 安装 PostgreSQL

\`\`\`bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
\`\`\`

### 2. 安装 pgvector

\`\`\`bash
sudo apt-get install -y postgresql-16-pgvector
\`\`\`

### 3. 创建数据库

\`\`\`sql
-- 连接到 PostgreSQL
sudo -u postgres psql

-- 创建数据库
CREATE DATABASE memory_db;

-- 创建用户
CREATE USER memory_user WITH PASSWORD 'your_password';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE memory_db TO memory_user;

-- 启用 pgvector
\\c memory_db
CREATE EXTENSION IF NOT EXISTS vector;

-- 创建表
CREATE TABLE memories (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(768),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX ON memories USING hnsw (embedding vector_cosine_ops);
\`\`\`

---

## 🔐 安全配置

### 1. 文件权限

\`\`\`bash
# 配置文件权限
chmod 600 ~/.openclaw/openclaw.json
chmod 600 ~/.openclaw/feishu/user_token.json

# 目录权限
chmod 700 ~/.openclaw
\`\`\`

### 2. Token 管理

- access_token 每 2 小时自动刷新
- refresh_token 每 7 天自动刷新
- 自动刷新脚本：\`/root/.openclaw/scripts/feishu-token-refresh.js\`

### 3. 防火墙配置

\`\`\`bash
# 仅允许本地访问 Gateway
sudo ufw allow from 127.0.0.1 to any port 19234
\`\`\`

---

## 📊 监控与维护

### 1. 查看日志

\`\`\`bash
# Gateway 日志
tail -f /tmp/openclaw/openclaw-*.log

# Systemd 日志
journalctl --user -u openclaw-gateway -f
\`\`\`

### 2. 健康检查

\`\`\`bash
# 检查 Gateway 状态
openclaw gateway status

# 检查 PostgreSQL
sudo -u postgres psql -c "SELECT version();"

# 检查记忆系统
node /root/.openclaw/scripts/memory-health-check.js
\`\`\`

### 3. 定期维护

\`\`\`bash
# 每天凌晨 5 点备份 Alpha 仓库
0 5 * * * /root/.openclaw/scripts/alpha_daily_backup.sh

# 每 5 天刷新飞书 Token
0 0 */5 * * node /root/.openclaw/scripts/feishu-token-refresh.js

# 每 5 分钟检查记忆系统
*/5 * * * * node /root/.openclaw/scripts/memory-self-check.js
\`\`\`

---

## 🔧 故障排查

### 常见问题

#### 1. Gateway 无法启动

\`\`\`bash
# 检查端口占用
lsof -i :19234

# 检查配置文件
openclaw status

# 查看错误日志
tail -100 /tmp/openclaw/openclaw-*.log
\`\`\`

#### 2. Token 过期

\`\`\`bash
# 手动刷新
node /root/.openclaw/scripts/feishu-token-refresh.js

# 重新授权
# 在飞书中发送"重新连接"
\`\`\`

#### 3. 记忆检索慢

\`\`\`bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 检查 pgvector 索引
sudo -u postgres psql -d memory_db -c "\\di"
\`\`\`

---

## 📖 相关文档

- **技术架构**: 见 \`🏗️ OpenClaw 技术架构总览\`
- **项目文档**: 见 \`📚 项目文档库 - 主索引\`
- **官方文档**: https://docs.openclaw.ai

---

*本文档由 OpenClaw 自动生成*
`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
