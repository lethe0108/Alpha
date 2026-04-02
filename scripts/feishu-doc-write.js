#!/usr/bin/env node
/**
 * 飞书文档写入工具 - 完整版本
 * 使用飞书 SDK 正确写入文档内容
 * 
 * 使用方法：
 *   node /root/.openclaw/scripts/feishu-doc-write.js "文档标题" "Markdown 内容"
 */

const Lark = require('/usr/lib/node_modules/openclaw/node_modules/@larksuiteoapi/node-sdk');
const fs = require('fs');
const path = require('path');

// 读取配置
const configPath = path.join(process.env.HOME, '.openclaw', 'openclaw.json');
const tokenPath = path.join(process.env.HOME, '.openclaw', 'feishu', 'user_token.json');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

const appId = config.channels?.feishu?.appId;
const appSecret = config.channels?.feishu?.appSecret;
const accessToken = tokenData.access_token;

// 参数
const title = process.argv[2] || 'OpenClaw 测试文档 - ' + new Date().toLocaleString('zh-CN');
const markdown = process.argv[3] || `# 🎉 OpenClaw 测试文档

这是自动写入的测试内容。

## 测试状态
- ✅ Token 刷新成功
- ✅ 文档创建成功
- ✅ 内容写入成功
- ✅ 读取验证成功

**创建时间**: ${new Date().toLocaleString('zh-CN')}

---
*此文档由 OpenClaw 自动生成*`;

console.log('='.repeat(60));
console.log('📝 飞书文档写入工具');
console.log('='.repeat(60));
console.log('');
console.log('配置信息:');
console.log('  App ID:', appId);
console.log('  Token:', accessToken.substring(0, 30) + '...');
console.log('  文档标题:', title);
console.log('');

// 创建客户端
const client = new Lark.Client({
  appId,
  appSecret,
  appType: Lark.AppType.SelfBuild,
  domain: Lark.Domain.Feishu
});

// 主流程
run();

async function run() {
  try {
    // 步骤 1: 创建文档
    console.log('【步骤 1】创建文档...');
    const createRes = await client.docx.document.create({
      data: {
        parent_type: 'explorer',
        title: title
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
    
    // 步骤 2: Markdown 转换为 Blocks
    console.log('【步骤 2】Markdown 转换为 Blocks...');
    const convertRes = await client.docx.document.convert({
      data: {
        content_type: 'markdown',
        content: markdown
      }
    });
    
    if (convertRes.code !== 0) {
      throw new Error('Markdown 转换失败：' + convertRes.msg);
    }
    
    console.log('✅ 转换成功');
    console.log('   Blocks 数量:', convertRes.data.blocks?.length);
    console.log('   First Level IDs:', convertRes.data.first_level_block_ids?.length);
    console.log('');
    
    // 步骤 3: 插入 Blocks
    console.log('【步骤 3】插入 Blocks 到文档...');
    const insertRes = await client.docx.documentBlockDescendant.create({
      path: {
        document_id: docId,
        block_id: docId
      },
      data: {
        children_id: convertRes.data.first_level_block_ids,
        descendants: convertRes.data.blocks,
        index: -1
      }
    });
    
    if (insertRes.code !== 0) {
      throw new Error('Blocks 插入失败：' + insertRes.msg);
    }
    
    console.log('✅ Blocks 插入成功');
    console.log('   插入的 blocks 数量:', insertRes.data?.children?.length);
    console.log('');
    
    // 步骤 4: 验证读取
    console.log('【步骤 4】验证读取文档内容...');
    const https = require('https');
    
    const readContent = await new Promise((resolve, reject) => {
      https.get({
        hostname: 'open.feishu.cn',
        path: '/open-apis/docx/v1/documents/' + docId + '/raw_content',
        headers: {
          'Authorization': 'Bearer ' + accessToken
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.code === 0) {
              resolve(result.data.content);
            } else {
              reject(new Error('读取失败：' + result.msg));
            }
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
    
    console.log('✅ 读取成功');
    console.log('');
    console.log('📄 文档内容预览:');
    console.log('-'.repeat(60));
    console.log(readContent.substring(0, 500));
    console.log('...');
    console.log('-'.repeat(60));
    console.log('');
    
    // 完成
    console.log('='.repeat(60));
    console.log('🎉 飞书文档写入完成！');
    console.log('='.repeat(60));
    console.log('');
    console.log('文档信息:');
    console.log('  📄 标题:', title);
    console.log('  🔗 链接: https://open.feishu.cn/docx/' + docId);
    console.log('  📊 Blocks:', insertRes.data?.children?.length);
    console.log('  ⏰ 时间:', new Date().toLocaleString('zh-CN'));
    console.log('');
    console.log('验证结果:');
    console.log('  ✅ 文档创建成功');
    console.log('  ✅ 内容写入成功');
    console.log('  ✅ 读取验证成功');
    console.log('');
    
  } catch (error) {
    console.log('');
    console.log('❌ 错误:', error.message);
    console.log('');
    process.exit(1);
  }
}
