#!/bin/bash
# 记忆数据库快速检索脚本

QUERY="$1"
LIMIT="${2:-5}"

if [ -z "$QUERY" ]; then
    echo "用法：memory-search.sh '搜索关键词' [返回数量]"
    echo "示例：memory-search.sh '不满意' 3"
    exit 1
fi

echo "🔍 搜索记忆数据库：$QUERY"
echo "----------------------------------------"

sudo -u postgres psql -d memory_db -t -A -c "
SELECT 
    '【' || type || '】' || chr(10) ||
    '时间：' || created_at || chr(10) ||
    '内容：' || left(content, 300) || '...' || chr(10) ||
    '---'
FROM memories
WHERE content ILIKE '%${QUERY}%'
ORDER BY created_at DESC
LIMIT ${LIMIT};"
