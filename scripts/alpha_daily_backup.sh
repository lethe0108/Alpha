#!/bin/bash
# Alpha 完整备份脚本 v3
# 功能：将 /root/.openclaw 整个目录完整备份到 GitHub Alpha 仓库
# 执行时间：每天凌晨 5:00
# 创建时间：2026-03-18
# 特性：支持代理访问 GitHub

set -e

# 配置
OPENCLAW_DIR="/root/.openclaw"
GITHUB_REPO="git@github.com:lethe0108/Alpha.git"
# 使用 SSH 方式，无需 Token，更安全
DATE=$(date +%Y-%m-%d)
DATETIME=$(date +"%Y-%m-%d %H:%M:%S")

# 代理配置 (V2Ray SOCKS5 代理)
PROXY_SOCKS5="socks5://127.0.0.1:10808"  # V2Ray SOCKS5 端口
PROXY_HTTP="http://127.0.0.1:10809"      # V2Ray HTTP 端口
PROXY_ENABLED=false

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Alpha 完整备份脚本 v3${NC}"
echo -e "${GREEN}执行时间：${DATETIME}${NC}"
echo -e "${GREEN}备份范围：/root/.openclaw (整个目录)${NC}"
echo -e "${GREEN}代理支持：已启用${NC}"
echo -e "${GREEN}========================================${NC}"

# 网络检测和代理切换
echo -e "${YELLOW}[0/8] 检测网络连接...${NC}"

# 测试直连 GitHub
if curl -s --connect-timeout 5 https://github.com > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 直连 GitHub 正常${NC}"
    PROXY_ENABLED=false
else
    echo -e "${YELLOW}! 直连 GitHub 失败，尝试代理...${NC}"
    # 测试代理连接 (使用 SOCKS5)
    if curl -s --connect-timeout 5 --socks5 "127.0.0.1:10808" https://github.com > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 代理连接成功 (SOCKS5)${NC}"
        PROXY_ENABLED=true
        export GIT_SOCKS5_PROXY="127.0.0.1:10808"
        export https_proxy="$PROXY_HTTP"
        export http_proxy="$PROXY_HTTP"
    else
        echo -e "${RED}✗ 代理连接也失败，请检查代理配置${NC}"
        echo -e "${YELLOW}当前代理地址：$PROXY_URL${NC}"
        echo -e "${YELLOW}请修改脚本中的 PROXY_URL 或使用以下命令设置：${NC}"
        echo -e "  export https_proxy=http://your-proxy:port${NC}"
        echo -e "  export http_proxy=http://your-proxy:port${NC}"
        exit 1
    fi
fi

# 进入目录
cd "$OPENCLAW_DIR"

# 1. 配置 Git
echo -e "${YELLOW}[1/8] 配置 Git...${NC}"
git config user.name "lethe0108"
git config user.email "lethe0108@users.noreply.github.com"

# 配置 Git 代理 (如果启用了代理)
if [ "$PROXY_ENABLED" = true ]; then
    # 使用 SOCKS5 代理
    git config --global core.socksProxy "127.0.0.1:10808"
    echo -e "${GREEN}✓ Git SOCKS5 代理已配置${NC}"
else
    # 禁用代理
    git config --global --unset core.socksProxy 2>/dev/null || true
    git config --global --unset http.proxy 2>/dev/null || true
    git config --global --unset https.proxy 2>/dev/null || true
fi

# 2. 检查远程仓库
echo -e "${YELLOW}[2/8] 检查远程仓库...${NC}"
if ! git remote | grep -q origin; then
    git remote add origin "$GITHUB_REPO"
fi

# 3. 创建/更新 .gitignore
echo -e "${YELLOW}[3/8] 更新 .gitignore...${NC}"
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python

# Node
node_modules/
npm-debug.log
yarn-error.log

# IDE
.idea/
.vscode/
*.swp
*.swo

# System
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Temp
tmp/
temp/

# Backup
*.bak
*.backup
*.bak.*

# Git
.git/

# Large files
*.egg-info/
dist/
build/

# Nested Git repositories (separate workspaces)
workspace-agent-commander/

# Sensitive data - Session files may contain tokens
agents/main/sessions/*.jsonl*
agents/opencode/sessions/*.jsonl*
agents/*/sessions/*.jsonl*
config/
*.sqlite
*.sqlite-shm
*.sqlite-wal
media/inbound/
media/qqbot/
syslog*
exec-approvals.json

# Large media files
*.pptx
*.zip
*.tar.gz
*.tar
EOF

# 4. 添加所有文件
echo -e "${YELLOW}[4/8] 添加所有文件 (保持完整目录结构)...${NC}"
git add -A

# 5. 生成提交信息
echo -e "${YELLOW}[5/8] 生成提交信息...${NC}"

# 统计
TOTAL_FILES=$(git status --porcelain | wc -l)
ADDED=$(git diff --cached --numstat 2>/dev/null | awk '{added+=$1} END {print added+0}')
DELETED=$(git diff --cached --numstat 2>/dev/null | awk '{deleted+=$2} END {print deleted+0}')

# 获取主要变更目录
CHANGED_DIRS=$(git status --porcelain 2>/dev/null | awk '{print $2}' | xargs dirname 2>/dev/null | sort -u | head -10 | tr '\n' ', ' | sed 's/,$//')

# 如果是首次提交
if [ -z "$(git log --oneline -1 2>/dev/null)" ]; then
    COMMIT_MSG="🎉 首次完整备份 - $DATE

**备份时间**: $DATETIME
**备份范围**: /root/.openclaw (整个目录)

**完整目录结构**:
- config/ - 配置文件
- cron/ - 定时任务
- skills/ - 技能文件
- workspace/ - 工作空间
  - 01-core/ - 核心配置
  - 02-principles/ - 原则规范
  - 03-backup/ - 备份文档
  - 04-projects/ - 项目文档
  - 05-feishu/ - 飞书相关
  - 06-github/ - GitHub 相关
  - 07-reports/ - 报告文档
  - 08-scripts/ - 脚本文件
  - 09-config/ - 配置文件
  - 10-research/ - 研究报告
  - 11-session-sync/ - Session 同步
  - backend/ - 后端代码
  - docs/ - 文档
  - input-method/ - 输入法
  - memory/ - 记忆文件
  - net-slang-tool/ - 网络用语工具
  - prompt-master/ - 提示词大师
  - projects/ - 项目系统
  - skills/ - 技能
  - stock-screening-guide/ - 股票选股

**核心内容**:
- OpenClaw 完整配置
- 所有工作空间文件
- 所有项目和技能
- 所有记忆和配置

---
*Alpha 系统 - 保护南哥的数据安全* 🛡️"
else
    COMMIT_MSG="📦 自动备份 - $DATE

**备份时间**: $DATETIME
**备份范围**: /root/.openclaw (整个目录)
**文件变更**: +$ADDED / -$DELETED 行
**变更文件**: $TOTAL_FILES 个

**变更目录**:
$CHANGED_DIRS

**核心内容**:
- 工作空间文件更新
- 配置文件同步
- 项目文档更新
- 保持完整目录结构

---
*自动备份 - 保护南哥的数据安全* 🛡️"
fi

# 6. 提交
echo -e "${YELLOW}[6/8] 提交到 Git...${NC}"
git commit -m "$COMMIT_MSG" || echo "没有变更，跳过提交"

# 7. 推送 (带重试机制)
echo -e "${YELLOW}[7/8] 推送到 GitHub...${NC}"
if [ "$PROXY_ENABLED" = true ]; then
    echo -e "${YELLOW}使用代理推送...${NC}"
fi

# 重试机制 (最多 3 次)
MAX_RETRIES=3
RETRY_COUNT=0
PUSH_SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if git push -u origin main 2>&1; then
        PUSH_SUCCESS=true
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo -e "${YELLOW}推送失败，等待 5 秒后重试 ($RETRY_COUNT/$MAX_RETRIES)...${NC}"
            sleep 5
        fi
    fi
done

if [ "$PUSH_SUCCESS" = false ]; then
    echo -e "${RED}✗ 推送失败，已达到最大重试次数${NC}"
    echo -e "${YELLOW}请检查网络连接或代理配置${NC}"
    exit 1
fi

# 8. 清理代理配置 (如果是临时启用)
if [ "$PROXY_ENABLED" = true ]; then
    echo -e "${YELLOW}[8/8] 清理临时配置...${NC}"
    unset https_proxy
    unset http_proxy
    unset GIT_PROXY_COMMAND
else
    echo -e "${YELLOW}[8/8] 完成...${NC}"
fi

# 完成
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ 备份完成！${NC}"
echo -e "${GREEN}仓库：https://github.com/lethe0108/Alpha${NC}"
echo -e "${GREEN}范围：/root/.openclaw (整个目录)${NC}"
echo -e "${GREEN}文件：$TOTAL_FILES 个${NC}"
echo -e "${GREEN}变更：+$ADDED / -$DELETED 行${NC}"
echo -e "${GREEN}目录结构：完整保持${NC}"
if [ "$PROXY_ENABLED" = true ]; then
    echo -e "${GREEN}代理：已使用${NC}"
fi
echo -e "${GREEN}========================================${NC}"

# 记录日志
echo "[$DATETIME] 备份成功 - $TOTAL_FILES 个文件，+$ADDED/-$DELETED 行" >> /root/.openclaw/backup.log

# 生成备份清单
cat > BACKUP_MANIFEST.txt << EOF
# Alpha 备份清单

**备份时间**: $DATETIME
**备份范围**: /root/.openclaw
**文件总数**: $TOTAL_FILES
**变更**: +$ADDED / -$DELETED

## 目录结构

$(find . -type d -not -path "*/\.git/*" -not -path "*/node_modules/*" | sort | head -60)

## 文件统计

$(find . -type f -not -path "*/\.git/*" -not -path "*/node_modules/*" | wc -l) 个文件

## 主要目录

$(ls -d */ 2>/dev/null | sort)

EOF

git add BACKUP_MANIFEST.txt
git commit -m "📋 更新备份清单" || true
git push origin main

exit 0
