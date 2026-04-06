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

console.log('📁 创建文档并移动到 Alpha 目录\n');

const docs = [
  { title: '📚 OpenClaw 项目文档库 - 主索引', content: getIndexMd() },
  { title: '📄 AI Humanizer Pro - 完整文档', content: getAIHumanizerMd() },
  { title: '📄 Token 成本优化 - 完整文档', content: getTokenMd() },
  { title: '📄 Agent Teams 升级 - 完整文档', content: getAgentTeamsMd() },
  { title: '📄 OpenCode 集成 - 完整文档', content: getOpenCodeMd() },
  { title: '📄 八卦占卜应用 - 完整文档', content: getDivinationMd() },
  { title: '🏗️ 技术架构总览', content: getArchMd() },
  { title: '⚙️ 部署配置说明', content: getDeployMd() }
];

const createdDocs = [];

run();

async function run() {
  // 步骤 1：创建文档到根目录
  console.log('【步骤 1】创建文档到根目录...');
  for (const doc of docs) {
    console.log('  创建：' + doc.title);
    try {
      const docId = await createDoc(doc.title, doc.content);
      console.log('    ✅ ' + docId);
      createdDocs.push({ title: doc.title, id: docId });
      await sleep(1000);
    } catch (e) {
      console.log('    ❌ 失败：' + e.message);
    }
  }
  
  // 步骤 2：移动到 Alpha 目录
  console.log('\n【步骤 2】移动到 Alpha 目录...');
  let moved = 0;
  for (const doc of createdDocs) {
    console.log('  移动：' + doc.title);
    try {
      const res = await client.drive.file.move({
        path: { file_token: doc.id },
        data: { type: 'docx', folder_token: alphaFolderToken }
      });
      if (res.code === 0) {
        console.log('    ✅ 成功');
        moved++;
      } else {
        console.log('    ❌ 失败：' + res.msg);
      }
    } catch (e) {
      console.log('    ❌ 异常：' + e.message);
    }
    await sleep(500);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('✅ 完成！移动 ' + moved + '/' + createdDocs.length + ' 个文档到 Alpha 目录');
  console.log('='.repeat(70));
  
  console.log('\n📁 Alpha 目录：https://xvgo1faf8xg.feishu.cn/drive/folder/' + alphaFolderToken);
  
  // 保存配置
  saveToMemory();
}

async function createDoc(title, markdown) {
  // 创建文档（不指定 folder_token，默认到根目录）
  const createRes = await client.docx.document.create({
    data: { title }
  });
  if (createRes.code !== 0) throw new Error(createRes.msg);
  
  const docId = createRes.data.document.document_id;
  
  // 写入内容
  const convertRes = await client.docx.document.convert({
    data: { content_type: 'markdown', content: markdown }
  });
  if (convertRes.code !== 0) throw new Error(convertRes.msg);
  
  const insertRes = await client.docx.documentBlockDescendant.create({
    path: { document_id: docId, block_id: docId },
    data: { 
      children_id: convertRes.data.first_level_block_ids, 
      descendants: convertRes.data.blocks, 
      index: -1 
    }
  });
  if (insertRes.code !== 0) throw new Error(insertRes.msg);
  
  return docId;
}

function saveToMemory() {
  const memory = {
    alphaFolderToken: alphaFolderToken,
    createdAt: new Date().toISOString(),
    rule: '所有项目文档自动创建并移动到 Alpha 目录 (O4REfrwt1lSbRUd7ha0cLyxinVb)'
  };
  
  const memoryPath = path.join(process.env.HOME, '.openclaw', 'workspace', 'memory', 'feishu-alpha-config.json');
  fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2));
  console.log('\n💾 配置已保存到记忆系统');
  console.log('   文件：' + memoryPath);
}

// ============ 文档内容（简化版）============

function getIndexMd() {
  return `# OpenClaw 项目文档库

创建时间：${new Date().toLocaleString('zh-CN')}
位置：Alpha 目录

---

## 项目列表

1. AI Humanizer Pro - ✅ 已完成 - AI 内容改写
2. Agent Teams 升级 - 🟡 进行中 - 多智能体编排
3. Token 成本优化 - ✅ 已完成 - 降低 90% 成本
4. OpenCode 集成 - 🟡 进行中 - AI 编码工具
5. 八卦占卜应用 - 🟡 进行中 - 决策辅助工具

---

Alpha 目录：https://xvgo1faf8xg.feishu.cn/drive/folder/O4REfrwt1lSbRUd7ha0cLyxinVb

---
*最后更新：${new Date().toLocaleString('zh-CN')}*`;
}

function getAIHumanizerMd() {
  return `# AI Humanizer Pro

项目 ID: PROJECT-20260319-004
状态：✅ 已完成
GitHub: https://github.com/lethe0108/ai-humanizer-pro
技术栈：Python + FastAPI + DeepSeek API

---

## 核心指标
- 开发周期：4 小时
- 测试通过率：100%
- 平均改写时间：<30 秒
- 单次成本：¥0.02

---

## 核心功能
1. 场景自适应引擎 - 5 种改写模式
2. DeepSeek API 集成 - deepseek-chat 模型
3. 质量评估系统 - AI 概率评分

---

## 部署说明
1. git clone 项目
2. pip install -r requirements.txt
3. 配置.env 文件
4. python server/main.py

---
*完成时间：2026-03-19*`;
}

function getAgentTeamsMd() {
  return `# Agent Teams 升级

项目 ID: PROJECT-20260319-005
状态：🟡 进行中
GitHub: 待创建
技术栈：多智能体编排框架

---

## 预期指标
- 开发效率提升：300%
- Token 成本降低：75%
- 支持智能体：50+

---

## 核心特性
1. 蜂群架构 - Queen-Worker 调度
2. 持久化记忆 - PostgreSQL + pgvector
3. 智能路由 - 多模型支持

---

## 开发计划
- 阶段 1：架构设计（1 周）
- 阶段 2：核心开发（2 周）
- 阶段 3：测试优化（1 周）
- 阶段 4：部署上线（1 周）

---
*立项时间：2026-03-19*`;
}

function getTokenMd() {
  return `# Token 成本优化

项目 ID: PROJECT-20260319-006
状态：✅ 已完成
技术栈：PostgreSQL + pgvector

---

## 优化成果
- 月成本：¥60 → ¥6（90% 降低）
- 检索速度：1-10 秒 → <100ms（10-100 倍提升）
- 语义搜索：不支持 → 支持（新功能）

---

## 已完成工作
1. 完整备份 - /root/.openclaw/workspace/backup_20260319_2330/
2. PostgreSQL 部署 - PostgreSQL 16.13 + pgvector
3. 双写记忆系统 - 文件 + 数据库同时写入

---
*完成时间：2026-03-19*`;
}

function getOpenCodeMd() {
  return `# OpenCode 集成

项目 ID: PROJECT-20260320-007
状态：🟡 进行中
GitHub: github.com/opencode-ai/opencode
版本：OpenCode v1.2.27

---

## 安装状态
- 版本：v1.2.27
- 位置：/usr/bin/opencode
- 配置：~/.config/opencode/

---

## 核心功能
1. Plan/Build 工作流
2. 多模型支持（Claude/GPT/Gemini）
3. 会话管理

---

## 下一步计划
1. 配置 Provider
2. 测试基本命令
3. 创建测试项目
4. 跑通 Plan → Build 流程

---
*安装时间：2026-03-20*`;
}

function getDivinationMd() {
  return `# 八卦占卜应用

项目 ID: PROJECT-20260321-008
状态：🟡 Phase 4 完成 (95%)
GitHub: https://github.com/lethe0108/divination
技术栈：React + Node.js + 周易算法

---

## Phase 4 完成总结
✅ 测试套件 - 37 个测试全部通过
✅ AI 深度解读 - 多模型支持
✅ 双模式解读 - 经典+AI
✅ 学习中心 - 64 卦完整数据

---

## 剩余工作
- 微信小程序适配（需独立开发）

---
*最后更新：2026-03-21*`;
}

function getArchMd() {
  return `# OpenClaw 技术架构总览

版本：2026-03-21

---

## 整体架构

OpenClaw Gateway
- Channel Layer - Feishu/Discord/Telegram/WhatsApp
- Agent Layer - OpenClaw/OpenCode/SubAgents
- Memory Layer - 文件存储 + PostgreSQL
- Tool Layer - 飞书文档/云空间/搜索

---

## 核心模块
1. Gateway - 消息路由、会话管理
2. Channels - 各平台消息收发
3. Memory - 双写架构，<100ms 检索
4. OpenCode - AI 编码工具

---

## 性能指标
- 消息响应：~1s
- 记忆检索：~150ms
- Token 成本：¥6/月

---
*最后更新：2026-03-21*`;
}

function getDeployMd() {
  return `# OpenClaw 部署配置说明

版本：2026-03-21

---

## 环境要求
- Linux Ubuntu 22.04+
- Node.js v22+
- PostgreSQL 16+
- 2GB+ 内存

---

## 安装步骤
1. nvm install 22
2. npm install -g openclaw
3. 配置~/.openclaw/openclaw.json
4. openclaw gateway start

---

## PostgreSQL 配置
1. sudo apt-get install postgresql postgresql-contrib
2. sudo apt-get install postgresql-16-pgvector
3. CREATE DATABASE memory_db
4. CREATE EXTENSION vector

---

## 监控维护
- 日志：/tmp/openclaw/openclaw-*.log
- 状态：openclaw gateway status
- Token 自动刷新：每 5 天

---
*最后更新：2026-03-21*`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
