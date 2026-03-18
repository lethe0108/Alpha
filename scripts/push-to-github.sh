#!/bin/bash
# GitHub 推送脚本

echo "🚀 准备推送到 GitHub..."
echo ""
echo "请输入 GitHub Personal Access Token:"
read -s token
echo ""

# 设置 credential
git config --global credential.helper store
echo "https://lethe0108:${token}@github.com" > ~/.git-credentials
chmod 600 ~/.git-credentials

# 推送
echo "📤 推送中..."
git push -u origin master

echo ""
echo "✅ 推送完成！"
