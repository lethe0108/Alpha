#!/bin/bash
# ~/.openclaw/scripts/check-self-improving-custom.sh
# 检查 self-improving 技能的自定义修改是否完整

set -e

SKILL_FILE="$HOME/.openclaw/skills/self-improving/SKILL.md"
WATCH_LIST="$HOME/.openclaw/workspace/memory/WATCH_LIST.md"

echo "🔍 检查 self-improving 自定义修改..."
echo ""

# 检查文件是否存在
if [ ! -f "$SKILL_FILE" ]; then
  echo "❌ 技能文件不存在：$SKILL_FILE"
  exit 1
fi

# 检查版本
VERSION=$(grep "**版本**" $SKILL_FILE | head -1 || echo "")
if [[ $VERSION == *"1.1.0"* ]] && [[ $VERSION == *"自定义增强版"* ]]; then
  echo "✅ 版本正确：1.1.0 (自定义增强版)"
else
  echo "❌ 版本异常：可能被覆盖"
  echo "   当前：$VERSION"
  echo "   预期：**版本**: 1.1.0 (自定义增强版)"
  echo ""
  echo "🔴 问题已触发！参考：$WATCH_LIST"
  exit 1
fi

# 检查桥接规则
if grep -q "桥接规则" $SKILL_FILE; then
  echo "✅ 桥接规则存在"
else
  echo "❌ 桥接规则丢失"
  echo "🔴 问题已触发！参考：$WATCH_LIST"
  exit 1
fi

# 检查作用域
if grep -q "检索时读取原生记忆" $SKILL_FILE; then
  echo "✅ 作用域更新存在"
else
  echo "❌ 作用域更新丢失"
  echo "🔴 问题已触发！参考：$WATCH_LIST"
  exit 1
fi

# 检查检索流程
if grep -q "标准检索流程" $SKILL_FILE; then
  echo "✅ 检索流程存在"
else
  echo "❌ 检索流程丢失"
  echo "🔴 问题已触发！参考：$WATCH_LIST"
  exit 1
fi

# 检查核心规则 10
if grep -q "原生记忆桥接" $SKILL_FILE; then
  echo "✅ 核心规则 10 (原生记忆桥接) 存在"
else
  echo "❌ 核心规则 10 丢失"
  echo "🔴 问题已触发！参考：$WATCH_LIST"
  exit 1
fi

echo ""
echo "✅ 所有自定义修改完整"
echo ""
echo "📊 检查摘要:"
echo "   版本：1.1.0 (自定义增强版)"
echo "   桥接规则：✅"
echo "   作用域更新：✅"
echo "   检索流程：✅"
echo "   核心规则 10: ✅"
echo ""
echo "💡 提示：技能更新后请重新运行此检查"
echo "   参考文档：$WATCH_LIST"

exit 0
