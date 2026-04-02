# 🌐 全局网络搜索技能

> **版本**: 1.0.0  
> **创建时间**: 2026-03-17  
> **作用域**: 全局 (所有 Session 和 Agent)  
> **状态**: ✅ 全局激活

---

## 📋 技能概述

为所有 OpenClaw Session 和 Agent 提供全局网络搜索能力，无需单独配置即可使用。

### 核心能力
1. **Brave Search API** - 快速、准确的搜索结果
2. **全局可用** - 所有 Session 和 Agent 自动继承
3. **智能搜索** - 支持多种搜索参数和过滤
4. **内容提取** - 从 URL 提取可读内容

---

## 🔧 配置方式

### 1. 环境变量配置

在 Gateway 环境中设置：

```bash
# Brave Search API Key
export BRAVE_API_KEY="your_brave_api_key_here"

# 或者通过 OpenClaw 配置
openclaw configure --section web
```

### 2. 全局技能注册

本技能已放置在 `/root/.openclaw/skills/web-search-global/`，自动对所有 Session 生效。

---

## 🛠️ 可用工具

### web_search - 搜索网络

**描述**: 使用 Brave Search API 搜索网络内容

**参数**:
```json
{
  "query": "搜索关键词 (必填)",
  "count": 10,              // 结果数量 (1-10)
  "country": "US",          // 国家代码 (可选)
  "language": "en",         // 语言代码 (可选)
  "freshness": "week",      // 时间过滤：day/week/month/year (可选)
  "date_after": "2025-01-01",  // 发布日期之后 (可选)
  "date_before": "2025-12-31", // 发布日期之前 (可选)
  "search_lang": "en",      // 搜索结果语言 (可选)
  "ui_lang": "en-US"        // UI 语言 (可选)
}
```

**使用示例**:
```python
# 基本搜索
web_search(query="AI agent frameworks 2025")

# 限定时间范围
web_search(query="AI news", freshness="week")

# 限定语言和国家
web_search(query="人工智能", country="CN", language="zh")

# 获取特定数量结果
web_search(query="machine learning", count=5)
```

**返回格式**:
```json
{
  "results": [
    {
      "title": "页面标题",
      "url": "https://example.com",
      "snippet": "搜索结果摘要",
      "date": "2025-03-17"
    }
  ],
  "total": 10
}
```

---

### web_fetch - 提取网页内容

**描述**: 从 URL 提取可读内容 (HTML → Markdown/Text)

**参数**:
```json
{
  "url": "https://example.com",  // 目标 URL (必填)
  "maxChars": 5000,              // 最大字符数 (可选)
  "extractMode": "markdown"      // 提取模式：markdown/text (可选)
}
```

**使用示例**:
```python
# 提取网页内容为 Markdown
web_fetch(url="https://example.com/article")

# 提取纯文本
web_fetch(url="https://example.com/news", extractMode="text")

# 限制字符数
web_fetch(url="https://example.com/long-article", maxChars=3000)
```

**返回格式**:
```json
{
  "url": "https://example.com",
  "title": "文章标题",
  "text": "提取的文本内容...",
  "markdown": "# 标题\n\n内容...",
  "status": 200
}
```

---

## 📚 使用场景

### 1. 研究和学习
```
- 搜索最新技术动态
- 查找文档和教程
- 了解行业趋势
- 竞品分析
```

### 2. 开发支持
```
- 搜索技术问题和解决方案
- 查找 API 文档
- 了解最佳实践
- 获取代码示例
```

### 3. 内容创作
```
- 收集素材和参考
- 验证信息和数据
- 了解热点话题
- 获取灵感
```

### 4. 数据分析
```
- 收集市场信息
- 竞品调研
- 用户反馈分析
- 行业报告
```

---

## 🔐 安全和限制

### API Key 管理
- API Key 存储在 Gateway 环境变量
- 所有 Session 共享同一个 Key
- 不会在日志中显示完整 Key

### 使用限制
```
- 搜索次数：取决于 API Key 配额
- 并发请求：建议串行使用
- 结果数量：单次最多 10 条
- 内容长度：默认 5000 字符
```

### 注意事项
1. **外部内容**: 搜索结果来自外部网站，需验证准确性
2. **安全风险**: 不要访问可疑网站
3. **隐私保护**: 不要搜索敏感信息
4. **频率限制**: 避免短时间内大量请求

---

## 🎯 最佳实践

### 1. 精确搜索
```python
# ❌ 模糊搜索
web_search(query="AI")

# ✅ 精确搜索
web_search(query="AI agent frameworks for multi-agent collaboration 2025")
```

### 2. 时间过滤
```python
# 获取最新信息
web_search(query="LLM breakthrough", freshness="month")
```

### 3. 多语言搜索
```python
# 中文搜索
web_search(query="人工智能 Agent", country="CN", language="zh")

# 英文搜索
web_search(query="AI Agent", country="US", language="en")
```

### 4. 内容验证
```python
# 搜索多个来源验证
results1 = web_search(query="技术名称 + 官方文档")
results2 = web_search(query="技术名称 + 教程")

# 提取详细内容
content = web_fetch(url=results1[0]['url'])
```

---

## 📊 监控和统计

### 使用统计
```python
# 记录搜索次数
# 记录搜索主题
# 记录成功率
```

### 性能优化
```python
# 缓存热门搜索结果
# 批量搜索相关主题
# 避免重复搜索
```

---

## 🔗 相关资源

### Brave Search API
- **文档**: https://brave.com/search/api/
- **定价**: https://brave.com/search/api/pricing/
- **状态**: https://status.brave.com/

### OpenClaw 配置
- **文档**: https://docs.openclaw.ai/tools/web
- **配置**: `openclaw configure --section web`

---

## 🆘 故障排除

### 常见问题

**1. API Key 错误**
```
错误：missing_brave_api_key
解决：运行 openclaw configure --section web
```

**2. 搜索结果为空**
```
可能原因：关键词太偏门
解决：尝试更通用的关键词或调整参数
```

**3. 内容提取失败**
```
可能原因：网站反爬虫或需要登录
解决：尝试其他来源或手动访问
```

---

## 📝 更新日志

### v1.0.0 (2026-03-17)
- ✅ 初始版本
- ✅ 全局技能配置
- ✅ web_search 工具
- ✅ web_fetch 工具
- ✅ 文档和使用示例

---

*全局生效 - 所有 Session 和 Agent 自动可用*  
*最后更新：2026-03-17*
