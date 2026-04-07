---
name: self-evolution-gateway-startup
description: "Gateway 启动时检查自我进化状态，如有需要执行能力评估"
metadata:
  {
    "openclaw":
      {
        "emoji": "🧬",
        "events": ["gateway:startup"],
        "requires": { "bins": ["python3"] },
        "always": false,
      },
  }
---

# Gateway 启动 Hook

## 功能

Gateway 启动时自动检查：
1. 上次能力评估时间
2. 是否需要执行新的评估
3. 技能更新状态

## 触发条件

- 事件: `gateway:startup`
- 频率: 每次 Gateway 启动

## 执行逻辑

```
Gateway 启动
    ↓
检查上次评估时间
    ↓
如果超过 7 天
    ↓
执行能力评估
    ↓
记录结果到 memory/
```

## 配置

在 `~/.openclaw/config/user_profile.json` 中配置：

```json
{
  "self_evolution": {
    "auto_assessment_on_startup": true,
    "assessment_interval_days": 7
  }
}
```
