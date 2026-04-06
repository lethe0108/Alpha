#!/usr/bin/env node
/**
 * 飞书 Blocks API 文档创建工具
 * 使用 Blocks API 创建结构化的飞书文档
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 优化 HTTPS 代理配置，禁用不必要的代理
https.globalAgent.keepAlive = true;
https.globalAgent.maxSockets = 10;

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
console.log('🧱 飞书 Blocks API 文档创建工具');
console.log('='.repeat(70));
console.log();

async function main() {
  console.log('开始为', projects.length, '个项目创建文档...\n');
  
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    console.log(`[${i + 1}/${projects.length}] 处理项目：${project.name}`);
    
    try {
      // 1. 找到项目文件夹
      const folderToken = await findFolder(project.folder);
      
      if (!folderToken) {
        console.log(`   ⚠️  未找到文件夹，跳过`);
        continue;
      }
      
      console.log(`   ✅ 文件夹：${folderToken}`);
      
      // 2. 创建 4 个文档
      const docs = [
        { title: '01-商业模式', blocks: getBusinessModelBlocks(project) },
        { title: '02-产品需求文档 (PRD)', blocks: getPRDBlocks(project) },
        { title: '03-部署说明', blocks: getDeploymentBlocks(project) },
        { title: '04-产品手册', blocks: getUserManualBlocks(project) }
      ];
      
      for (const doc of docs) {
        await createDocumentWithBlocks(folderToken, `${project.name} - ${doc.title}`, doc.blocks);
        await sleep(1000); // 避免 API 限流
      }
      
      console.log(`   ✅ 完成\n`);
      
      // 项目之间等待 5 秒
      await sleep(5000);
      
    } catch (error) {
      console.log(`   ❌ 失败：${error.message}\n`);
      
      // 失败后等待 10 秒
      await sleep(10000);
    }
  }
  
  console.log('='.repeat(70));
  console.log('✅ 所有项目处理完成！');
  console.log('='.repeat(70));
}

async function findFolder(folderName) {
  return new Promise((resolve, reject) => {
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
        try {
          const result = JSON.parse(data);
          const folder = (result.data?.files || []).find(f => f.name === folderName && f.type === 'folder');
          resolve(folder ? folder.token : null);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject).end();
  });
}

async function createDocumentWithBlocks(folderToken, title, blocks, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`   📄 创建文档：${title} (尝试 ${attempt}/${maxRetries})`);
      
      // 1. 创建空白文档
      const docToken = await createDocument(folderToken, title);
      
      if (!docToken) {
        throw new Error('文档创建失败');
      }
      
      // 等待 500ms 让文档准备好
      await sleep(500);
      
      // 2. 添加 Blocks
      const success = await addBlocks(docToken, blocks);
      
      if (success) {
        console.log(`      ✅ 内容已添加`);
        return;
      } else {
        console.log(`      ⚠️  内容添加失败`);
        if (attempt < maxRetries) {
          console.log(`      等待 2 秒后重试...`);
          await sleep(2000);
        }
      }
    } catch (error) {
      console.log(`      ❌ 错误：${error.message}`);
      if (attempt < maxRetries) {
        console.log(`      等待 2 秒后重试...`);
        await sleep(2000);
      } else {
        throw error;
      }
    }
  }
}

async function createDocument(folderToken, title) {
  return new Promise((resolve, reject) => {
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
            console.log(`      API 响应：${result.msg}`);
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject).write(data);
  });
}

async function addBlocks(docToken, blocks) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      parent_id: docToken,
      blocks: blocks
    });
    
    const options = {
      hostname: 'open.feishu.cn',
      path: '/open-apis/docx/v1/documents/' + docToken + '/blocks',
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

// Blocks 模板
function getBusinessModelBlocks(project) {
  return [
    {
      block_type: 'heading1',
      heading1: {
        elements: [{ text_run: { content: `${project.name} - 商业模式`, style: { bold: true } } }]
      }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '' } }] }
    },
    {
      block_type: 'heading2',
      heading2: { elements: [{ text_run: { content: '项目概述' } }] }
    },
    {
      block_type: 'bullet',
      bullet: { elements: [{ text_run: { content: `项目名称：${project.name}` } }] }
    },
    {
      block_type: 'bullet',
      bullet: { elements: [{ text_run: { content: `项目描述：${project.desc}` } }] }
    },
    {
      block_type: 'bullet',
      bullet: { elements: [{ text_run: { content: `创建日期：${new Date().toISOString().split('T')[0]}` } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '' } }] }
    },
    {
      block_type: 'heading2',
      heading2: { elements: [{ text_run: { content: '价值主张' } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '（待补充：解决的问题、目标用户）' } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '' } }] }
    },
    {
      block_type: 'heading2',
      heading2: { elements: [{ text_run: { content: '收入模式' } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '（待补充：主要收入来源、定价策略）' } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '' } }] }
    },
    {
      block_type: 'heading2',
      heading2: { elements: [{ text_run: { content: '竞争优势' } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '（待补充）' } }] }
    }
  ];
}

function getPRDBlocks(project) {
  return [
    {
      block_type: 'heading1',
      heading1: { elements: [{ text_run: { content: `${project.name} - 产品需求文档`, style: { bold: true } } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '' } }] }
    },
    {
      block_type: 'heading2',
      heading2: { elements: [{ text_run: { content: '文档信息' } }] }
    },
    {
      block_type: 'bullet',
      bullet: { elements: [{ text_run: { content: '版本：1.0.0' } }] }
    },
    {
      block_type: 'bullet',
      bullet: { elements: [{ text_run: { content: `创建日期：${new Date().toISOString().split('T')[0]}` } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '' } }] }
    },
    {
      block_type: 'heading2',
      heading2: { elements: [{ text_run: { content: '产品概述' } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '（待补充：产品定位、目标用户、使用场景）' } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '' } }] }
    },
    {
      block_type: 'heading2',
      heading2: { elements: [{ text_run: { content: '功能需求' } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '（待补充：核心功能、辅助功能）' } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '' } }] }
    },
    {
      block_type: 'heading2',
      heading2: { elements: [{ text_run: { content: '技术架构' } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '（待补充：前端、后端、数据库）' } }] }
    }
  ];
}

function getDeploymentBlocks(project) {
  return [
    {
      block_type: 'heading1',
      heading1: { elements: [{ text_run: { content: `${project.name} - 部署说明`, style: { bold: true } } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '' } }] }
    },
    {
      block_type: 'heading2',
      heading2: { elements: [{ text_run: { content: '环境要求' } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '（待补充：系统要求、依赖服务）' } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '' } }] }
    },
    {
      block_type: 'heading2',
      heading2: { elements: [{ text_run: { content: '安装步骤' } }] }
    },
    {
      block_type: 'ordered',
      ordered: { elements: [{ text_run: { content: '克隆代码' } }] }
    },
    {
      block_type: 'ordered',
      ordered: { elements: [{ text_run: { content: '安装依赖' } }] }
    },
    {
      block_type: 'ordered',
      ordered: { elements: [{ text_run: { content: '配置环境变量' } }] }
    },
    {
      block_type: 'ordered',
      ordered: { elements: [{ text_run: { content: '启动服务' } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '' } }] }
    },
    {
      block_type: 'heading2',
      heading2: { elements: [{ text_run: { content: '常见问题' } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '（待补充）' } }] }
    }
  ];
}

function getUserManualBlocks(project) {
  return [
    {
      block_type: 'heading1',
      heading1: { elements: [{ text_run: { content: `${project.name} - 产品手册`, style: { bold: true } } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '' } }] }
    },
    {
      block_type: 'heading2',
      heading2: { elements: [{ text_run: { content: '快速开始' } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '（待补充：注册、登录、基础使用）' } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '' } }] }
    },
    {
      block_type: 'heading2',
      heading2: { elements: [{ text_run: { content: '功能指南' } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '（待补充：核心功能使用说明）' } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '' } }] }
    },
    {
      block_type: 'heading2',
      heading2: { elements: [{ text_run: { content: '常见问题' } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '（待补充：Q&A）' } }] }
    },
    {
      block_type: 'text',
      text: { elements: [{ text_run: { content: '' } }] }
    },
    {
      block_type: 'heading2',
      heading2: { elements: [{ text_run: { content: '更新日志' } }] }
    },
    {
      block_type: 'bullet',
      bullet: { elements: [{ text_run: { content: `v1.0.0 (${new Date().toISOString().split('T')[0]}) - 初始版本` } }] }
    }
  ];
}

// 运行主流程
main().catch(console.error);
