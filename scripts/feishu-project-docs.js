#!/usr/bin/env node
/**
 * 飞书项目文档整理工具
 * 为云盘中的每个项目创建完整的文档体系
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const tokenData = JSON.parse(fs.readFileSync(path.join(process.env.HOME, '.openclaw', 'feishu', 'user_token.json'), 'utf8'));
const accessToken = tokenData.access_token;

// 项目列表
const projects = [
  { name: '解卦', folder: '解卦', desc: '易经占卜应用' },
  { name: 'AI 试穿', folder: 'AI 试穿', desc: 'AI 虚拟试穿系统' },
  { name: '雷达平台', folder: '雷达平台', desc: '数据监控平台' },
  { name: '试穿小程序', folder: '试穿小程序', desc: '微信小程序试穿' },
  { name: '数据抓取', folder: '数据抓取', desc: '网络数据爬虫' },
  { name: '环卫', folder: '环卫', desc: '环卫管理系统' },
  { name: 'Radar', folder: 'Radar', desc: '雷达监测系统' }
];

const alphaFolderToken = 'O4REfrwt1lSbRUd7ha0cLyxinVb';

console.log('='.repeat(70));
console.log('📁 飞书项目文档整理工具');
console.log('='.repeat(70));
console.log();

// 主流程
async function main() {
  console.log('步骤 1: 检查 Alpha 目录权限...');
  const hasPermission = await checkPermission(alphaFolderToken);
  
  if (!hasPermission) {
    console.log('❌ Alpha 目录无权限，终止');
    return;
  }
  
  console.log('✅ Alpha 目录权限正常\n');
  
  console.log('步骤 2: 为每个项目创建文档...\n');
  
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    console.log(`[${i + 1}/${projects.length}] 处理项目：${project.name}`);
    
    try {
      await processProject(project);
      console.log(`   ✅ 完成\n`);
    } catch (error) {
      console.log(`   ❌ 失败：${error.message}\n`);
    }
    
    // 添加延迟，避免 API 限流
    await sleep(2000);
  }
  
  console.log('='.repeat(70));
  console.log('✅ 所有项目处理完成！');
  console.log('='.repeat(70));
}

async function processProject(project) {
  // 1. 找到项目文件夹
  const folderToken = await findFolder(project.folder);
  
  if (!folderToken) {
    throw new Error(`未找到文件夹：${project.folder}`);
  }
  
  // 2. 创建 4 个文档
  const docs = [
    { title: '01-商业模式', template: getBusinessModelTemplate(project) },
    { title: '02-产品需求文档 (PRD)', template: getPRDTemplate(project) },
    { title: '03-部署说明', template: getDeploymentTemplate(project) },
    { title: '04-产品手册', template: getUserManualTemplate(project) }
  ];
  
  for (const doc of docs) {
    await createDocumentWithRetry(project.folder, folderToken, doc.title, doc.template);
  }
}

async function checkPermission(folderToken) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'open.feishu.cn',
      path: `/open-apis/drive/v1/files?parent_type=folder&parent_token=${folderToken}&limit=1`,
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + accessToken }
    };
    
    https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const result = JSON.parse(data);
        resolve(result.code === 0);
      });
    }).on('error', () => resolve(false)).end();
  });
}

async function findFolder(folderName) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'open.feishu.cn',
      path: '/open-apis/drive/v1/files?parent_type=explorer&limit=50',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + accessToken }
    };
    
    https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        const result = JSON.parse(data);
        const folder = (result.data?.files || []).find(f => f.name === folderName && f.type === 'folder');
        resolve(folder ? folder.token : null);
      });
    }).on('error', () => resolve(null)).end();
  });
}

async function createDocumentWithRetry(projectName, folderToken, title, content, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`   创建文档：${title} (尝试 ${attempt}/${maxRetries})`);
      
      const docToken = await createDocument(folderToken, `${projectName} - ${title}`);
      
      if (docToken) {
        const success = await writeDocumentContent(docToken, content);
        if (success) {
          console.log(`   ✅ ${title}`);
          return;
        }
      }
    } catch (error) {
      console.log(`   ⚠️  尝试 ${attempt} 失败：${error.message}`);
    }
    
    if (attempt < maxRetries) {
      await sleep(1000);
    }
  }
  
  throw new Error(`创建失败：${title}`);
}

async function createDocument(folderToken, title) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      parent_type: 'folder',
      parent_token: folderToken,
      title: title
    });
    
    const options = {
      hostname: 'open.feishu.cn',
      path: '/open-apis/docx/v1/documents',
      method: 'POST',
      headers: { 
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      }
    };
    
    https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (result.code === 0 && result.data) {
            resolve(result.data.token);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null)).write(data);
  });
}

async function writeDocumentContent(docToken, content) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ content: content });
    
    const options = {
      hostname: 'open.feishu.cn',
      path: `/open-apis/docx/v1/documents/${docToken}/content`,
      method: 'PUT',
      headers: { 
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      }
    };
    
    https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result.code === 0);
        } catch (e) {
          resolve(false);
        }
      });
    }).on('error', () => resolve(false)).write(data);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 文档模板
function getBusinessModelTemplate(project) {
  return `# ${project.name} - 商业模式

## 项目概述
- **项目名称**: ${project.name}
- **项目描述**: ${project.desc}
- **创建日期**: ${new Date().toISOString().split('T')[0]}

## 价值主张
### 解决的问题
（待补充）

### 目标用户
（待补充）

## 收入模式
### 主要收入来源
1. （待补充）

## 成本结构
### 主要成本
1. （待补充）

## 竞争优势
（待补充）

---
*最后更新：${new Date().toISOString()}*
`;
}

function getPRDTemplate(project) {
  return `# ${project.name} - 产品需求文档

## 文档信息
- **版本**: 1.0.0
- **创建日期**: ${new Date().toISOString().split('T')[0]}

## 产品概述
### 产品定位
（待补充）

## 功能需求
### 核心功能
（待补充）

## 技术架构
（待补充）

## 项目计划
（待补充）

---
*最后更新：${new Date().toISOString()}*
`;
}

function getDeploymentTemplate(project) {
  return `# ${project.name} - 部署说明

## 环境要求
（待补充）

## 安装步骤
（待补充）

## 配置说明
（待补充）

## 启动服务
（待补充）

---
*最后更新：${new Date().toISOString()}*
`;
}

function getUserManualTemplate(project) {
  return `# ${project.name} - 产品手册

## 快速开始
（待补充）

## 功能指南
（待补充）

## 常见问题
（待补充）

---
*最后更新：${new Date().toISOString()}*
`;
}

// 运行主流程
main().catch(console.error);
