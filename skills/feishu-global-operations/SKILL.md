---
name: feishu-global-operations
description: |
  飞书全局操作技能（最高优先级）。包含 Token 内存存储机制、云盘操作、文档创建等核心功能。

  **当以下情况时使用此 Skill**：
  (1) 需要操作飞书云盘（创建文件夹/上传下载文件）
  (2) 需要创建/编辑/读取飞书云文档
  (3) 需要管理飞书日历、任务、多维表格
  (4) 用户提到"飞书"、"云盘"、"云文档"、"飞书文档"

  **核心原则**: Token 内存存储，用户隔离，Gateway 重启后需重新授权
---

# 🏆 飞书全局操作技能（最高优先级）

> **作用域**: 全局 (所有 Session 和 Agent)  
> **优先级**: 🔴 **最高优先级**  
> **状态**: ✅ 激活  
> **核心机制**: Token 内存存储

---

## 🔐 Token 内存存储机制（核心）

### 存储方式

```javascript
// 位置：/root/.openclaw/extensions/openclaw-lark/src/core/token-store.js

const tokens = new Map();
// Key: "${appId}:${userOpenId}"
// Value: StoredUAToken object
```

### Token 对象结构

```javascript
{
  userOpenId: "ou_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  appId: "cli_a92692f305789ceb",
  accessToken: "u-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  refreshToken: "ur-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  expiresAt: 1774267200000,           // 毫秒时间戳
  refreshExpiresAt: 1774353600000,     // 毫秒时间戳
  scope: "drive:file,docx:doc:write,...",
  grantedAt: 1774180800000             // 授权时间
}
```

### 核心特性

| 特性 | 说明 |
|------|------|
| **纯内存存储** | Token 永不写入磁盘，重启即消失 |
| **用户隔离** | 每个 open_id 独立存储，不会混淆 |
| **自动过期** | 过期后自动删除，需要重新授权 |
| **自动刷新** | 提前 5 分钟自动刷新 token |

### 生命周期

```
1. 用户授权 → Token 保存到 Map
   ↓
2. 每次 API 调用 → 检查过期时间
   ↓
3. 即将过期（<5 分钟）→ 自动刷新
   ↓
4. Gateway 重启 → 所有 Token 丢失
   ↓
5. 用户重新授权 → 新 Token 保存到 Map
```

---

## 📁 飞书云盘操作

### 创建文件夹

```javascript
const Lark = require('/usr/lib/node_modules/openclaw/node_modules/@larksuiteoapi/node-sdk');

const client = new Lark.Client({ 
  appId: 'cli_a92692f305789ceb',
  appSecret: 'VJhazrJkyuxvBXTjZ2vjrhkAjduCGYm1',
  appType: Lark.AppType.SelfBuild,
  domain: Lark.Domain.Feishu,
  accessToken: userAccessToken  // 从内存读取
});

await client.drive.file.createFolder({
  data: {
    name: '文件夹名称',
    parent_type: 'folder',
    parent_id: 'root'  // 或 folder_token
  }
});
```

### 使用工具

```json
{
  "action": "create_folder",
  "folder_token": "root",  // 根目录或父文件夹 token
  "name": "📁 文件夹名称"
}
```

### 文件操作

| 操作 | 工具 | 参数 |
|------|------|------|
| **列出文件** | `feishu_drive_file` | action: list, folder_token: root |
| **创建文件夹** | `feishu_drive_file` | action: create_folder |
| **上传文件** | `feishu_drive_file` | action: upload, file_path: xxx |
| **下载文件** | `feishu_drive_file` | action: download, file_token: xxx |
| **移动文件** | `feishu_drive_file` | action: move, file_token: xxx |
| **删除文件** | `feishu_drive_file` | action: delete, file_token: xxx |

---

## 📝 飞书云文档操作

### 创建文档

```json
{
  "title": "文档标题",
  "folder_token": "文件夹 token",
  "markdown": "# 文档内容\n\n正文..."
}
```

### 更新文档

```json
{
  "mode": "append",  // 或 overwrite/replace_range
  "doc_id": "文档 ID",
  "markdown": "追加的内容"
}
```

### 读取文档

```json
{
  "doc_id": "文档 ID 或 URL"
}
```

### 文档内容格式

支持 Lark-flavored Markdown：
- ✅ 标题（H1-H9）
- ✅ 列表（有序/无序/待办）
- ✅ 表格（Markdown/lark-table）
- ✅ 代码块
- ✅ Callout 高亮块
- ✅ 分栏（Grid）
- ✅ 图片（`<image url="..."/>`）
- ✅ Mermaid 图表
- ✅ 数学公式

---

## 📅 日历日程

### 创建日程

```json
{
  "action": "create",
  "summary": "日程标题",
  "start_time": "2026-03-24T10:00:00+08:00",
  "end_time": "2026-03-24T11:00:00+08:00",
  "attendees": [{"type": "user", "id": "ou_xxx"}]
}
```

### 查询日程

```json
{
  "action": "list",
  "start_time": "2026-03-24T00:00:00+08:00",
  "end_time": "2026-03-24T23:59:59+08:00"
}
```

---

## ✅ 任务管理

### 创建任务

```json
{
  "action": "create",
  "summary": "任务标题",
  "description": "任务描述",
  "due": {"timestamp": 1774353600000},
  "members": [{"id": "ou_xxx", "role": "assignee"}]
}
```

---

## 📊 多维表格

### 创建多维表格

```json
{
  "action": "create",
  "name": "表格名称"
}
```

### 创建记录

```json
{
  "action": "create",
  "app_token": "应用 token",
  "table_id": "表格 ID",
  "fields": {"字段名": "值"}
}
```

---

## 🔐 授权流程

### Device Flow 授权

```javascript
const https = require('https');

const appId = 'cli_a92692f305789ceb';
const appSecret = 'VJhazrJkyuxvBXTjZ2vjrhkAjduCGYm1';
const basicAuth = Buffer.from(`${appId}:${appSecret}`).toString('base64');

// 1. 获取设备码
POST https://accounts.feishu.cn/oauth/v1/device_authorization
Headers: Authorization: Basic ${basicAuth}
Body: client_id=${appId}

// 返回：
{
  "device_code": "xxx",
  "user_code": "A4AT-EZ8Z",
  "verification_uri_complete": "https://accounts.feishu.cn/oauth/v1/device/verify?flow_id=xxx&user_code=xxx",
  "expires_in": 180
}

// 2. 用户点击链接完成授权

// 3. 轮询获取 Token
POST https://open.feishu.cn/open-apis/authen/v2/oauth/token
Body: grant_type=device_code&device_code=xxx

// 4. Token 保存到内存
tokens.set(`${appId}:${userOpenId}`, tokenData);
```

### 授权链接格式

```
https://accounts.feishu.cn/oauth/v1/device/verify?flow_id=xxx&user_code=XXXX-XXXX
```

---

## 📋 配置信息

### 飞书机器人配置

```json
{
  "appId": "cli_a92692f305789ceb",
  "appSecret": "VJhazrJkyuxvBXTjZ2vjrhkAjduCGYm1",
  "dmPolicy": "pairing",
  "groupPolicy": "open"
}
```

### 权限要求

| 权限 | Scope | 用途 |
|------|-------|------|
| 用户身份 | `authen:login` | 获取用户信息 |
| 云空间管理 | `drive:file` | 管理云盘文件 |
| 云文档 | `docx:doc:write` | 创建/编辑文档 |
| 日历 | `calendar:calendar:write` | 管理日历 |
| 任务 | `task:task:write` | 管理任务 |

---

## ⚠️ 重要规则

### 会话使用原则

| 场景 | 正确做法 | 禁止做法 |
|------|---------|---------|
| 联系第三方 | 使用 bot 会话 | ❌ 使用用户的 DM 会话 |
| 群聊消息 | 使用 bot 会话 | ❌ 使用用户身份 |
| 云盘操作 | 使用当前授权用户 | ✅ 正确 |

### Token 使用原则

1. ✅ **Token 永不暴露** - 不对用户或 AI 层显示
2. ✅ **用户隔离** - 每个用户独立的 Token
3. ✅ **自动刷新** - 提前 5 分钟刷新
4. ✅ **过期删除** - 过期后自动从内存删除
5. ❌ **不持久化** - 不写入磁盘或数据库

### 飞书请求原则

1. ✅ **不走代理** - 飞书 API 直接访问
2. ✅ **使用 SDK** - 优先使用 Node.js SDK
3. ✅ **错误处理** - 捕获并处理 API 错误
4. ✅ **限流控制** - 批量操作添加延迟

---

## 🎯 使用示例

### 示例 1: 创建文件夹和文档

```javascript
// 1. 创建文件夹
const folderRes = await client.drive.file.createFolder({
  data: {
    name: '📁 项目文档',
    parent_type: 'folder',
    parent_id: 'root'
  }
});

// 2. 创建文档
await feishu_create_doc({
  folder_token: folderRes.data.token,
  title: '📄 项目计划',
  markdown: '# 项目计划\n\n## 目标\n\n- 目标 1\n- 目标 2'
});
```

### 示例 2: 批量创建文件夹

```javascript
const folders = ['📁 01-项目', '📁 02-资料', '📁 03-归档'];

for (const name of folders) {
  await client.drive.file.createFolder({
    data: {
      name: name,
      parent_type: 'folder',
      parent_id: 'root'
    }
  });
  await sleep(500); // 避免限流
}
```

### 示例 3: 授权后自动创建文档

```javascript
// 1. 发送授权链接
await message.send({
  target: userOpenId,
  message: `🔐 飞书授权通知\n\n请点击链接完成授权：\n${authLink}`
});

// 2. 等待授权完成（轮询）
// 3. 授权成功后创建文档
await feishu_create_doc({
  title: '欢迎文档',
  markdown: '# 欢迎使用飞书集成！'
});
```

---

## 🔍 错误处理

### 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| `params error` | 参数错误 | 检查 folder_token 是否正确 |
| `field validation failed` | 字段验证失败 | 检查必填字段 |
| `Authentication token expired` | Token 过期 | 重新授权 |
| `444 Access Denied` | 飞书服务端故障 | 等待恢复或重试 |

### 错误处理代码

```javascript
try {
  const res = await client.drive.file.createFolder({
    data: { name: '测试', parent_type: 'folder', parent_id: 'root' }
  });
  
  if (res.code !== 0) {
    throw new Error(`创建失败：${res.msg}`);
  }
} catch (e) {
  console.error('创建文件夹异常:', e.message);
  
  if (e.message.includes('expired')) {
    // Token 过期，需要重新授权
    return { error: 'Token 过期，请重新授权' };
  }
  
  throw e;
}
```

---

## 📖 相关资源

- **飞书开放平台**: https://open.feishu.cn/
- **SDK 文档**: https://open.feishu.cn/document/ukTMukTMukTM
- **云盘 API**: https://open.feishu.cn/document/ukTMukTMukTM/drive-v1/file/create
- **云文档 API**: https://open.feishu.cn/document/ukTMukTMukTM/docx-v1/document/create

---

## 📝 更新日志

### v1.0.0 (2026-03-24)
- ✅ 初始版本
- ✅ Token 内存存储机制
- ✅ 云盘操作集成
- ✅ 云文档操作集成
- ✅ 日历/任务/多维表格集成
- ✅ Device Flow 授权流程

---

*全局生效 - 所有 Session 和 Agent 自动可用*  
*最后更新：2026-03-24*  
*版本：v1.0.0*  
*维护人：OpenClaw Team*
