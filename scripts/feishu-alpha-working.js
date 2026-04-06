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

console.log('📚 在 Alpha 目录创建项目文档库...\n');

const docs = [
  { title: '📚 OpenClaw 项目文档库', content: getIndexMd() },
  { title: '📄 AI Humanizer Pro', content: getAIHumanizerMd() },
  { title: '📄 Agent Teams 升级', content: getAgentTeamsMd() },
  { title: '📄 Token 成本优化', content: getTokenMd() },
  { title: '📄 OpenCode 集成', content: getOpenCodeMd() },
  { title: '📄 八卦占卜应用', content: getDivinationMd() },
  { title: '🏗️ 技术架构总览', content: getArchMd() },
  { title: '⚙️ 部署配置说明', content: getDeployMd() }
];

run();

async function run() {
  for (const doc of docs) {
    console.log('【创建】' + doc.title + '...');
    try {
      const docId = await createAndWrite(doc.title, doc.content);
      console.log('✅ https://open.feishu.cn/docx/' + docId);
      await sleep(1500);
    } catch (e) {
      console.log('❌ 失败:', e.message);
    }
  }
  
  console.log('\n🎉 完成！');
  console.log('📁 Alpha 目录：https://xvgo1faf8xg.feishu.cn/drive/folder/' + alphaFolderToken);
  
  // 验证
  console.log('\n【验证】检查 Alpha 目录...');
  await sleep(3000);
  verify();
}

async function createAndWrite(title, markdown) {
  // 1. 创建文档（使用 folder parent）
  const createRes = await client.docx.document.create({
    data: { parent_type: 'folder', parent_token: alphaFolderToken, title }
  });
  if (createRes.code !== 0) throw new Error(createRes.msg);
  
  const docId = createRes.data.document.document_id;
  
  // 2. 转换 Markdown
  const convertRes = await client.docx.document.convert({
    data: { content_type: 'markdown', content: markdown }
  });
  if (convertRes.code !== 0) throw new Error(convertRes.msg);
  
  // 3. 插入 Blocks（使用 block_id = docId）
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
    path: '/open-apis/drive/v1/files?parent_type=folder&parent_token=' + alphaFolderToken + '&limit=50',
    headers: { 'Authorization': 'Bearer ' + accessToken }
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      const result = JSON.parse(data);
      console.log('Alpha 目录内容:');
      if (result.data && result.data.files) {
        const ourDocs = result.data.files.filter(f => f.name.includes('OpenClaw') || f.name.includes('📚') || f.name.includes('📄') || f.name.includes('🏗️') || f.name.includes('⚙️'));
        ourDocs.forEach(d => {
          console.log('  ✅ ' + d.name);
          console.log('     ' + d.url);
        });
      }
    });
  });
}

function getIndexMd() {
  return `# OpenClaw 项目文档库

创建时间：${new Date().toLocaleString('zh-CN')}
位置：Alpha 目录

## 项目列表

1. AI Humanizer Pro - 已完成
2. Agent Teams 升级 - 已立项
3. Token 成本优化 - 已完成
4. OpenCode 集成 - 待配置
5. 八卦占卜应用 - 已立项

## 技术文档

- 技术架构总览
- 部署配置说明

---
OpenClaw 自动生成`;
}

function getAIHumanizerMd() { return `# AI Humanizer Pro

项目 ID: PROJECT-20260319-004
状态：已完成
GitHub: github.com/lethe0108/ai-humanizer-pro
技术：Python + FastAPI + DeepSeek API

## 项目描述

AI 内容改写为人类写作风格

## 核心功能

1. 场景自适应引擎 - 5 种改写模式
2. DeepSeek API 集成 - deepseek-chat 模型
3. 质量评估系统 - AI 概率评分

## 项目成果

- 开发周期：4 小时
- 测试通过率：100%
- 平均改写时间：<30 秒

---
OpenClaw 自动生成`; }

function getAgentTeamsMd() { return `# Agent Teams 升级

项目 ID: PROJECT-20260319-005
状态：已立项
GitHub: 待创建
技术：多智能体编排框架

## 项目描述

基于 Ruflo 架构的多智能体系统

## 核心特性

1. 蜂群架构 - Queen-Worker 调度
2. 持久化记忆 - PostgreSQL + pgvector
3. 智能路由 - 成本降低 75%

## 开发计划

阶段 1-4：架构设计/开发/测试/上线

---
OpenClaw 自动生成`; }

function getTokenMd() { return `# Token 成本优化

项目 ID: PROJECT-20260319-006
状态：已完成
技术：PostgreSQL + pgvector

## 项目描述

降低 90% Token 消耗

## 优化成果

优化前：月成本¥60，检索 1-10 秒
优化后：月成本¥6，检索<100ms
节省：90%

## 已完成工作

1. 完整备份
2. PostgreSQL 部署
3. 双写记忆系统

---
OpenClaw 自动生成`; }

function getOpenCodeMd() { return `# OpenCode 集成

项目 ID: PROJECT-20260320-007
状态：待配置
GitHub: github.com/opencode-ai/opencode
技术：OpenCode v1.2.27

## 项目描述

AI 编码工具集成

## 安装状态

- 版本：v1.2.27
- 位置：/usr/bin/opencode

## 核心功能

1. Plan/Build 工作流
2. 多模型支持
3. 会话管理

---
OpenClaw 自动生成`; }

function getDivinationMd() { return `# 八卦占卜应用

项目 ID: PROJECT-20260321-008
状态：已立项
GitHub: github.com/lethe0108/divination

## 项目描述

个人决策辅助与心灵指南工具

## 核心理念

"观象玩辞，反求诸己"

## 核心功能

1. 起卦模块
2. 卦象展示
3. 解读模块
4. 历史记录
5. 学习中心

---
OpenClaw 自动生成`; }

function getArchMd() { return `# OpenClaw 技术架构总览

## 系统概述

OpenClaw 是智能助手框架

## 整体架构

OpenClaw Gateway
- Channel Layer - Feishu/Discord/Telegram/WhatsApp
- Agent Layer - OpenClaw/OpenCode/SubAgents
- Memory Layer - 文件存储 + PostgreSQL
- Tool Layer - 飞书文档/云空间/搜索

## 核心模块

1. Gateway - 消息路由
2. Channels - 平台适配
3. Memory - 双写架构
4. OpenCode - AI 编码

## 性能指标

消息响应：~1s
记忆检索：~150ms
Token 成本：¥6/月

---
OpenClaw 自动生成`; }

function getDeployMd() { return `# OpenClaw 部署配置说明

## 环境要求

- Linux Ubuntu 22.04+
- Node.js v22+
- PostgreSQL 16+

## 安装步骤

1. 安装 Node.js
2. npm install -g openclaw
3. 配置~/.openclaw/openclaw.json
4. openclaw gateway start

## PostgreSQL 配置

1. 安装 postgresql 和 pgvector
2. CREATE DATABASE memory_db
3. CREATE EXTENSION vector

## 安全配置

- 文件权限 600
- Token 自动刷新
- 防火墙限制

---
OpenClaw 自动生成`; }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
