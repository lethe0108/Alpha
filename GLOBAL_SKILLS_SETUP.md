# 🌐 全局技能配置完成

**配置时间**: 2026-03-17 14:30  
**状态**: ✅ 全局生效

---

## ✅ 已配置的全局技能

### 1. web-search-global (网络搜索)
- **路径**: `/root/.openclaw/skills/web-search-global/`
- **工具**: `web_search`, `web_fetch`
- **作用域**: 所有 Session 和 Agent
- **状态**: ✅ 激活

### 2. agent-orchestration (多 Agent 协作)
- **路径**: `/root/.openclaw/skills/agent-orchestration/`
- **工具**: `sessions_spawn`, `sessions_send`, `subagents`
- **作用域**: 所有 Session 和 Agent
- **状态**: ✅ 激活

### 3. context-engineering (上下文工程)
- **路径**: `/root/.openclaw/skills/context-engineering/`
- **工具**: `memory_search`, `memory_get`
- **作用域**: 所有 Session 和 Agent
- **状态**: ✅ 激活

### 4. multi-search-engine (多搜索引擎) ⭐ 新增
- **路径**: `/root/.openclaw/skills/multi-search-engine/`
- **工具**: `web_fetch` (配合 17 个搜索引擎 URL)
- **作用域**: 所有 Session 和 Agent
- **状态**: ✅ 激活
- **特点**: 无需 API key，支持百度、Google、DuckDuckGo 等 17 个引擎

---

## 🔧 配置方式

### 配置文件
- **全局技能列表**: `/root/.openclaw/config/skills.json`
- **技能加载器**: `/root/.openclaw/config/global_skills.py`

### 加载机制
```
1. Session 启动时自动加载全局技能
2. 子 Agent 自动继承父 Session 的技能
3. 技能优先级：global > agent > session
```

---

## 🎯 使用方式

### 所有 Session 自动可用

任何新创建的 Session 或 Agent 都可以直接使用：

```python
# 网络搜索
web_search(query="AI agent frameworks")

# 网页内容提取
web_fetch(url="https://example.com")

# 多 Agent 协作
sessions_spawn(task="...")

# 记忆搜索
memory_search(query="...")
```

### 无需额外配置

- ✅ 新 Session 自动继承
- ✅ 子 Agent 自动继承
- ✅ 无需每次配置
- ✅ 全局生效

---

## 📋 技能详情

### web-search-global

**功能**:
- Brave Search API 搜索
- 网页内容提取
- 多语言支持
- 时间过滤

**使用示例**:
```python
# 搜索最新信息
web_search(query="AI news 2025", freshness="week")

# 提取网页内容
web_fetch(url="https://example.com/article", extractMode="markdown")
```

### agent-orchestration

**功能**:
- 创建子 Agent
- Session 间通信
- Agent 管理

**使用示例**:
```python
# 创建子 Agent
sessions_spawn(task="开发功能", mode="session")

# 发送消息
sessions_send(sessionKey="xxx", message="进度如何？")
```

### context-engineering

**功能**:
- 记忆搜索
- 长期记忆管理
- 上下文优化

**使用示例**:
```python
# 搜索记忆
memory_search(query="项目进度")

# 获取详细内容
memory_get(path="MEMORY.md", lines=10)
```

---

## 🔐 安全和限制

### API Key 管理
- Brave API Key 存储在 Gateway 环境
- 所有 Session 共享
- 不在日志中显示

### 使用限制
```
- 搜索配额：取决于 API Key
- 并发请求：建议串行
- 结果数量：单次最多 10 条
```

---

## 📊 验证方式

### 检查技能加载

```bash
# 查看全局技能配置
cat /root/.openclaw/config/skills.json

# 查看技能文件
ls -la /root/.openclaw/skills/
```

### 测试技能可用性

在任何 Session 中测试：
```python
# 测试网络搜索
web_search(query="test")

# 测试记忆搜索
memory_search(query="test")
```

---

## 📝 配置历史

### 2026-03-17 14:30
- ✅ 创建 web-search-global 技能
- ✅ 配置全局技能列表
- ✅ 创建技能加载器
- ✅ 所有技能全局生效

---

## 🆘 故障排除

### 技能未加载

**检查**:
1. 技能文件是否存在
2. 配置文件是否正确
3. Session 是否重启

**解决**:
```bash
# 重启 Gateway
openclaw gateway restart

# 验证配置
cat /root/.openclaw/config/skills.json
```

### API Key 错误

**检查**:
```bash
# 查看 API Key 配置
openclaw configure --section web
```

---

## 📞 相关文档

- [网络搜索技能](/root/.openclaw/skills/web-search-global/SKILL.md)
- [多 Agent 协作](/root/.openclaw/skills/agent-orchestration/SKILL.md)
- [上下文工程](/root/.openclaw/skills/context-engineering/SKILL.md)

---

*配置完成 - 所有 Session 和 Agent 自动可用!* 🎉
