#!/usr/bin/env node

/**
 * StockAnalyst Pro - QQ Bridge Service
 * 
 * 通过 go-cqhttp WebSocket 桥接 QQ 消息到 StockAnalyst Agent
 * 
 * 依赖:
 * - go-cqhttp (https://github.com/Mrs4s/go-cqhttp)
 * - ws (WebSocket 库)
 * - axios (HTTP 请求库)
 * 
 * 使用方法:
 * 1. 安装 go-cqhttp 并配置
 * 2. 安装依赖：npm install
 * 3. 启动服务：node qq-bridge.js
 */

const WebSocket = require('ws');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  // go-cqhttp WebSocket 地址
  wsUrl: process.env.CQ_WS_URL || 'ws://localhost:8080/ws',
  
  // OpenClaw API 地址（如果需要调用）
  openclawUrl: process.env.OPENCLAW_URL || 'http://localhost:3000',
  
  // 管理员 QQ 号（可选，用于权限控制）
  adminQQ: process.env.ADMIN_QQ || '',
  
  // 日志级别
  logLevel: process.env.LOG_LEVEL || 'info'
};

// 日志函数
function log(level, message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
}

// StockAnalyst Pro 核心功能
class StockAnalyst {
  constructor() {
    this.watchList = new Map(); // 自选股
    this.alerts = new Map(); // 股价提醒
  }

  // 分析个股
  async analyzeStock(stockCode) {
    log('info', `分析股票：${stockCode}`);
    
    try {
      // 调用 web 搜索获取股票信息
      const searchUrl = `https://quote.eastmoney.com/${this.formatStockCode(stockCode)}.html`;
      
      // 这里简化处理，实际应该调用 web_fetch 或 API
      const response = `📈 ${stockCode} 股票分析

📊 基本面:
- PE: 数据获取中...
- PB: 数据获取中...
- 股息率：数据获取中...

⚠️ 完整报告请访问:
${searchUrl}

⚠️ 免责声明：仅供参考，不构成投资建议`;

      return response;
    } catch (error) {
      log('error', `分析股票失败：${error.message}`);
      return '❌ 分析失败，请稍后重试';
    }
  }

  // 市场概览
  async getMarketOverview() {
    log('info', '获取市场概览');
    
    return `📊 A 股市场概览

上证指数：数据获取中...
深证成指：数据获取中...
创业板：数据获取中...

📈 领涨板块：数据获取中...
📉 领跌板块：数据获取中...

⚠️ 实时数据请访问东方财富网

⚠️ 免责声明：仅供参考，不构成投资建议`;
  }

  // 最新报告
  async getLatestReport() {
    log('info', '获取最新报告');
    
    return `📋 最新分析报告

📄 市场分析报告:
memory/STOCK_MARKET_ANALYSIS_20260327.md

📄 地缘政治报告:
memory/STOCK_GEOPOLITICS_ANALYSIS_20260327.md

⚠️ 免责声明：仅供参考，不构成投资建议`;
  }

  // 添加自选股
  addWatch(stockCode) {
    this.watchList.set(stockCode, Date.now());
    return `✅ 已添加 ${stockCode} 到自选股`;
  }

  // 设置提醒
  setAlert(stockCode, targetPrice) {
    this.alerts.set(stockCode, {
      price: parseFloat(targetPrice),
      createdAt: Date.now()
    });
    return `✅ 已设置 ${stockCode} 股价提醒：${targetPrice} 元`;
  }

  // 帮助信息
  getHelp() {
    return `📈 StockAnalyst Pro 股票分析助手

📋 支持的命令:
/stock [代码] - 查询个股分析
  示例：/stock 601398

/market - 查看市场概览

/report - 获取最新报告

/watch [代码] - 添加自选股
  示例：/watch 601398

/alert [代码] [价格] - 设置股价提醒
  示例：/alert 601398 3.5

/policy - 查看最新政策

/news - 查看最新新闻

/help - 查看帮助

⚠️ 免责声明：
本报告仅供参考，不构成投资建议。
股市有风险，投资需谨慎。`;
  }

  // 格式化股票代码
  formatStockCode(code) {
    // 简单判断沪市/深市
    if (code.startsWith('6') || code.startsWith('5')) {
      return `sh${code}`;
    } else {
      return `sz${code}`;
    }
  }
}

// QQ 桥接服务
class QQBridge {
  constructor(config) {
    this.config = config;
    this.stockAnalyst = new StockAnalyst();
    this.ws = null;
    this.reconnectInterval = 5000; // 重连间隔 5 秒
  }

  // 启动服务
  async start() {
    log('info', '启动 QQ Bridge 服务...');
    this.connect();
  }

  // 连接 WebSocket
  connect() {
    log('info', `连接到 ${this.config.wsUrl}`);
    
    this.ws = new WebSocket(this.config.wsUrl);

    this.ws.on('open', () => {
      log('info', 'WebSocket 连接成功');
    });

    this.ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data.toString());
        await this.handleMessage(msg);
      } catch (error) {
        log('error', `处理消息失败：${error.message}`);
      }
    });

    this.ws.on('close', () => {
      log('warn', 'WebSocket 连接关闭，准备重连...');
      setTimeout(() => this.connect(), this.reconnectInterval);
    });

    this.ws.on('error', (error) => {
      log('error', `WebSocket 错误：${error.message}`);
    });
  }

  // 处理消息
  async handleMessage(msg) {
    // 只处理消息类型
    if (msg.post_type !== 'message') {
      return;
    }

    const content = msg.raw_message;
    const userId = msg.user_id;
    const chatId = msg.group_id || userId;
    const isGroup = !!msg.group_id;

    log('info', `收到消息：${userId} (${isGroup ? '群聊' : '私聊'}) - ${content}`);

    // 解析命令
    const command = this.parseCommand(content);
    
    if (command) {
      const response = await this.executeCommand(command);
      await this.sendResponse(chatId, isGroup, response);
    }
  }

  // 解析命令
  parseCommand(content) {
    const patterns = {
      stock: /^\/stock\s+(\d{6})/i,
      market: /^\/market/i,
      report: /^\/report/i,
      watch: /^\/watch\s+(\d{6})/i,
      alert: /^\/alert\s+(\d{6})\s+([\d.]+)/i,
      policy: /^\/policy/i,
      news: /^\/news/i,
      help: /^\/help/i
    };

    for (const [cmd, pattern] of Object.entries(patterns)) {
      const match = content.match(pattern);
      if (match) {
        return { cmd, args: match.slice(1) };
      }
    }
    return null;
  }

  // 执行命令
  async executeCommand(command) {
    log('info', `执行命令：${command.cmd} ${command.args.join(' ')}`);

    switch (command.cmd) {
      case 'stock':
        return await this.stockAnalyst.analyzeStock(command.args[0]);
      
      case 'market':
        return await this.stockAnalyst.getMarketOverview();
      
      case 'report':
        return await this.stockAnalyst.getLatestReport();
      
      case 'watch':
        return this.stockAnalyst.addWatch(command.args[0]);
      
      case 'alert':
        return this.stockAnalyst.setAlert(command.args[0], command.args[1]);
      
      case 'policy':
        return '📋 最新政策\n\n数据获取中...\n\n⚠️ 免责声明：仅供参考，不构成投资建议';
      
      case 'news':
        return '📰 最新新闻\n\n数据获取中...\n\n⚠️ 免责声明：仅供参考，不构成投资建议';
      
      case 'help':
        return this.stockAnalyst.getHelp();
      
      default:
        return '未知命令，发送 /help 查看帮助';
    }
  }

  // 发送响应
  async sendResponse(chatId, isGroup, message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      log('error', 'WebSocket 未连接，无法发送消息');
      return;
    }

    const payload = {
      action: 'send_msg',
      params: {}
    };

    if (isGroup) {
      payload.params.group_id = chatId;
    } else {
      payload.params.user_id = chatId;
    }

    // 分割长消息（QQ 限制 2000 字符）
    const messages = this.splitMessage(message);
    
    for (const msg of messages) {
      payload.params.message = msg;
      this.ws.send(JSON.stringify(payload));
      log('info', `发送消息到 ${chatId}`);
      // 避免发送过快
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // 分割长消息
  splitMessage(message, maxLength = 1900) {
    const messages = [];
    let current = '';

    for (const line of message.split('\n')) {
      if ((current + line + '\n').length > maxLength) {
        messages.push(current);
        current = line + '\n';
      } else {
        current += line + '\n';
      }
    }

    if (current) {
      messages.push(current);
    }

    return messages;
  }

  // 检查股价提醒
  async checkAlerts() {
    // 每小时检查一次
    setInterval(async () => {
      if (this.alerts.size === 0) return;

      log('info', `检查 ${this.alerts.size} 个股价提醒`);

      for (const [stockCode, alert] of this.alerts) {
        // TODO: 获取实时股价并比较
        // 如果触发提醒，发送 QQ 消息
      }
    }, 3600000); // 1 小时
  }
}

// 主程序
async function main() {
  log('info', '=== StockAnalyst Pro QQ Bridge ===');
  log('info', `配置: WS=${CONFIG.wsUrl}, LOG=${CONFIG.logLevel}`);

  // 检查依赖
  try {
    require.resolve('ws');
    require.resolve('axios');
  } catch (error) {
    log('error', '缺少依赖，请运行：npm install');
    process.exit(1);
  }

  // 启动桥接服务
  const bridge = new QQBridge(CONFIG);
  await bridge.start();

  // 启动提醒检查
  bridge.checkAlerts();

  log('info', '服务已启动，等待消息...');

  // 优雅退出
  process.on('SIGINT', () => {
    log('info', '正在关闭服务...');
    if (bridge.ws) {
      bridge.ws.close();
    }
    process.exit(0);
  });
}

// 运行主程序
main().catch(error => {
  log('error', `启动失败：${error.message}`);
  process.exit(1);
});
