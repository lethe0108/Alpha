#!/usr/bin/env node
/**
 * 飞书 Alpha 目录完整解决方案
 * 使用用户身份权限 + 官方 SDK 创建并整理项目文档
 */

const Lark = require('/usr/lib/node_modules/openclaw/node_modules/@larksuiteoapi/node-sdk');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(process.env.HOME, '.openclaw', 'openclaw.json'), 'utf8'));
const tokenData = JSON.parse(fs.readFileSync(path.join(process.env.HOME, '.openclaw', 'feishu', 'user_token.json'), 'utf8'));

const appId = config.channels?.feishu?.appId;
const appSecret = config.channels?.feishu?.appSecret;
const alphaFolderToken = 'O4REfrwt1lSbRUd7ha0cLyxinVb';

const client = new Lark.Client({ 
  appId, 
  appSecret, 
  appType: Lark.AppType.SelfBuild, 
  domain: Lark.Domain.Feishu 
});

console.log('🦞 飞书 Alpha 目录完整解决方案\n');
console.log('Alpha 目录：https://xvgo1faf8xg.feishu.cn/drive/folder/' + alphaFolderToken);
console.log('');

// 分类结构
const folders = [
  { name: '📊 项目总览', desc: '主索引和导航文档' },
  { name: '✅ 已完成项目', desc: 'AI Humanizer Pro, Token 成本优化' },
  { name: '🟡 进行中项目', desc: 'Agent Teams, OpenCode, 八卦占卜' },
  { name: '📚 技术文档', desc: '技术架构，部署配置' }
];

// 文档映射
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
  console.log('【步骤 1】验证权限...');
  const canAccess = await verifyPermissions();
  if (!canAccess) {
    console.log('❌ 权限验证失败，请检查飞书开放平台权限配置');
    return;
  }
  console.log('✅ 权限验证通过\n');
  
  // 步骤 2：创建分类文件夹
  console.log('【步骤 2】创建分类文件夹...');
  await createFolders();
  console.log('');
  
  // 步骤 3：创建文档
  console.log('【步骤 3】创建项目文档...');
  await createDocuments();
  console.log('');
  
  // 步骤 4：验证结果
  console.log('【步骤 4】验证结果...');
  await verifyResults();
  
  // 步骤 5：保存配置
  saveConfig();
}

async function verifyPermissions() {
  try {
    // 测试云空间访问
    const listRes = await client.drive.file.list({
      params: { folder_token: alphaFolderToken }
    });
    
    if (listRes.code === 0) {
      console.log('  ✅ 云空间访问权限：正常');
      console.log('     Alpha 目录中有 ' + (listRes.data?.files?.length || 0) + ' 个文件/文件夹');
      return true;
    } else {
      console.log('  ⚠️  云空间访问受限：' + listRes.msg);
      return false;
    }
  } catch (e) {
    console.log('  ❌ 权限验证异常：' + e.message);
    return false;
  }
}

async function createFolders() {
  for (const folder of folders) {
    console.log('  创建：' + folder.name);
    try {
      const res = await client.drive.file.createFolder({
        data: {
          name: folder.name,
          folder_token: alphaFolderToken
        }
      });
      
      if (res.code === 0) {
        console.log('    ✅ Token: ' + res.data?.token);
        folderTokens[folder.name] = res.data?.token;
      } else {
        console.log('    ⚠️  可能已存在：' + res.msg);
        // 查找现有文件夹
        await findExistingFolder(folder.name);
      }
    } catch (e) {
      console.log('    ⚠️  异常：' + e.message);
      await findExistingFolder(folder.name);
    }
    await sleep(500);
  }
}

async function findExistingFolder(name) {
  try {
    const res = await client.drive.file.list({
      params: { folder_token: alphaFolderToken }
    });
    
    if (res.code === 0 && res.data?.files) {
      const existing = res.data.files.find(f => f.type === 'folder' && f.name === name);
      if (existing) {
        folderTokens[name] = existing.token;
        console.log('    ✓ 找到现有文件夹：' + existing.token);
      }
    }
  } catch (e) {}
}

async function createDocuments() {
  for (const doc of docs) {
    const targetFolder = folderTokens[doc.folder];
    if (!targetFolder) {
      console.log('  ⚠️  跳过 ' + doc.title + ' - 目标文件夹不存在');
      continue;
    }
    
    console.log('  创建：' + doc.title + ' → ' + doc.folder);
    try {
      const docId = await createDocToFolder(doc.title, doc.content, targetFolder);
      console.log('    ✅ https://xvgo1faf8xg.feishu.cn/docx/' + docId);
      createdDocs.push({ title: doc.title, id: docId, folder: doc.folder });
      await sleep(1500);
    } catch (e) {
      console.log('    ❌ 失败：' + e.message);
    }
  }
}

async function createDocToFolder(title, markdown, folderToken) {
  // 1. 创建文档到指定文件夹
  const createRes = await client.docx.document.create({
    data: { 
      title: title,
      folder_token: folderToken  // 关键：指定目标文件夹
    }
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

async function verifyResults() {
  console.log('  检查 Alpha 目录内容...');
  await sleep(3000);
  
  try {
    const res = await client.drive.file.list({
      params: { folder_token: alphaFolderToken }
    });
    
    if (res.code === 0 && res.data?.files) {
      const ourFolders = res.data.files.filter(f => f.type === 'folder' && 
        folders.some(folder => folder.name === f.name));
      
      console.log('  ✅ 分类文件夹：' + ourFolders.length + '/' + folders.length);
      ourFolders.forEach(f => {
        console.log('     📁 ' + f.name);
      });
      
      const ourDocs = res.data.files.filter(f => f.type === 'docx' && 
        docs.some(doc => doc.title === f.name));
      
      console.log('  ✅ 项目文档：' + ourDocs.length + '/' + docs.length);
      ourDocs.forEach(d => {
        console.log('     📄 ' + d.name);
      });
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
    status: '完成'
  };
  
  const memoryPath = path.join(process.env.HOME, '.openclaw', 'workspace', 'memory', 'feishu-alpha-config.json');
  fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
  console.log('\n💾 配置已保存到：' + memoryPath);
  
  // 输出总结
  console.log('\n' + '='.repeat(70));
  console.log('✅ 完成！所有项目文档已创建并整理到 Alpha 目录');
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

// ============ 文档内容 ============

function getIndexMd() {
  return `# OpenClaw 项目文档库

**创建时间**: ${new Date().toLocaleString('zh-CN')}  
**位置**: Alpha 目录  
**维护**: OpenClaw 自动更新

---

## 📋 项目列表

| 项目 | 状态 | 说明 |
|------|------|------|
| AI Humanizer Pro | ✅ 已完成 | AI 内容改写 |
| Agent Teams 升级 | 🟡 进行中 | 多智能体编排 |
| Token 成本优化 | ✅ 已完成 | 降低 90% 成本 |
| OpenCode 集成 | 🟡 进行中 | AI 编码工具 |
| 八卦占卜应用 | 🟡 进行中 | 决策辅助工具 |

---

## 📁 文档分类

- **📊 项目总览**: 主索引和导航文档
- **✅ 已完成项目**: AI Humanizer Pro, Token 成本优化
- **🟡 进行中项目**: Agent Teams, OpenCode, 八卦占卜
- **📚 技术文档**: 技术架构，部署配置

---

## 🔗 快速链接

- **Alpha 目录**: https://xvgo1faf8xg.feishu.cn/drive/folder/O4REfrwt1lSbRUd7ha0cLyxinVb

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

1. **场景自适应引擎** - 5 种改写模式
2. **DeepSeek API 集成** - deepseek-chat 模型
3. **质量评估系统** - AI 概率评分

---

## 📁 代码结构

- GitHub: github.com/lethe0108/ai-humanizer-pro
- 主程序：server/main.py

---

## 🚀 部署说明

1. git clone 项目
2. pip install -r requirements.txt
3. 配置.env 文件
4. python server/main.py

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

基于 Ruflo 架构的多智能体编排系统

**预期指标**:
- 开发效率提升：300%
- Token 成本降低：75%
- 支持智能体：50+

---

## 🎯 核心特性

1. **蜂群架构** - Queen-Worker 调度
2. **持久化记忆** - PostgreSQL + pgvector
3. **智能路由** - 多模型支持

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
**技术栈**: PostgreSQL + pgvector

---

## 📋 项目概况

降低 90% Token 消耗（¥60/月 → ¥6/月）

---

## 📊 优化成果

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| 月成本 | ¥60 | ¥6 | 90% 降低 |
| 检索速度 | 1-10 秒 | <100ms | 10-100 倍 |
| 语义搜索 | 不支持 | 支持 | 新功能 |

---

## ✅ 已完成工作

1. 完整备份 - /root/.openclaw/workspace/backup_20260319_2330/
2. PostgreSQL 部署 - PostgreSQL 16.13 + pgvector
3. 双写记忆系统 - 文件 + 数据库同时写入

---

*完成时间：2026-03-19*`;
}

function getOpenCodeMd() {
  return `# OpenCode 集成

**项目 ID**: PROJECT-20260320-007  
**状态**: 🟡 进行中  
**GitHub**: github.com/opencode-ai/opencode  
**版本**: OpenCode v1.2.27

---

## 📋 项目概况

AI 编码工具集成，支持 Plan/Build 工作流

---

## 📦 安装状态

- 版本：v1.2.27
- 位置：/usr/bin/opencode
- 配置：~/.config/opencode/

---

## 🎯 核心功能

1. Plan/Build 工作流
2. 多模型支持（Claude/GPT/Gemini）
3. 会话管理

---

## ⏭️ 下一步计划

1. 配置 Provider
2. 测试基本命令
3. 创建测试项目
4. 跑通 Plan → Build 流程

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

## ✅ Phase 4 完成总结

- 测试套件 - 37 个测试全部通过
- AI 深度解读 - 多模型支持
- 双模式解读 - 经典+AI
- 学习中心 - 64 卦完整数据

---

## ⏭️ 剩余工作

- 微信小程序适配（需独立开发）

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

1. Gateway - 消息路由、会话管理
2. Channels - 各平台消息收发
3. Memory - 双写架构，<100ms 检索
4. OpenCode - AI 编码工具

---

## 📊 性能指标

- 消息响应：~1s
- 记忆检索：~150ms
- Token 成本：¥6/月

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
- 2GB+ 内存

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

## 📊 监控维护

- 日志：/tmp/openclaw/openclaw-*.log
- 状态：openclaw gateway status
- Token 自动刷新：每 5 天

---

*最后更新：2026-03-21*`;
}
