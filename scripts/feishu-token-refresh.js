#!/usr/bin/env node
/**
 * 飞书 Token 自动刷新脚本
 * 每 5 天执行一次，确保 refresh_token 始终有效
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('='.repeat(50));
console.log('🔄 飞书 Token 自动刷新');
console.log('执行时间:', new Date().toISOString());
console.log('='.repeat(50));

try {
  // 读取配置
  const configPath = path.join(process.env.HOME, '.openclaw', 'openclaw.json');
  const tokenPath = path.join(process.env.HOME, '.openclaw', 'feishu', 'user_token.json');
  
  if (!fs.existsSync(configPath)) {
    throw new Error('配置文件不存在：' + configPath);
  }
  
  if (!fs.existsSync(tokenPath)) {
    throw new Error('Token 文件不存在：' + tokenPath);
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  
  const appId = config.channels?.feishu?.appId;
  const appSecret = config.channels?.feishu?.appSecret;
  const refreshToken = tokenData.refresh_token;
  
  if (!appId || !appSecret) {
    throw new Error('飞书 App ID 或 App Secret 未配置');
  }
  
  if (!refreshToken) {
    throw new Error('refresh_token 不存在，需要重新授权');
  }
  
  console.log('✅ 配置加载成功');
  console.log('   App ID:', appId);
  console.log('   当前 refresh_token 创建时间:', tokenData.created_at ? new Date(tokenData.created_at * 1000).toISOString() : '未知');
  
  // 刷新 Token
  refreshAccessToken(refreshToken, appId, appSecret);
  
} catch (error) {
  console.error('❌ 错误:', error.message);
  console.error('解决方案：请在飞书中重新授权 OpenClaw 机器人');
  process.exit(1);
}

function refreshAccessToken(refreshToken, appId, appSecret) {
  console.log('\\n📡 正在请求刷新 Token...');
  
  const postData = JSON.stringify({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    app_id: appId,
    app_secret: appSecret
  });
  
  const options = {
    hostname: 'open.feishu.cn',
    path: '/open-apis/authen/v1/refresh_access_token',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        handleRefreshResult(result, refreshToken);
      } catch (e) {
        console.error('❌ 响应解析失败:', e.message);
        console.error('原始响应:', data.substring(0, 200));
        process.exit(1);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error('❌ 请求失败:', e.message);
    process.exit(1);
  });
  
  req.write(postData);
  req.end();
}

function handleRefreshResult(result, oldRefreshToken) {
  console.log('\\n📊 刷新结果:', result.code === 0 ? '✅ 成功' : '❌ 失败');
  
  if (result.code !== 0) {
    console.error('错误信息:', result.msg);
    console.error('错误码:', result.code);
    
    if (result.code === 20026) {
      console.error('\\n⚠️  refresh_token 已过期，需要重新授权');
      console.error('解决方案:');
      console.error('1. 在飞书中打开 OpenClaw 机器人');
      console.error('2. 发送"重新连接"或"授权"');
      console.error('3. 扫码确认授权');
      console.error('4. 勾选"保持登录状态"');
    }
    
    process.exit(1);
    return;
  }
  
  // 保存新 Token
  const newTokenData = {
    access_token: result.data.access_token,
    refresh_token: result.data.refresh_token || oldRefreshToken,
    expires_in: result.data.expires_in,
    scope: result.data.scope,
    token_type: result.data.token_type,
    created_at: Math.floor(Date.now() / 1000)
  };
  
  const tokenPath = path.join(process.env.HOME, '.openclaw', 'feishu', 'user_token.json');
  fs.writeFileSync(tokenPath, JSON.stringify(newTokenData, null, 2), { mode: 0o600 });
  
  console.log('\\n✅ Token 已刷新并保存');
  console.log('   文件路径:', tokenPath);
  console.log('   新 access_token 有效期:', newTokenData.expires_in, '秒 (2 小时)');
  console.log('   新 refresh_token 有效期：7 天');
  console.log('   下次刷新时间：5 天后');
  
  // 验证新 Token
  console.log('\\n🔍 验证新 Token...');
  verifyToken(newTokenData.access_token);
}

function verifyToken(accessToken) {
  const options = {
    hostname: 'open.feishu.cn',
    path: '/open-apis/drive/v1/files?parent_type=explorer&limit=1',
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + accessToken }
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        if (result.code === 0) {
          console.log('✅ Token 验证成功 - 云空间访问正常');
          console.log('\\n' + '='.repeat(50));
          console.log('🎉 刷新完成！下次自动刷新时间：5 天后');
          console.log('='.repeat(50));
        } else {
          console.log('⚠️  Token 验证失败:', result.msg);
        }
      } catch (e) {
        console.log('⚠️  验证响应解析失败:', e.message);
      }
    });
  });
  
  req.on('error', (e) => {
    console.log('⚠️  Token 验证请求失败:', e.message);
  });
  
  req.end();
}
