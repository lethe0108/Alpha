---
name: self-evolution-session-new
description: "新会话创建时检查技能更新和学习机会"
metadata:
  {
    "openclaw":
      {
        "emoji": "🧬",
        "events": ["command:new"],
        "requires": { "bins": ["python3"] },
        "always": false,
      },
  }
---

# 新会话 Hook

## 功能

新会话创建时：
1. 检查是否有新的技能更新
2. 分析用户历史，识别学习机会
3. 提供个性化建议

## 触发条件

- 事件: `command:new`
- 频率: 每次创建新会话

## 执行逻辑

```
新会话创建
    ↓
检查技能更新
    ↓
分析用户模式
    ↓
如果有学习机会
    ↓
提供建议
```

## 配置

```json
{
  "self_evolution": {
    "analyze_on_new_session": true,
    "suggest_learning": true
  }
}
```
