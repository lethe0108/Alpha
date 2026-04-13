#!/bin/bash
# CRW Wrapper - 简化版

URL="$1"

# 智能路由判断
USE_PROXY=$(python3 /root/.openclaw/config/crw_smart_router.py "$URL" 2>&1 | grep "使用代理: 是" | wc -l)

if [ "$USE_PROXY" -gt 0 ]; then
    export ALL_PROXY=socks5://127.0.0.1:10808
    echo "使用代理抓取..."
else
    echo "直连抓取..."
fi

# 调用CRW（过滤日志）
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"crw_scrape","arguments":{"url":"'$URL'"}}}' | timeout 15 /usr/local/bin/crw-mcp 2>&1 | grep -v INFO | jq '.result.content[0].text' -r