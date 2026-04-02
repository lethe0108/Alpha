# StockAnalyst Pro - 飞书集成配置指南

> **Agent 名称**: StockAnalyst Pro  
> **飞书 Bot 名称**: 股票分析助手  
> **创建日期**: 2026-03-27

---

## 📱 飞书 Bot 启用步骤

### 步骤 1: 确认飞书插件已启用

```bash
# 检查飞书插件状态
openclaw plugins list
```

确保 `openclaw-lark` 插件已启用。

### 步骤 2: 配置飞书 Bot

在飞书开放平台创建应用：

1. 访问 [飞书开放平台](https://open.feishu.cn/)
2. 创建企业自建应用
3. 应用名称：`StockAnalyst Pro`
4. 获取凭证：
   - App ID
   - App Secret
   - Verification Token
   - Encrypt Key

### 步骤 3: 配置 OpenClaw 飞书插件

编辑 `~/.openclaw/config.json`：

```json
{
  "plugins": {
    "entries": {
      "lark": {
        "config": {
          "appId": "cli_xxxxxxxxxxxxx",
          "appSecret": "xxxxxxxxxxxxxxxxxxxxx",
          "verificationToken": "xxxxxxxxxxxxxxxxxxxxx",
          "encryptKey": "xxxxxxxxxxxxxxxxxxxxx"
        }
      }
    }
  }
}
```

### 步骤 4: 配置 Bot 能力

在飞书开放平台配置：

1. **机器人能力**:
   - ✅ 接收消息
   - ✅ 发送消息
   - ✅ 群聊
   - ✅ 私聊

2. **事件订阅**:
   - ✅ 接收消息 v2.0
   - ✅ 用户发送消息

3. **权限配置**:
   - ✅ 发送消息
   - ✅ 读取用户信息
   - ✅ 读取群组信息

### 步骤 5: 发布应用

1. 在飞书开放平台提交审核
2. 审核通过后发布
3. 在飞书中添加机器人到聊天

---

## 🤖 Bot 命令配置

### 支持的命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `/stock [代码]` | 查询个股分析 | `/stock 601398` |
| `/market` | 查看市场概览 | `/market` |
| `/report` | 获取最新报告 | `/report` |
| `/watch [代码]` | 添加自选股 | `/watch 601398` |
| `/alert [代码] [价格]` | 设置股价提醒 | `/alert 601398 3.5` |
| `/policy` | 查看最新政策 | `/policy` |
| `/news` | 查看最新新闻 | `/news` |
| `/help` | 查看帮助 | `/help` |

### 命令处理器配置

在 `~/.openclaw/skills/stock-analyst-pro/` 创建 `commands.json`：

```json
{
  "commands": {
    "stock": {
      "description": "查询个股分析",
      "handler": "handle_stock_query",
      "params": ["stock_code"]
    },
    "market": {
      "description": "查看市场概览",
      "handler": "handle_market_overview"
    },
    "report": {
      "description": "获取最新报告",
      "handler": "handle_latest_report"
    },
    "watch": {
      "description": "添加自选股",
      "handler": "handle_watch_add",
      "params": ["stock_code"]
    },
    "alert": {
      "description": "设置股价提醒",
      "handler": "handle_alert_set",
      "params": ["stock_code", "price"]
    },
    "policy": {
      "description": "查看最新政策",
      "handler": "handle_policy_news"
    },
    "news": {
      "description": "查看最新新闻",
      "handler": "handle_latest_news"
    },
    "help": {
      "description": "查看帮助",
      "handler": "handle_help"
    }
  }
}
```

---

## ⏰ 定时报告配置

### 已配置的定时任务

| 任务 ID | 任务名称 | 频率 | 说明 |
|--------|---------|------|------|
| `7eb7d21f` | 每小时市场汇总报告 | 每小时 | 市场表现、重大事件、板块涨跌 |

### 额外定时任务（可选）

```json
{
  "cron_jobs": [
    {
      "name": "午间市场总结",
      "schedule": "0 12 * * 1-5",
      "description": "每个交易日中午 12 点生成上午市场总结"
    },
    {
      "name": "收盘报告",
      "schedule": "30 15 * * 1-5",
      "description": "每个交易日下午 15:30 生成收盘报告"
    },
    {
      "name": "晚间复盘",
      "schedule": "0 20 * * 1-5",
      "description": "每个交易日晚上 20:00 生成晚间复盘"
    }
  ]
}
```

---

## 📊 报告推送配置

### 推送渠道

| 渠道 | 配置 | 说明 |
|------|------|------|
| **飞书群聊** | 配置群 ID | 推送到指定投资讨论群 |
| **飞书私聊** | 用户 OpenID | 推送给用户个人 |
| **飞书云文档** | 文档 ID | 报告归档到云文档 |

### 推送时间

| 报告类型 | 时间 | 渠道 |
|---------|------|------|
|  hourly 报告 | 每小时整点 | 飞书群聊 |
| 午间总结 | 12:00 | 飞书群聊 + 私聊 |
| 收盘报告 | 15:30 | 飞书群聊 + 私聊 |
| 晚间复盘 | 20:00 | 飞书私聊 |

---

## 🔧 测试步骤

### 1. 测试 Bot 响应

在飞书中发送：
```
/help
```

预期响应：Bot 返回帮助信息

### 2. 测试股票查询

在飞书中发送：
```
/stock 601398
```

预期响应：Bot 返回工商银行分析报告

### 3. 测试市场概览

在飞书中发送：
```
/market
```

预期响应：Bot 返回当前市场概览

### 4. 测试定时报告

等待下一个整点，检查是否收到 hourly 报告

---

## ⚠️ 注意事项

### 1. 数据延迟

- 股票行情数据至少延迟 15 分钟
- 实时新闻可能有 1-5 分钟延迟

### 2. API 限制

- 飞书 API 有调用频率限制
- 避免短时间内大量请求

### 3. 免责声明

所有报告必须包含免责声明：
```
⚠️ 免责声明：本报告仅供参考，不构成投资建议。
股市有风险，投资需谨慎。
```

### 4. 合规要求

- 不得提供确定性预测
- 不得推荐具体买卖点位
- 必须提示投资风险

---

## 📞 技术支持

如遇到问题，请检查：

1. 飞书插件是否启用
2. 凭证配置是否正确
3. 网络是否通畅
4. 日志是否有错误信息

查看日志：
```bash
openclaw logs --plugin lark
```

---

*最后更新：2026-03-27 12:00*
