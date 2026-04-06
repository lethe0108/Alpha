#!/usr/bin/env node
/**
 * 使用飞书官方插件的正确方法写入文档
 * convert + documentBlockChildren.create
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

// 注入用户 Token
const originalRequest = client.httpInstance.request;
client.httpInstance.request = function(cfg) {
  cfg.headers = cfg.headers || {};
  cfg.headers['Authorization'] = 'Bearer ' + userAccessToken;
  return originalRequest.call(this, cfg);
};

console.log('🦞 使用官方方法创建文档...\n');

// 使用之前创建的文件夹
const folderTokens = {
  '📊 项目总览': 'B4nWfir8YlEeM6dn9ypcNmrenxh',
  '✅ 已完成项目': 'JCIHfns5XlmeT9dkTjgcKZIVnih',
  '🟡 进行中项目': 'QKwsfsw8FlC42LdVsXVcOHOon58',
  '📚 技术文档': 'Uissfyz9Nl5fFbdZqWLcQjv7nod'
};

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

const createdDocs = [];

run();

async function run() {
  console.log('【创建文档】\n');
  
  for (const doc of docs) {
    const targetFolder = folderTokens[doc.folder];
    if (!targetFolder) {
      console.log('⚠️  跳过 ' + doc.title);
      continue;
    }
    
    console.log('创建：' + doc.title);
    try {
      // 1. 创建文档
      const createRes = await client.docx.document.create({
        data: { title: doc.title, folder_token: targetFolder }
      });
      
      if (createRes.code !== 0) throw new Error('创建失败：' + createRes.msg);
      
      const docId = createRes.data.document.document_id;
      
      // 2. 转换 Markdown（官方方法）
      const convertRes = await client.docx.document.convert({
        data: { content_type: 'markdown', content: doc.content }
      });
      
      if (convertRes.code !== 0) throw new Error('转换失败：' + convertRes.msg);
      
      // 3. 使用 documentBlockChildren.create 写入（官方方法）
      const blocks = convertRes.data?.blocks || [];
      const firstLevelIds = convertRes.data?.first_level_block_ids || [];
      
      if (blocks.length === 0) {
        throw new Error('转换后 blocks 为空');
      }
      
      // 逐个插入 blocks（官方方法，保证顺序）
      for (const [index, block] of blocks.entries()) {
        const insertRes = await client.docx.documentBlockChildren.create({
          path: { document_id: docId, block_id: docId },
          data: {
            children: [block],
            index: index
          }
        });
        
        if (insertRes.code !== 0) {
          throw new Error('插入失败：' + insertRes.msg);
        }
      }
      
      console.log('  ✅ https://xvgo1faf8xg.feishu.cn/docx/' + docId);
      createdDocs.push({ title: doc.title, id: docId, folder: doc.folder });
      await sleep(2000);
    } catch (e) {
      console.log('  ❌ ' + e.message);
    }
  }
  
  // 验证
  console.log('\n【验证】\n');
  await sleep(3000);
  await verify();
  
  // 保存
  saveConfig();
}

async function verify() {
  const res = await client.drive.file.list({
    params: { folder_token: alphaFolderToken }
  });
  
  if (res.code === 0 && res.data?.files) {
    const ourDocs = res.data.files.filter(f => f.type === 'docx' && 
      docs.some(doc => doc.title === f.name)
    );
    console.log('✅ 项目文档：' + ourDocs.length + '/' + docs.length);
    ourDocs.forEach(d => {
      console.log('  📄 ' + d.name);
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
    method: 'convert + documentBlockChildren.create'
  };
  
  const memoryPath = path.join(process.env.HOME, '.openclaw', 'workspace', 'memory', 'feishu-alpha-config.json');
  fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
  
  console.log('\n💾 配置已保存');
  console.log('\n' + '='.repeat(70));
  console.log('✅ 完成！');
  console.log('='.repeat(70));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============ 文档内容 ============

function getIndexMd() {
  return `# OpenClaw 项目文档库

**创建时间**: ${new Date().toLocaleString('zh-CN')}  
**位置**: Alpha 目录

---

## 📋 项目列表

| 项目 | 状态 |
|------|------|
| AI Humanizer Pro | ✅ 已完成 |
| Agent Teams 升级 | 🟡 进行中 |
| Token 成本优化 | ✅ 已完成 |
| OpenCode 集成 | 🟡 进行中 |
| 八卦占卜应用 | 🟡 进行中 |

---

*最后更新：${new Date().toLocaleString('zh-CN')}*`;
}

function getAIHumanizerMd() {
  return `# AI Humanizer Pro

**项目 ID**: PROJECT-20260319-004  
**状态**: ✅ 已完成  
**GitHub**: https://github.com/lethe0108/ai-humanizer-pro

---

## 📋 项目概况

AI 内容改写为人类写作风格

**核心指标**:
- 开发周期：4 小时
- 测试通过率：100%
- 平均改写时间：<30 秒

---

*完成时间：2026-03-19*`;
}

function getTokenMd() {
  return `# Token 成本优化

**项目 ID**: PROJECT-20260319-006  
**状态**: ✅ 已完成

---

## 📋 项目概况

降低 90% Token 消耗（¥60/月 → ¥6/月）

---

## 📊 优化成果

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| 月成本 | ¥60 | ¥6 |
| 检索速度 | 1-10 秒 | <100ms |

---

*完成时间：2026-03-19*`;
}

function getAgentTeamsMd() {
  return `# Agent Teams 升级

**项目 ID**: PROJECT-20260319-005  
**状态**: 🟡 进行中

---

## 📋 项目概况

基于 Ruflo 架构的多智能体编排系统

**预期指标**:
- 开发效率提升：300%
- Token 成本降低：75%

---

*立项时间：2026-03-19*`;
}

function getOpenCodeMd() {
  return `# OpenCode 集成

**项目 ID**: PROJECT-20260320-007  
**状态**: 🟡 进行中  
**版本**: OpenCode v1.2.27

---

## 📋 项目概况

AI 编码工具集成，支持 Plan/Build 工作流

---

*安装时间：2026-03-20*`;
}

function getDivinationMd() {
  return `# 八卦占卜应用

**项目 ID**: PROJECT-20260321-008  
**状态**: 🟡 Phase 4 完成 (95%)  
**GitHub**: https://github.com/lethe0108/divination

---

## 📋 项目概况

个人决策辅助与心灵指南工具

**核心理念**: "观象玩辞，反求诸己"

---

*最后更新：2026-03-21*`;
}

function getArchMd() {
  return `# OpenClaw 技术架构总览

**版本**: 2026-03-21

---

## 🏗️ 整体架构

OpenClaw Gateway
- Channel Layer - Feishu/Discord/Telegram/WhatsApp
- Agent Layer - OpenClaw/OpenCode/SubAgents
- Memory Layer - 文件存储 + PostgreSQL
- Tool Layer - 飞书文档/云空间/搜索

---

*最后更新：2026-03-21*`;
}

function getDeployMd() {
  return `# OpenClaw 部署配置说明

**版本**: 2026-03-21

---

## 📋 环境要求

- Linux Ubuntu 22.04+
- Node.js v22+
- PostgreSQL 16+

---

*最后更新：2026-03-21*`;
}
