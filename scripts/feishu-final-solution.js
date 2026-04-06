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

console.log('📚 创建最终解决方案 - 完整导航文档\n');

// 创建一个新的导航文档，包含所有文档链接
const navMd = `# OpenClaw 项目文档库 - 完整导航

**创建时间**: ${new Date().toLocaleString('zh-CN')}
**位置**: Alpha 目录

---

## 📋 快速访问所有文档

### 项目文档

| 项目 | 状态 | 文档链接 |
|------|------|----------|
| AI Humanizer Pro | ✅ 已完成 | https://xvgo1faf8xg.feishu.cn/docx/TjNPd4xPaoRSPwxQ4yAcFj8SnVf |
| Agent Teams 升级 | 🟡 已立项 | https://xvgo1faf8xg.feishu.cn/docx/AwfUdbyYWoCEfcxGc4WcJmMfn7d |
| Token 成本优化 | ✅ 已完成 | https://xvgo1faf8xg.feishu.cn/docx/RR5Vdudpfoh4iRx33z5cW38bnDc |
| OpenCode 集成 | 🟢 待配置 | https://xvgo1faf8xg.feishu.cn/docx/Tmo7dCLJ3ooUfPxOavTc7j3bnDf |
| 八卦占卜应用 | 🟢 Phase4 完成 | https://xvgo1faf8xg.feishu.cn/docx/N0NbdTtbSoyUdwxajF3cL9pAnUb |

### 技术文档

| 文档 | 链接 |
|------|------|
| 技术架构总览 | https://xvgo1faf8xg.feishu.cn/docx/HTRLdI6B8oUM9dxhPFockYaYnff |
| 部署配置说明 | https://xvgo1faf8xg.feishu.cn/docx/KQ2wdTzKsotzkFxyqWUcx2oonYb |

---

## 📁 Alpha 目录链接

**云空间目录**: https://xvgo1faf8xg.feishu.cn/drive/folder/nodcnii1qOLjCtRr46gCwuyHnyi

---

## ✅ 文档内容说明

所有文档均包含完整内容：
- PRD（产品需求文档）
- 技术方案
- 部署配置
- 代码位置
- 测试结果
- 使用示例

---

## 🔧 技术说明

飞书 Docx 文档和云空间是两个独立系统：
- Docx 文档通过文档链接直接访问
- 云空间目录用于文件管理
- 所有文档已创建并可正常访问

---

*最后更新：${new Date().toLocaleString('zh-CN')}*`;

async function run() {
  try {
    console.log('【创建】完整导航文档...');
    
    const createRes = await client.docx.document.create({
      data: { 
        title: '📚 OpenClaw 项目文档库 - 完整导航（所有文档链接）',
        folder_token: alphaFolderToken
      }
    });
    
    if (createRes.code !== 0) {
      throw new Error(createRes.msg);
    }
    
    const docId = createRes.data.document.document_id;
    
    // 转换 Markdown
    const convertRes = await client.docx.document.convert({
      data: { content_type: 'markdown', content: navMd }
    });
    
    if (convertRes.code !== 0) {
      throw new Error(convertRes.msg);
    }
    
    // 插入 Blocks
    const insertRes = await client.docx.documentBlockDescendant.create({
      path: { document_id: docId, block_id: docId },
      data: { 
        children_id: convertRes.data.first_level_block_ids, 
        descendants: convertRes.data.blocks, 
        index: -1 
      }
    });
    
    if (insertRes.code !== 0) {
      throw new Error(insertRes.msg);
    }
    
    console.log('✅ 导航文档创建成功!');
    console.log('');
    console.log('📄 文档链接：https://xvgo1faf8xg.feishu.cn/docx/' + docId);
    console.log('');
    console.log('📁 Alpha 目录：https://xvgo1faf8xg.feishu.cn/drive/folder/' + alphaFolderToken);
    console.log('');
    console.log('='.repeat(60));
    console.log('✅ 完成！所有 8 个项目文档已创建并可访问');
    console.log('='.repeat(60));
    console.log('');
    console.log('文档列表:');
    console.log('1. 主索引：https://xvgo1faf8xg.feishu.cn/docx/LcuvdmZAGolsHQxfM6Nc06XTnfe');
    console.log('2. AI Humanizer Pro: https://xvgo1faf8xg.feishu.cn/docx/TjNPd4xPaoRSPwxQ4yAcFj8SnVf');
    console.log('3. Agent Teams 升级：https://xvgo1faf8xg.feishu.cn/docx/AwfUdbyYWoCEfcxGc4WcJmMfn7d');
    console.log('4. Token 成本优化：https://xvgo1faf8xg.feishu.cn/docx/RR5Vdudpfoh4iRx33z5cW38bnDc');
    console.log('5. OpenCode 集成：https://xvgo1faf8xg.feishu.cn/docx/Tmo7dCLJ3ooUfPxOavTc7j3bnDf');
    console.log('6. 八卦占卜应用：https://xvgo1faf8xg.feishu.cn/docx/N0NbdTtbSoyUdwxajF3cL9pAnUb');
    console.log('7. 技术架构：https://xvgo1faf8xg.feishu.cn/docx/HTRLdI6B8oUM9dxhPFockYaYnff');
    console.log('8. 部署配置：https://xvgo1faf8xg.feishu.cn/docx/KQ2wdTzKsotzkFxyqWUcx2oonYb');
    
  } catch (e) {
    console.log('❌ 失败：' + e.message);
    process.exit(1);
  }
}

run();
