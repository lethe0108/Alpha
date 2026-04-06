#!/usr/bin/env node
const Lark = require('/usr/lib/node_modules/openclaw/node_modules/@larksuiteoapi/node-sdk');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(process.env.HOME, '.openclaw', 'openclaw.json'), 'utf8'));
const tokenData = JSON.parse(fs.readFileSync(path.join(process.env.HOME, '.openclaw', 'feishu', 'user_token.json'), 'utf8'));

const appId = config.channels?.feishu?.appId;
const appSecret = config.channels?.feishu?.appSecret;
const alphaFolderToken = 'O4REfrwt1lSbRUd7ha0cLyxinVb';

const client = new Lark.Client({ appId, appSecret, appType: Lark.AppType.SelfBuild, domain: Lark.Domain.Feishu });

console.log('📚 创建 Alpha 项目文档库 (简化版)...\n');

const projects = [
  { id: '004', name: 'AI Humanizer Pro', status: '✅ 已完成', github: 'github.com/lethe0108/ai-humanizer-pro', desc: 'AI 内容改写为人类风格' },
  { id: '005', name: 'Agent Teams 升级', status: '🟡 已立项', github: '待创建', desc: '多智能体编排系统' },
  { id: '006', name: 'Token 成本优化', status: '✅ 已完成', github: '系统优化', desc: '降低 90% Token 消耗' },
  { id: '007', name: 'OpenCode 集成', status: '🟢 待配置', github: 'github.com/opencode-ai/opencode', desc: 'AI 编码工具集成' },
  { id: '008', name: '八卦占卜应用', status: '🟢 已立项', github: 'github.com/lethe0108/divination', desc: '个人决策辅助工具' }
];

run();

async function run() {
  try {
    // 1. 主索引
    console.log('【1】创建主索引...');
    const indexId = await createDoc(alphaFolderToken, '📚 OpenClaw 项目文档库 - 主索引');
    let md = '# OpenClaw 项目文档库\n\n创建时间：' + new Date().toLocaleString('zh-CN') + '\n\n';
    md += '## 项目列表\n\n';
    projects.forEach(p => { md += `### ${p.name}\n- ID: ${p.id}\n- 状态：${p.status}\n- GitHub: ${p.github}\n- 描述：${p.desc}\n\n`; });
    await writeDoc(indexId, md);
    console.log('✅ 主索引：https://open.feishu.cn/docx/' + indexId);

    // 2. 项目文档
    for (const p of projects) {
      console.log(`【项目】${p.name}...`);
      const docId = await createDoc(alphaFolderToken, `📄 ${p.name} - 完整文档`);
      const pmd = generateProjectDoc(p);
      await writeDoc(docId, pmd);
      console.log(`✅ ${p.name}: https://open.feishu.cn/docx/${docId}`);
      await sleep(500);
    }

    // 3. 技术架构
    console.log('【架构】创建技术架构文档...');
    const archId = await createDoc(alphaFolderToken, '🏗️ OpenClaw 技术架构');
    await writeDoc(archId, getArchDoc());
    console.log('✅ 架构：https://open.feishu.cn/docx/' + archId);

    // 4. 部署配置
    console.log('【部署】创建部署配置文档...');
    const depId = await createDoc(alphaFolderToken, '⚙️ OpenClaw 部署配置');
    await writeDoc(depId, getDeployDoc());
    console.log('✅ 部署：https://open.feishu.cn/docx/' + depId);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 完成！共创建 ' + (projects.length + 3) + ' 个文档');
    console.log('='.repeat(60));

  } catch (e) {
    console.log('❌ 错误:', e.message);
    process.exit(1);
  }
}

async function createDoc(folderToken, title) {
  const res = await client.docx.document.create({
    data: { parent_type: 'folder', parent_token: folderToken, title }
  });
  if (res.code !== 0) throw new Error(res.msg);
  return res.data.document.document_id;
}

async function writeDoc(docId, markdown) {
  const convert = await client.docx.document.convert({
    data: { content_type: 'markdown', content: markdown }
  });
  if (convert.code !== 0) throw new Error('转换失败：' + convert.msg);
  
  const insert = await client.docx.documentBlockDescendant.create({
    path: { document_id: docId, block_id: docId },
    data: { children_id: convert.data.first_level_block_ids, descendants: convert.data.blocks, index: -1 }
  });
  if (insert.code !== 0) throw new Error('插入失败：' + insert.msg);
}

function generateProjectDoc(p) {
  return `# ${p.name}

项目 ID: ${p.id}
状态：${p.status}
GitHub: ${p.github}

## 项目描述

${p.desc}

## 技术栈

根据项目需求确定

## 文档结构

- README.md - 项目说明
- API.md - API 文档
- DEPLOYMENT.md - 部署说明
- TESTING.md - 测试文档

## 开发进度

1. 需求分析 - 已完成
2. 技术设计 - 已完成
3. 核心开发 - 进行中
4. 测试验收 - 待开始

## 相关链接

- GitHub: ${p.github}
- 文档：见 Alpha 目录
`;
}

function getArchDoc() {
  return `# OpenClaw 技术架构

## 整体架构

OpenClaw Gateway
├── Channel Layer (消息通道)
│   ├── Feishu
│   ├── Discord
│   └── Telegram
├── Agent Layer (智能体)
│   ├── OpenClaw (主调度)
│   └── OpenCode (AI 编码)
├── Memory Layer (记忆)
│   ├── 文件存储
│   └── PostgreSQL
└── Tool Layer (工具)

## 核心模块

1. Gateway - 消息路由
2. Channels - 平台适配
3. Memory - 双写架构
4. Tools - 功能扩展

## 数据流

用户消息 -> Channel -> Gateway -> Agent -> Tools -> 响应
                              ↓
                         Memory 记录
`;
}

function getDeployDoc() {
  return `# OpenClaw 部署配置

## 环境要求

- Linux Ubuntu 22.04+
- Node.js v22+
- PostgreSQL 16+
- 2GB+ 内存

## 安装步骤

1. 安装 Node.js
2. npm install -g openclaw
3. 配置 ~/.openclaw/openclaw.json
4. openclaw gateway start

## PostgreSQL 配置

CREATE DATABASE memory_db;
CREATE EXTENSION vector;

## 安全配置

- 文件权限 600
- Token 自动刷新
- 防火墙限制

## 监控维护

- 日志：/tmp/openclaw/openclaw-*.log
- 状态：openclaw gateway status
- 定时任务：cron
`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
