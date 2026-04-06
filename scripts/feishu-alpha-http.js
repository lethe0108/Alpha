#!/usr/bin/env node
/**
 * 直接使用 HTTP + OAuth Token 创建 Alpha 目录文档
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const tokenData = JSON.parse(fs.readFileSync(path.join(process.env.HOME, '.openclaw', 'feishu', 'user_token.json'), 'utf8'));
const accessToken = tokenData.access_token;
const alphaFolderToken = 'O4REfrwt1lSbRUd7ha0cLyxinVb';

console.log('🦞 使用 HTTP + OAuth Token 创建 Alpha 目录文档\n');
console.log('Alpha 目录：https://xvgo1faf8xg.feishu.cn/drive/folder/' + alphaFolderToken);
console.log('');

const folders = [
  { name: '📊 项目总览' },
  { name: '✅ 已完成项目' },
  { name: '🟡 进行中项目' },
  { name: '📚 技术文档' }
];

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

const folderTokens = {};
const createdDocs = [];

run();

async function run() {
  // 步骤 1：验证权限
  console.log('【步骤 1】验证 OAuth 权限...');
  const canAccess = await verifyAccess();
  if (!canAccess) {
    console.log('❌ 权限验证失败');
    return;
  }
  console.log('✅ 权限验证通过\n');
  
  // 步骤 2：创建文件夹
  console.log('【步骤 2】创建分类文件夹...');
  await createFolders();
  console.log('');
  
  // 步骤 3：创建文档
  console.log('【步骤 3】创建项目文档...');
  await createDocuments();
  console.log('');
  
  // 步骤 4：验证
  console.log('【步骤 4】验证结果...');
  await verify();
  
  // 保存配置
  saveConfig();
}

function apiRequest(method, apiPath, data) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'open.feishu.cn',
      path: apiPath,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          reject(new Error('解析失败：' + responseData));
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function verifyAccess() {
  try {
    const res = await apiRequest('GET', '/open-apis/drive/v1/files?parent_type=folder&parent_token=' + alphaFolderToken + '&limit=5');
    if (res.code === 0) {
      console.log('  ✅ 可以访问 Alpha 目录');
      console.log('     目录中有 ' + (res.data?.files?.length || 0) + ' 个文件/文件夹');
      return true;
    }
    console.log('  ❌ 访问失败：' + res.msg);
    return false;
  } catch (e) {
    console.log('  ❌ 异常：' + e.message);
    return false;
  }
}

async function createFolders() {
  for (const folder of folders) {
    console.log('  创建：' + folder.name);
    try {
      const res = await apiRequest('POST', '/open-apis/drive/v1/files', {
        name: folder.name,
        parent_token: alphaFolderToken,
        parent_type: 'folder',
        obj_type: 'folder'
      });
      
      if (res.code === 0) {
        console.log('    ✅ Token: ' + res.data.token);
        folderTokens[folder.name] = res.data.token;
      } else {
        console.log('    ⚠️  ' + res.msg);
        await findExistingFolder(folder.name);
      }
    } catch (e) {
      console.log('    ❌ ' + e.message);
      await findExistingFolder(folder.name);
    }
    await sleep(500);
  }
}

async function findExistingFolder(name) {
  try {
    const res = await apiRequest('GET', '/open-apis/drive/v1/files?parent_type=folder&parent_token=' + alphaFolderToken + '&limit=100');
    if (res.code === 0 && res.data?.files) {
      const existing = res.data.files.find(f => f.type === 'folder' && f.name === name);
      if (existing) {
        folderTokens[name] = existing.token;
        console.log('    ✓ 找到现有：' + existing.token);
      }
    }
  } catch (e) {}
}

async function createDocuments() {
  for (const doc of docs) {
    const targetFolder = folderTokens[doc.folder];
    if (!targetFolder) {
      console.log('  ⚠️  跳过 ' + doc.title);
      continue;
    }
    
    console.log('  创建：' + doc.title);
    try {
      // 1. 创建文档
      const createRes = await apiRequest('POST', '/open-apis/docx/v1/documents', {
        title: doc.title,
        folder_token: targetFolder
      });
      
      if (createRes.code !== 0) throw new Error(createRes.msg);
      
      const docId = createRes.data.document.document_id;
      
      // 2. 转换 Markdown
      const convertRes = await apiRequest('POST', '/open-apis/docx/v1/document/convert', {
        content_type: 'markdown',
        content: doc.content
      });
      
      if (convertRes.code !== 0) throw new Error(convertRes.msg);
      
      // 3. 写入内容
      const insertRes = await apiRequest('POST', '/open-apis/docx/v1/documents/' + docId + '/blocks/' + docId + '/descendants', {
        children_id: convertRes.data.first_level_block_ids,
        descendants: convertRes.data.blocks,
        index: -1
      });
      
      if (insertRes.code !== 0) throw new Error(insertRes.msg);
      
      console.log('    ✅ https://xvgo1faf8xg.feishu.cn/docx/' + docId);
      createdDocs.push({ title: doc.title, id: docId, folder: doc.folder });
      await sleep(1500);
    } catch (e) {
      console.log('    ❌ ' + e.message);
    }
  }
}

async function verify() {
  await sleep(3000);
  console.log('  检查 Alpha 目录...');
  
  try {
    const res = await apiRequest('GET', '/open-apis/drive/v1/files?parent_type=folder&parent_token=' + alphaFolderToken + '&limit=100');
    if (res.code === 0 && res.data?.files) {
      const ourFolders = res.data.files.filter(f => f.type === 'folder' && folders.some(folder => folder.name === f.name));
      console.log('  ✅ 分类文件夹：' + ourFolders.length + '/' + folders.length);
      
      const ourDocs = res.data.files.filter(f => f.type === 'docx' && docs.some(doc => doc.title === f.name));
      console.log('  ✅ 项目文档：' + ourDocs.length + '/' + docs.length);
    }
  } catch (e) {
    console.log('  ⚠️  验证失败：' + e.message);
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
    authType: 'OAuth 用户身份 + HTTP'
  };
  
  const memoryPath = path.join(process.env.HOME, '.openclaw', 'workspace', 'memory', 'feishu-alpha-config.json');
  fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
  
  console.log('\n💾 配置已保存到记忆系统');
  console.log('\n' + '='.repeat(70));
  console.log('✅ 完成！');
  console.log('='.repeat(70));
  console.log('\n📁 完整目录结构:');
  console.log('Alpha 目录：https://xvgo1faf8xg.feishu.cn/drive/folder/' + alphaFolderToken);
  
  Object.entries(folderTokens).forEach(([folderName, folderToken]) => {
    console.log('\n  📁 ' + folderName);
    console.log('     https://xvgo1faf8xg.feishu.cn/drive/folder/' + folderToken);
    
    const docsInFolder = createdDocs.filter(d => d.folder === folderName);
    docsInFolder.forEach(d => {
      console.log('    📄 ' + d.title);
      console.log('       https://xvgo1faf8xg.feishu.cn/docx/' + d.id);
    });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============ 文档内容（简化版）============

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

## 🎯 核心功能

1. 场景自适应引擎 - 5 种改写模式
2. DeepSeek API 集成
3. 质量评估系统

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

## 📅 开发计划

- 阶段 1：架构设计（1 周）
- 阶段 2：核心开发（2 周）
- 阶段 3：测试优化（1 周）
- 阶段 4：部署上线（1 周）

---

*立项时间：2026-03-19*`;
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

function getOpenCodeMd() {
  return `# OpenCode 集成

**项目 ID**: PROJECT-20260320-007  
**状态**: 🟡 进行中  
**版本**: OpenCode v1.2.27

---

## 📋 项目概况

AI 编码工具集成，支持 Plan/Build 工作流

---

## ⏭️ 下一步计划

1. 配置 Provider
2. 测试基本命令
3. 创建测试项目

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

## ✅ Phase 4 完成总结

- 测试套件 - 37 个测试全部通过
- AI 深度解读 - 多模型支持
- 双模式解读 - 经典+AI
- 学习中心 - 64 卦完整数据

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

## 🎯 核心模块

1. Gateway - 消息路由
2. Channels - 平台适配
3. Memory - 双写架构
4. OpenCode - AI 编码

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

## 🚀 安装步骤

1. nvm install 22
2. npm install -g openclaw
3. 配置~/.openclaw/openclaw.json
4. openclaw gateway start

---

## 🗄️ PostgreSQL 配置

1. sudo apt-get install postgresql postgresql-contrib
2. sudo apt-get install postgresql-16-pgvector
3. CREATE DATABASE memory_db
4. CREATE EXTENSION vector

---

*最后更新：2026-03-21*`;
}
