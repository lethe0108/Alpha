# StockAnalyst Pro - QQ 集成配置指南

> **Agent 名称**: StockAnalyst Pro  
> **QQ Bot 名称**: 股票分析助手  
> **创建日期**: 2026-03-27  
> **状态**: 🟡 需配置

---

## ⚠️ 重要说明

### 当前 OpenClaw 插件状态

**检查结果显示**: OpenClaw **没有原生 QQ 插件**。

**可用替代方案**:

| 方案 | 可行性 | 说明 |
|------|--------|------|
| **方案 A: go-cqhttp 桥接** | ✅ 推荐 | 使用 go-cqhttp + WebSocket 桥接到 OpenClaw |
| **方案 B: Telegram 替代** | ✅ 可用 | OpenClaw 有原生 Telegram 插件 |
| **方案 C: 微信替代** | ⚠️ 复杂 | 需要企业微信或个微机器人 |
| **方案 D: Discord 替代** | ✅ 可用 | OpenClaw 有原生 Discord 插件 |

---

## 🚀 方案 A: go-cqhttp 桥接（推荐）

### 原理

```
┌─────────────┐    WebSocket    ┌──────────────┐    HTTP    ┌───────────────┐
│    QQ       │ ◄─────────────► │  go-cqhttp   │ ◄────────► │  OpenClaw     │
│   用户      │                 │   机器人     │            │  StockAnalyst │
└─────────────┘                 └──────────────┘            └───────────────┘
```

### 步骤 1: 安装 go-cqhttp

```bash
# 下载 go-cqhttp
wget https://github.com/Mrs4s/go-cqhttp/releases/download/v1.0.1/go-cqhttp_linux_amd64.tar.gz
tar -xzf go-cqhttp_linux_amd64.tar.gz
cd go-cqhttp

# 生成配置
./go-cqhttp -u
```

### 步骤 2: 配置 go-cqhttp

编辑 `config.yml`:

```yaml
# go-cqhttp 配置
account:
  uin: 你的 QQ 号
  password: ""  # 建议使用扫码登录

servers:
  - ws-reverse:
      universal: ws://localhost:8080/ws
      reconnect-interval: 5000
```

### 步骤 3: 创建 QQ 桥接服务

创建 `/root/.openclaw/skills/stock-analyst-pro/qq-bridge.js`:

```javascript
const WebSocket = require('ws');

class QQBridge {
  constructor(config) {
    this.ws = new WebSocket(config.wsUrl);
    this.stockAnalyst = config.stockAnalyst;
    this.setupListeners();
  }

  setupListeners() {
    this.ws.on('message', async (data) => {
      const msg = JSON.parse(data);
      
      if (msg.message_type === 'message') {
        await this.handleMessage(msg);
      }
    });
  }

  async handleMessage(msg) {
    const content = msg.raw_message;
    const userId = msg.user_id;
    const chatId = msg.group_id || userId;
    
    // 解析命令
    const command = this.parseCommand(content);
    
    if (command) {
      const response = await this.executeCommand(command);
      await this.sendResponse(chatId, response);
    }
  }

  parseCommand(content) {
    const patterns = {
      stock: /^\/stock\s+(\d{6})/,
      market: /^\/market/,
      report: /^\/report/,
      help: /^\/help/
    };
    
    for (const [cmd, pattern] of Object.entries(patterns)) {
      const match = content.match(pattern);
      if (match) {
        return { cmd, args: match.slice(1) };
      }
    }
    return null;
  }

  async executeCommand(command) {
    switch (command.cmd) {
      case 'stock':
        return await this.stockAnalyst.analyzeStock(command.args[0]);
      case 'market':
        return await this.stockAnalyst.getMarketOverview();
      case 'report':
        return await this.stockAnalyst.getLatestReport();
      case 'help':
        return this.getHelpMessage();
      default:
        return '未知命令，发送 /help 查看帮助';
    }
  }

  async sendResponse(chatId, response) {
    this.ws.send(JSON.stringify({
      action: 'send_msg',
      params: {
        group_id: chatId > 100000 ? chatId : null,
        user_id: chatId <= 100000 ? chatId : null,
        message: response
      }
    }));
  }

  getHelpMessage() {
    return `📈 StockAnalyst Pro 股票分析助手

支持的命令:
/stock [代码] - 查询个股分析
/market - 查看市场概览
/report - 获取最新报告
/help - 查看帮助

⚠️ 免责声明：仅供参考，不构成投资建议`;
  }
}

module.exports = QQBridge;
```

### 步骤 4: 启动服务

```bash
# 启动 go-cqhttp
./go-cqhttp -d

# 启动 QQ 桥接服务
node /root/.openclaw/skills/stock-analyst-pro/qq-bridge.js
```

---

## 🚀 方案 B: Telegram 替代（原生支持）

### 优势

- ✅ OpenClaw 原生支持
- ✅ 配置简单
- ✅ 功能完整

### 步骤 1: 创建 Telegram Bot

1. 在 Telegram 搜索 `@BotFather`
2. 发送 `/newbot`
3. 按提示设置 Bot 名称
4. 获取 Bot Token

### 步骤 2: 配置 OpenClaw

编辑 `~/.openclaw/openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "telegram": {
        "enabled": true,
        "config": {
          "botToken": "YOUR_BOT_TOKEN"
        }
      }
    }
  }
}
```

### 步骤 3: 重启 Gateway

```bash
openclaw gateway restart
```

### 步骤 4: 测试 Bot

在 Telegram 中搜索你的 Bot，发送 `/help` 测试

---

## 🚀 方案 C: 企业微信替代

### 优势

- ✅ 国内可用
- ✅ 企业级功能
- ✅ 支持群聊

### 步骤 1: 创建企业微信应用

1. 访问 [企业微信管理后台](https://work.weixin.qq.com/)
2. 创建企业（如无）
3. 创建自建应用
4. 获取 CorpID 和 Secret

### 步骤 2: 配置 Webhook

```json
{
  "plugins": {
    "entries": {
      "wecom": {
        "enabled": true,
        "config": {
          "corpId": "YOUR_CORP_ID",
          "corpSecret": "YOUR_CORP_SECRET",
          "agentId": "YOUR_AGENT_ID"
        }
      }
    }
  }
}
```

---

## 📋 StockAnalyst Pro QQ 命令设计

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

### 自动推送

| 推送类型 | 时间 | 内容 |
|---------|------|------|
| ** hourly 报告** | 每小时整点 | 市场表现、重大事件 |
| **午间总结** | 12:00 | 上午市场总结 |
| **收盘报告** | 15:30 | 全天市场总结 |
| **晚间复盘** | 20:00 | 晚间复盘分析 |

---

## ⚙️ 完整配置示例（go-cqhttp 方案）

### 目录结构

```
/root/.openclaw/skills/stock-analyst-pro/
├── SKILL.md              # Agent 技能定义
├── qq-bridge.js          # QQ 桥接服务
├── qq-config.yml         # go-cqhttp 配置
├── package.json          # Node.js 依赖
└── QQ_INTEGRATION.md     # 本文档
```

### package.json

```json
{
  "name": "stock-analyst-qq-bridge",
  "version": "1.0.0",
  "main": "qq-bridge.js",
  "dependencies": {
    "ws": "^8.14.0",
    "axios": "^1.6.0"
  }
}
```

### 安装依赖

```bash
cd /root/.openclaw/skills/stock-analyst-pro/
npm install
```

### 启动脚本

创建 `start-qq-bot.sh`:

```bash
#!/bin/bash

# 启动 go-cqhttp
cd /root/go-cqhttp
./go-cqhttp -d

# 等待 5 秒
sleep 5

# 启动 QQ 桥接服务
cd /root/.openclaw/skills/stock-analyst-pro/
node qq-bridge.js
```

### 系统服务配置

创建 `/etc/systemd/system/stock-analyst-qq.service`:

```ini
[Unit]
Description=StockAnalyst QQ Bridge
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/.openclaw/skills/stock-analyst-pro/
ExecStart=/usr/bin/node qq-bridge.js
Restart=always

[Install]
WantedBy=multi-user.target
```

启动服务:

```bash
systemctl daemon-reload
systemctl enable stock-analyst-qq
systemctl start stock-analyst-qq
```

---

## 🎯 推荐方案对比

| 方案 | 难度 | 稳定性 | 推荐度 |
|------|------|--------|--------|
| **go-cqhttp 桥接** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Telegram** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **企业微信** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Discord** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |

**南哥，我推荐使用 go-cqhttp 方案**，因为:
1. ✅ 直接使用 QQ，无需切换平台
2. ✅ 配置相对简单
3. ✅ 稳定性好
4. ✅ 功能完整

---

## ⚠️ 注意事项

### 1. QQ 账号安全

- 建议使用小号，不要用主号
- 使用扫码登录，避免密码泄露
- 注意风控，避免频繁操作

### 2. 合规要求

- 所有报告必须包含免责声明
- 不得提供确定性预测
- 不得推荐具体买卖点位

### 3. 服务监控

建议配置服务监控，确保 Bot 在线:

```bash
# 检查服务状态
systemctl status stock-analyst-qq

# 查看日志
journalctl -u stock-analyst-qq -f
```

---

## 📞 下一步行动

**南哥，请告诉我您想选择哪个方案**:

1. **go-cqhttp 桥接** - 我帮您配置完整的 QQ 机器人
2. **Telegram** - 配置简单，5 分钟搞定
3. **企业微信** - 企业级功能，更稳定
4. **其他需求** - 告诉我您的具体需求

**选择后我会立即开始配置！** 🚀

---

*最后更新：2026-03-27 12:10*
