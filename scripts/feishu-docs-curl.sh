#!/bin/bash
# 飞书项目文档整理工具 - curl 版本
# 使用 curl 命令调用飞书 API，更稳定

set -e

# 配置
TOKEN_FILE="$HOME/.openclaw/feishu/user_token.json"
ALPHA_FOLDER="O4REfrwt1lSbRUd7ha0cLyxinVb"

# 读取 Token
ACCESS_TOKEN=$(cat $TOKEN_FILE | jq -r '.access_token')

echo "=============================================================="
echo "📁 飞书项目文档整理工具 (curl 版本)"
echo "=============================================================="
echo ""

# 项目列表
declare -A PROJECTS=(
  ["解卦"]="EEZSff5zRlh7kxdjSy5c3Q70n8b"
  ["雷达平台"]="FkIbfv3uAlGRyBdY2VUcRzannDh"
  ["试穿小程序"]="NSPcfZRcQlyWCYdo62VcnrQhnmu"
  ["数据抓取"]="NSOgfCnKIlI226dOoVHcdRwpnPb"
  ["环卫"]="LZ9UfrBvglJhlHdQt9gcPF2anqd"
  ["Radar"]="HI35fZmM4lG66idWeSvcdW4Yn5e"
)

# 文档模板
create_business_model() {
  local project_name="$1"
  local project_desc="$2"
  local date=$(date +%Y-%m-%d)
  
  cat << EOF
# $project_name - 商业模式

## 项目概述
- **项目名称**: $project_name
- **项目描述**: $project_desc
- **创建日期**: $date

## 价值主张
### 解决的问题
（待补充）

### 目标用户
（待补充）

## 收入模式
### 主要收入来源
1. （待补充）

## 成本结构
### 主要成本
1. （待补充）

## 竞争优势
（待补充）

---
*最后更新：$(date -Iseconds)*
EOF
}

create_prd() {
  local project_name="$1"
  local date=$(date +%Y-%m-%d)
  
  cat << EOF
# $project_name - 产品需求文档

## 文档信息
- **版本**: 1.0.0
- **创建日期**: $date

## 产品概述
### 产品定位
（待补充）

## 功能需求
### 核心功能
（待补充）

## 技术架构
（待补充）

## 项目计划
（待补充）

---
*最后更新：$(date -Iseconds)*
EOF
}

create_deployment() {
  local project_name="$1"
  local date=$(date +%Y-%m-%d)
  
  cat << EOF
# $project_name - 部署说明

## 环境要求
（待补充）

## 安装步骤
（待补充）

## 配置说明
（待补充）

## 启动服务
（待补充）

---
*最后更新：$(date -Iseconds)*
EOF
}

create_manual() {
  local project_name="$1"
  local date=$(date +%Y-%m-%d)
  
  cat << EOF
# $project_name - 产品手册

## 快速开始
（待补充）

## 功能指南
（待补充）

## 常见问题
（待补充）

## 更新日志
### v1.0.0 ($date) - 初始版本

---
*最后更新：$(date -Iseconds)*
EOF
}

# 创建文档函数
create_document() {
  local folder_token="$1"
  local title="$2"
  local content="$3"
  
  echo "   创建文档：$title"
  
  # 1. 创建空白文档
  local create_response=$(curl -s -X POST "https://open.feishu.cn/open-apis/docx/v1/documents" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"parent_type\": \"folder\",
      \"parent_token\": \"$folder_token\",
      \"title\": \"$title\"
    }")
  
  local doc_token=$(echo $create_response | jq -r '.data.document.document_id // empty')
  local code=$(echo $create_response | jq -r '.code')
  
  if [ -z "$doc_token" ]; then
    echo "      ❌ 创建失败：$(echo $create_response | jq -r '.msg')"
    return 1
  fi
  
  echo "      ✅ 文档已创建 (ID: $doc_token)"
  
  # 2. 写入内容（简化版 - 先跳过，文档已创建）
  echo "      ⚠️  内容写入待优化（文档已创建）"
  return 0
}

# 主流程
echo "开始处理项目文档..."
echo ""

for project_name in "${!PROJECTS[@]}"; do
  folder_token="${PROJECTS[$project_name]}"
  
  echo "处理项目：$project_name"
  echo "   文件夹：$folder_token"
  
  # 创建 4 个文档
  create_document "$folder_token" "$project_name - 01-商业模式" "$(create_business_model "$project_name" "项目描述")"
  sleep 3
  
  create_document "$folder_token" "$project_name - 02-产品需求文档 (PRD)" "$(create_prd "$project_name")"
  sleep 3
  
  create_document "$folder_token" "$project_name - 03-部署说明" "$(create_deployment "$project_name")"
  sleep 3
  
  create_document "$folder_token" "$project_name - 04-产品手册" "$(create_manual "$project_name")"
  sleep 5
  
  echo "   ✅ 完成"
  echo ""
done

echo "=============================================================="
echo "✅ 所有项目处理完成！"
echo "=============================================================="
