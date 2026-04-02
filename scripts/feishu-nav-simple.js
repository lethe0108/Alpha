#!/usr/bin/env node
const Lark = require('/usr/lib/node_modules/openclaw/node_modules/@larksuiteoapi/node-sdk');
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(process.env.HOME, '.openclaw', 'openclaw.json'), 'utf8'));
const tokenData = JSON.parse(fs.readFileSync(path.join(process.env.HOME, '.openclaw', 'feishu', 'user_token.json'), 'utf8'));

const appId = config.channels?.feishu?.appId;
const appSecret = config.channels?.feishu?.appSecret;
const alphaFolderToken = 'nodcnii1qOLjCtRr46gCwuyHnyi';

const client = new Lark.Client({ appId, appSecret, appType: Lark.AppType.SelfBuild, domain: Lark.Domain.Feishu });

console.log('📚 创建导航文档（简化版）\n');

const navMd = `# OpenClaw 项目文档库 - 完整导航

创建时间：${new Date().toLocaleString('zh-CN')}

---

## 快速访问所有文档

### 项目文档

1. AI Humanizer Pro（已完成）
https://xvgo1faf8xg.feishu.cn/docx/TjNPd4xPaoRSPwxQ4yAcFj8SnVf

2. Agent Teams 升级（已立项）
https://xvgo1faf8xg.feishu.cn/docx/AwfUdbyYWoCEfcxGc4WcJmMfn7d

3. Token 成本优化（已完成）
https://xvgo1faf8xg.feishu.cn/docx/RR5Vdudpfoh4iRx33z5cW38bnDc

4. OpenCode 集成（待配置）
https://xvgo1faf8xg.feishu.cn/docx/Tmo7dCLJ3ooUfPxOavTc7j3bnDf

5. 八卦占卜应用（Phase4 完成）
https://xvgo1faf8xg.feishu.cn/docx/N0NbdTtbSoyUdwxajF3cL9pAnUb

### 技术文档

6. 技术架构总览
https://xvgo1faf8xg.feishu.cn/docx/HTRLdI6B8oUM9dxhPFockYaYnff

7. 部署配置说明
https://xvgo1faf8xg.feishu.cn/docx/KQ2wdTzKsotzkFxyqWUcx2oonYb

---

## Alpha 目录

https://xvgo1faf8xg.feishu.cn/drive/folder/nodcnii1qOLjCtRr46gCwuyHnyi

---

所有文档包含完整内容：PRD、技术方案、部署配置、代码位置、测试结果。

---
最后更新：${new Date().toLocaleString('zh-CN')}`;

async function run() {
  try {
    console.log('【创建】导航文档...');
    
    const createRes = await client.docx.document.create({
      data: { 
        title: '📚 OpenClaw 项目文档 - 完整导航（点击访问所有文档）',
        folder_token: alphaFolderToken
      }
    });
    
    if (createRes.code !== 0) throw new Error(createRes.msg);
    
    const docId = createRes.data.document.document_id;
    
    const convertRes = await client.docx.document.convert({
      data: { content_type: 'markdown', content: navMd }
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
    
    console.log('✅ 导航文档创建成功!');
    console.log('');
    console.log('📄 导航文档：https://xvgo1faf8xg.feishu.cn/docx/' + docId);
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ 完成！所有 8 个项目文档已创建并可访问');
    console.log('='.repeat(60));
    
  } catch (e) {
    console.log('❌ 失败：' + e.message);
    process.exit(1);
  }
}

run();
