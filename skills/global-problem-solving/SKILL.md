# OpenClaw 全局问题解决技能

> **技能等级**: OpenClaw 全局 (最高优先级)  
> **创建时间**: 2026-03-26 01:34  
> **适用**: 所有 Agent、所有 Session、所有渠道  
> **状态**: ✅ 激活

---

## 🎯 技能目标

建立智能问题解决机制，通过失败计数、搜索升级、自我验证，确保高质量解决方案输出，同时避免不必要的用户打扰。

---

## 📊 核心机制

### 1️⃣ 失败计数系统

#### 计数规则

| 计数类型 | 触发条件 | 计数方式 |
|---------|---------|---------|
| **连续失败** | 相同方法连续失败 | 每次失败 +1，成功重置 |
| **累计失败** | 同一问题所有尝试 | 每次失败 +1，问题解决后重置 |

#### 计数存储

**文件位置**: `/root/.openclaw/memory/failure-tracker.json`

```json
{
  "problems": {
    "问题唯一标识": {
      "description": "问题描述",
      "attempts": [
        {
          "method": "使用的方法",
          "timestamp": "2026-03-26T01:34:00+08:00",
          "result": "failed",
          "error": "错误信息"
        }
      ],
      "consecutiveFailures": 2,
      "totalFailures": 3,
      "status": "solving",
      "createdAt": "2026-03-26T01:30:00+08:00",
      "updatedAt": "2026-03-26T01:34:00+08:00"
    }
  }
}
```

#### 问题唯一标识生成

```python
# 使用问题描述 + 时间戳哈希
problem_id = hash(question_description + context_hash)
```

---

### 2️⃣ 搜索升级策略

#### 失败阈值触发

| 条件 | 阈值 | 行动 |
|------|------|------|
| **连续失败** | ≥ 3 次 | 丢弃当前方案，切换搜索策略 |
| **累计失败** | ≥ 4 次 | 丢弃当前方案，切换搜索策略 |

#### 搜索升级流程

```
┌─────────────────────────────────────────────────────────┐
│                    问题/任务开始                        │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
            ┌─────────────────────┐
            │  第 1 次尝试解决      │
            │  (常规方法/已知技能)  │
            └─────────┬───────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
    ✅ 成功                    ❌ 失败
    结束问题                  记录失败计数
                              更新 failure-tracker.json
                                    │
                                    ▼
                          ┌─────────────────────┐
                          │  检查失败阈值        │
                          │  连续≥3 或 累计≥4？   │
                          └─────────┬───────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
              未达到阈值                      达到阈值
              继续尝试                        丢弃当前方案
              (最多 4 次)                        │
                                              ▼
                                    ┌─────────────────────┐
                                    │  使用 multi-search   │
                                    │  国内搜索引擎        │
                                    │  (百度/必应/搜狗等)  │
                                    └─────────┬───────────┘
                                              │
                                    ┌─────────┴─────────┐
                                    │                   │
                                    ▼                   ▼
                              ✅ 找到方案          ❌ 无有效方案
                              自我验证              │
                                                    ▼
                                          ┌─────────────────────┐
                                          │  使用代理搜索        │
                                          │  国外搜索引擎        │
                                          │  (Google/Bing 等)    │
                                          └─────────┬───────────┘
                                                    │
                                          ┌─────────┴─────────┐
                                          │                   │
                                          ▼                   ▼
                                    ✅ 找到方案          ❌ 仍无方案
                                    自我验证              │
                                                          ▼
                                                ┌─────────────────────┐
                                                │  必须用户协助        │
                                                │  通知用户            │
                                                └─────────────────────┘
```

---

### 3️⃣ 搜索引擎使用规范

#### 国内搜索引擎（优先）

**工具**: `multi-search-engine` 技能

| 引擎 | 适用场景 | 优先级 |
|------|---------|--------|
| 百度 | 中文问题、国内产品 | 1 |
| 必应 (国内) | 技术问题、通用搜索 | 2 |
| 搜狗 | 微信公众号内容 | 3 |
| 360 搜索 | 补充搜索 | 4 |

**搜索提示词模板**:
```
[问题描述] + 解决方案 + site:cn + 最新
[错误信息] + 如何解决 + 2026
[产品名] + 配置方法 + 教程
```

#### 国外搜索引擎（代理）

**触发条件**: 国内搜索无有效结果 或 触发失败阈值

| 引擎 | 适用场景 | 代理要求 |
|------|---------|---------|
| Google | 技术问题、开源项目 | ✅ 必须代理 |
| Bing (国际) | 通用搜索 | ✅ 必须代理 |
| DuckDuckGo | 隐私搜索 | ✅ 必须代理 |

**搜索提示词模板**:
```
[error message] + solution + 2026
[product name] + configuration + tutorial
how to fix [problem] + stackoverflow
```

---

### 4️⃣ 用户通知条件

#### ❌ 禁止通知的情况

| 情况 | 原因 |
|------|------|
| 正在尝试解决方案 | 避免打扰用户 |
| 搜索进行中 | 等待结果 |
| 自我验证中 | 确保质量 |
| 失败次数未达阈值 | 继续自主解决 |

#### ✅ 必须通知的情况

| 情况 | 通知内容 |
|------|---------|
| **搜索无结果** | 国内外搜索均未找到有效方案 |
| **需要权限** | 需要用户授权/确认/决策 |
| **涉及安全** | 敏感操作需要用户确认 |
| **核心原则冲突** | 可能违反核心原则 |
| **用户明确要求** | 用户要求实时汇报 |

#### 通知格式

```markdown
## ⚠️ 需要您的协助

**问题**: [问题描述]

**已尝试方案**:
1. [方案 1] - ❌ 失败原因
2. [方案 2] - ❌ 失败原因
3. [方案 3] - ❌ 失败原因
4. [方案 4] - ❌ 失败原因

**搜索结果**:
- 国内搜索：❌ 无有效结果
- 国外搜索：❌ 无有效结果

**需要您**:
- [ ] 提供更多信息
- [ ] 确认是否继续
- [ ] 提供权限/授权
- [ ] 其他：xxx

**建议**: [小 p 的建议]
```

---

### 5️⃣ 自我验证流程

#### 验证步骤（必须执行）

```
找到解决方案
      │
      ▼
┌─────────────────────────────────┐
│  Step 1: 复盘推理               │
│  - 方案来源是否可靠？           │
│  - 是否匹配问题场景？           │
│  - 是否有潜在风险？             │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  Step 2: 检查验证               │
│  - 方案步骤是否完整？           │
│  - 依赖条件是否满足？           │
│  - 是否有冲突/矛盾？            │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  Step 3: 调整优化               │
│  - 简化复杂步骤                 │
│  - 补充遗漏细节                 │
│  - 添加注意事项                 │
└─────────────┬───────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│  Step 4: 质量评分               │
│  - 完整性：⭐⭐⭐⭐⭐            │
│  - 准确性：⭐⭐⭐⭐⭐            │
│  - 可执行性：⭐⭐⭐⭐⭐          │
│  平均分 ≥ 4 星 → 输出            │
│  平均分 < 4 星 → 重新搜索        │
└─────────────────────────────────┘
```

#### 验证清单

```markdown
## 解决方案自我验证清单

- [ ] 来源可靠性确认（官方文档/高票答案/多次验证）
- [ ] 方案与问题匹配度 ≥ 80%
- [ ] 无安全风险
- [ ] 步骤完整可执行
- [ ] 依赖条件已说明
- [ ] 已补充注意事项
- [ ] 已简化复杂步骤
- [ ] 质量评分 ≥ 4 星

**验证人**: 小 p
**验证时间**: [timestamp]
```

---

### 6️⃣ 高效执行原则

#### 允许的方式（不触犯核心原则）

| 方式 | 说明 | 示例 |
|------|------|------|
| **并行尝试** | 同时尝试多个方案 | 同时测试 2-3 种配置 |
| **批量操作** | 减少 API 调用次数 | 批量写入而非单条 |
| **缓存复用** | 避免重复查询 | 缓存搜索结果 |
| **后台执行** | 不阻塞用户交互 | 后台下载/处理 |
| **智能预判** | 提前准备可能需要的资源 | 预加载常用数据 |

#### 禁止的方式（触犯核心原则）

| 方式 | 原因 |
|------|------|
| 擅自修改用户文件 | 违反隐私保护 |
| 未经确认的外部操作 | 违反安全原则 |
| 隐瞒失败/编造结果 | 违反诚实原则 |
| 绕过用户授权 | 违反边界原则 |

---

## 🛠️ 实现细节

### 失败追踪脚本

**位置**: `/root/.openclaw/scripts/failure-tracker.js`

```javascript
const fs = require('fs');
const path = require('path');

const TRACKER_FILE = path.join(__dirname, '../memory/failure-tracker.json');

class FailureTracker {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      return JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf8'));
    } catch (e) {
      return { problems: {}, lastCleanup: Date.now() };
    }
  }

  save() {
    fs.writeFileSync(TRACKER_FILE, JSON.stringify(this.data, null, 2));
  }

  recordFailure(problemId, description, method, error) {
    if (!this.data.problems[problemId]) {
      this.data.problems[problemId] = {
        description,
        attempts: [],
        consecutiveFailures: 0,
        totalFailures: 0,
        status: 'solving',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    const problem = this.data.problems[problemId];
    problem.attempts.push({
      method,
      timestamp: new Date().toISOString(),
      result: 'failed',
      error
    });
    problem.consecutiveFailures++;
    problem.totalFailures++;
    problem.updatedAt = new Date().toISOString();

    this.save();

    return {
      consecutiveFailures: problem.consecutiveFailures,
      totalFailures: problem.totalFailures,
      shouldUpgradeSearch: problem.consecutiveFailures >= 3 || problem.totalFailures >= 4
    };
  }

  recordSuccess(problemId, method) {
    if (this.data.problems[problemId]) {
      const problem = this.data.problems[problemId];
      problem.attempts.push({
        method,
        timestamp: new Date().toISOString(),
        result: 'success'
      });
      problem.consecutiveFailures = 0;
      problem.status = 'solved';
      problem.updatedAt = new Date().toISOString();
      this.save();
    }
  }

  shouldUpgradeSearch(problemId) {
    const problem = this.data.problems[problemId];
    if (!problem) return false;
    return problem.consecutiveFailures >= 3 || problem.totalFailures >= 4;
  }

  cleanup() {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    
    for (const [id, problem] of Object.entries(this.data.problems)) {
      if (now - new Date(problem.updatedAt).getTime() > sevenDays) {
        delete this.data.problems[id];
      }
    }
    this.data.lastCleanup = now;
    this.save();
  }
}

module.exports = FailureTracker;
```

---

### 定时清理任务

**位置**: `/root/.openclaw/cron/failure-tracker-cleanup.json`

```json
{
  "name": "failure-tracker-cleanup",
  "schedule": {
    "kind": "cron",
    "expr": "0 3 * * *",
    "tz": "Asia/Shanghai"
  },
  "payload": {
    "kind": "systemEvent",
    "text": "failure-tracker-cleanup"
  },
  "sessionTarget": "main",
  "enabled": true
}
```

---

## 📋 使用示例

### 示例 1: API 调用失败

```
问题：飞书 API 调用失败，返回 InvalidApiKey

尝试 1: 检查配置文件中的 API Key → ❌ Key 正确但仍失败
尝试 2: 重启 Gateway 服务 → ❌ 仍失败
尝试 3: 检查 API 端点 → ❌ 仍失败

连续失败 3 次 → 触发搜索升级

使用 multi-search-engine 搜索：
"飞书 InvalidApiKey 解决方案 site:cn"

找到方案：API Key 地域不匹配
验证：✅ 来源可靠（飞书官方文档）
调整：补充地域说明和 Key 获取步骤
输出：高质量解决方案
```

### 示例 2: 模型配置问题

```
问题：qwen-image-2.0-pro 无法生成图片

尝试 1: 使用 openai-completions API → ❌ 404
尝试 2: 更换 API 端点 → ❌ 仍失败
尝试 3: 检查 API Key → ❌ 仍失败
尝试 4: 累计失败 4 次 → 触发搜索升级

国内搜索：❌ 无有效结果
国外搜索（代理）：✅ 找到官方文档

找到方案：使用 multimodal-generation 接口
验证：✅ 阿里云官方文档
调整：补充完整请求格式和参数说明
输出：高质量解决方案
```

---

## 🎯 核心原则保护

### 不可打破的底线

| 原则 | 保护措施 |
|------|---------|
| **诚实** | 不隐瞒失败次数，不编造结果 |
| **验证** | 所有方案必须自我验证 |
| **隐私** | 不擅自访问用户私人数据 |
| **安全** | 敏感操作必须用户确认 |
| **边界** | 不代替用户做决策 |

---

## 📊 监控指标

| 指标 | 目标值 | 说明 |
|------|--------|------|
| 平均解决时间 | < 5 分钟 | 从问题到方案 |
| 搜索升级率 | < 20% | 触发搜索升级的问题比例 |
| 用户打扰率 | < 5% | 需要用户协助的问题比例 |
| 方案采纳率 | > 90% | 用户接受方案的比例 |
| 自我验证通过率 | > 95% | 验证通过并输出的方案 |

---

## 📚 相关文件

| 文件 | 用途 |
|------|------|
| `/root/.openclaw/memory/failure-tracker.json` | 失败计数存储 |
| `/root/.openclaw/scripts/failure-tracker.js` | 追踪脚本 |
| `/root/.openclaw/cron/failure-tracker-cleanup.json` | 定时清理 |
| `/root/.openclaw/skills/multi-search-engine/SKILL.md` | 搜索引擎技能 |

---

**技能创建完成！小 p 现在具备智能问题解决能力！** 🎉

---

*最后更新：2026-03-26 01:34*  
*创建者：小 p*
