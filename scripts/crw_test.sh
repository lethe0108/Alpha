#!/bin/bash
URL="$1"
echo "测试URL: $URL"

# 直接调用CRW（测试版）
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"crw_scrape","arguments":{"url":"'$URL'"}}}' | timeout 10 /usr/local/bin/crw-mcp 2>&1 | grep -v INFO | jq '.result.content[0].text' -r
