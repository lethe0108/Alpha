---
name: self-evolution-message-received
description: "收到消息时分析用户需求，识别技能改进机会"
metadata:
  {
    "openclaw":
      {
        "emoji": "🧬",
        "events": ["message:received"],
        "requires": { "bins": ["python3"] },
        "always": false,
      },
  }
---

# 消息接收 Hook

## 功能

收到用户消息时：
1. 分析消息内容
2. 识别未满足的需求
3. 记录技能改进机会
4. 累积到一定数量后建议创建新技能

## 触发条件

- 事件: `message:received`
- 频率: 每次收到消息

## 执行逻辑

```
收到消息
    ↓
内容分析
    ↓
识别模式
    ↓
记录到改进日志
    ↓
如果达到阈值
    ↓
建议创建技能
```

## 配置

```json
{
  "self_evolution": {
    "analyze_messages": true,
    "improvement_threshold": 10
  }
}
```
