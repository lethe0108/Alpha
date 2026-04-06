#!/usr/bin/env node
/**
 * 测试在 Alpha 目录下创建文档
 */

const Lark = require('/usr/lib/node_modules/openclaw/node_modules/@larksuiteoapi/node-sdk');
const fs = require('fs');
const path = require('path');

const configPath = path.join(process.env.HOME, '.openclaw', 'openclaw.json');
const tokenPath = path.join(process.env.HOME, '.openclaw', 'feishu', 'user_token.json');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

const appId = config.channels?.feishu?.appId;
const appSecret = config.channels?.feishu?.appSecret;

// Alpha 文件夹 Token（从之前的日志中获取）
const alphaFolderToken = 'O4REfrwt1lSbRUd7ha0cLyxinVb';

const client = new Lark.Client({
  appId,
  appSecret,
  appType: Lark.AppType.SelfBuild,
  domain: Lark.Domain.Feishu
});

console.log('🧪 测试在 Alpha 目录下创建文档...\n');
console.log('Alpha 文件夹 Token:', alphaFolderToken);
console.log('');

run();

async function run() {
  try {
    // 步骤 1: 创建文档到 Alpha 目录
    console.log('【步骤 1】在 Alpha 目录下创建测试文档...');
    const createRes = await client.docx.document.create({
      data: {
        parent_type: 'folder',
        parent_token: alphaFolderToken,
        title: '🧪 Alpha 目录测试 - ' + new Date().toLocaleString('zh-CN')
      }
    });
    
    if (createRes.code !== 0) {
      throw new Error('文档创建失败：' + createRes.msg);
    }
    
    const docId = createRes.data.document.document_id;
    console.log('✅ 文档创建成功');
    console.log('   文档 ID:', docId);
    console.log('   文档链接: https://open.feishu.cn/docx/' + docId);
    console.log('');
    
    // 步骤 2: 写入内容
    console.log('【步骤 2】写入测试内容...');
    const markdown = `# 🧪 Alpha 目录测试文档

这是测试在 Alpha 目录下创建文档。

## 测试信息
- **创建时间**: ${new Date().toLocaleString('zh-CN')}
- **父目录**: Alpha (O4REfrwt1lSbRUd7ha0cLyxinVb)
- **测试状态**: ✅ 成功

## 验证内容
- ✅ 可以在 Alpha 目录下创建文档
- ✅ 文档写入正常
- ✅ 权限配置正确

---
*此文档由 OpenClaw 自动生成*`;

    const convertRes = await client.docx.document.convert({
      data: { content_type: 'markdown', content: markdown }
    });
    
    await client.docx.documentBlockDescendant.create({
      path: { document_id: docId, block_id: docId },
      data: {
        children_id: convertRes.data.first_level_block_ids,
        descendants: convertRes.data.blocks,
        index: -1
      }
    });
    
    console.log('✅ 内容写入成功');
    console.log('');
    
    // 步骤 3: 验证读取
    console.log('【步骤 3】验证读取...');
    const https = require('https');
    
    await new Promise((resolve, reject) => {
      https.get({
        hostname: 'open.feishu.cn',
        path: '/open-apis/docx/v1/documents/' + docId + '/raw_content',
        headers: { 'Authorization': 'Bearer ' + tokenData.access_token }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          const result = JSON.parse(data);
          if (result.code === 0) {
            console.log('✅ 读取验证成功');
            console.log('   内容长度:', result.data.content?.length, '字符');
            resolve();
          } else {
            reject(new Error(result.msg));
          }
        });
      }).on('error', reject);
    });
    
    console.log('');
    console.log('='.repeat(60));
    console.log('🎉 Alpha 目录测试完成！');
    console.log('='.repeat(60));
    console.log('');
    console.log('✅ 可以在 Alpha 目录下创建文档');
    console.log('✅ 可以写入和读取内容');
    console.log('✅ 权限配置正确');
    console.log('');
    console.log('📄 测试文档链接:');
    console.log('   https://open.feishu.cn/docx/' + docId);
    console.log('');
    
  } catch (error) {
    console.log('');
    console.log('❌ 错误:', error.message);
    process.exit(1);
  }
}
