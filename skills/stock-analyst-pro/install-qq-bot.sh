#!/bin/bash

# StockAnalyst Pro QQ Bot 快速安装脚本
# 使用方法：./install-qq-bot.sh

set -e

echo "========================================"
echo "  StockAnalyst Pro QQ Bot 安装脚本"
echo "========================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js 16+"
    echo "   访问：https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js 版本过低 ($NODE_VERSION)，需要 16+"
    exit 1
fi

echo "✅ Node.js 版本：$(node -v)"

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 未检测到 npm"
    exit 1
fi

echo "✅ npm 版本：$(npm -v)"

# 安装 go-cqhttp
echo ""
echo "📥 下载 go-cqhttp..."
GO_CQHTTP_URL="https://github.com/Mrs4s/go-cqhttp/releases/download/v1.0.1/go-cqhttp_linux_amd64.tar.gz"
GO_CQHTTP_DIR="/root/go-cqhttp"

if [ ! -d "$GO_CQHTTP_DIR" ]; then
    mkdir -p "$GO_CQHTTP_DIR"
    cd "$GO_CQHTTP_DIR"
    wget -q "$GO_CQHTTP_URL"
    tar -xzf go-cqhttp_linux_amd64.tar.gz
    rm go-cqhttp_linux_amd64.tar.gz
    echo "✅ go-cqhttp 已安装到 $GO_CQHTTP_DIR"
else
    echo "✅ go-cqhttp 已安装"
fi

# 配置 go-cqhttp
echo ""
echo "📝 配置 go-cqhttp..."
if [ ! -f "$GO_CQHTTP_DIR/config.yml" ]; then
    cp /root/.openclaw/skills/stock-analyst-pro/qq-config.yml "$GO_CQHTTP_DIR/config.yml"
    echo "✅ 配置文件已创建"
    echo ""
    echo "⚠️  请编辑 $GO_CQHTTP_DIR/config.yml 配置你的 QQ 号"
    echo "   然后运行：cd $GO_CQHTTP_DIR && ./go-cqhttp"
else
    echo "✅ 配置文件已存在"
fi

# 安装 Node.js 依赖
echo ""
echo "📦 安装 Node.js 依赖..."
cd /root/.openclaw/skills/stock-analyst-pro/
npm install --production
echo "✅ 依赖安装完成"

# 创建系统服务
echo ""
echo "🔧 创建系统服务..."
SERVICE_FILE="/etc/systemd/system/stock-analyst-qq.service"

cat > "$SERVICE_FILE" << 'EOF'
[Unit]
Description=StockAnalyst QQ Bridge
After=network.target go-cqhttp.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/.openclaw/skills/stock-analyst-pro/
ExecStart=/usr/bin/node qq-bridge.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=CQ_WS_URL=ws://localhost:8080/ws

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
echo "✅ 系统服务已创建"

# 创建 go-cqhttp 服务
echo ""
echo "🔧 创建 go-cqhttp 系统服务..."
GOCQ_SERVICE_FILE="/etc/systemd/system/go-cqhttp.service"

cat > "$GOCQ_SERVICE_FILE" << 'EOF'
[Unit]
Description=go-cqhttp QQ Bot Framework
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/go-cqhttp
ExecStart=/root/go-cqhttp/go-cqhttp
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
echo "✅ go-cqhttp 系统服务已创建"

# 总结
echo ""
echo "========================================"
echo "  安装完成！"
echo "========================================"
echo ""
echo "📋 下一步操作:"
echo ""
echo "1. 配置 QQ 账号:"
echo "   编辑：$GO_CQHTTP_DIR/config.yml"
echo "   修改 account.uin 为你的 QQ 号"
echo ""
echo "2. 启动 go-cqhttp:"
echo "   systemctl start go-cqhttp"
echo "   systemctl enable go-cqhttp"
echo ""
echo "3. 扫码登录:"
echo "   查看日志：journalctl -u go-cqhttp -f"
echo "   使用手机 QQ 扫描终端中的二维码"
echo ""
echo "4. 启动 QQ Bridge:"
echo "   systemctl start stock-analyst-qq"
echo "   systemctl enable stock-analyst-qq"
echo ""
echo "5. 测试 Bot:"
echo "   在 QQ 中发送：/help"
echo ""
echo "📁 重要文件:"
echo "   配置：$GO_CQHTTP_DIR/config.yml"
echo "   日志：journalctl -u go-cqhttp -f"
echo "   服务：systemctl status stock-analyst-qq"
echo ""
echo "========================================"
