---
name: multi-search-engine
description: 17 个搜索引擎集成，无需 API key 即可进行网络搜索。支持国内 8 个引擎和国际 9 个引擎，内置自动代理访问国外网站。OpenClaw 全局唯一允许的搜索工具。
version: 3.1.0 (全局最高优先级版)
scope: global
priority: 1
triggers:
  - 用户请求搜索网络信息
  - 需要验证事实或查找资料
  - 需要访问国外网站（自动启用代理）
  - 任何需要网络搜索的场景（web_search 已禁用）
dependencies:
  - web_fetch (网页内容提取)
  - exec (代理诊断命令)
metadata:
  author: OpenClaw Team
  created: 2026-03-17
  updated: 2026-03-27 23:53
  tags: [搜索，网络，代理，研究，全局唯一]
---

# 🌐 多搜索引擎技能 (Multi-Search-Engine)

> **版本**: 3.1.0 (全局最高优先级版)  
> **作用域**: 全局 (所有 Session 和 Agent)  
> **优先级**: 1（最高优先级，与 core-principles 同级）  
> **状态**: ✅ 激活  
> **核心优势**: 零 API 依赖 + 自动代理 + 17 个搜索引擎 + 全局唯一搜索工具

---

## ⚠️ 重要声明（最高优先级）

**web_search 工具已全局禁用**:
- ❌ web_search 工具已永久禁用
- ✅ multi-search-engine 是全局唯一允许的搜索工具
- 🔒 此规则适用于所有 Session、Agent、渠道
- 📋 适用范围：飞书、QQ、网页、Discord、Telegram 等所有渠道

---

## 📋 技能概述

整合 17 个搜索引擎的网络爬虫能力，无需任何 API key 即可进行网络搜索。通过 `web_fetch` 工具抓取搜索结果页面，内置智能代理检测，访问国外网站时自动启用代理。

**OpenClaw 全局唯一允许的搜索工具**。

### 核心能力
1. **17 个搜索引擎** - 国内 8 个 + 国际 9 个，覆盖全球内容
2. **零 API 依赖** - 无需注册或配置 API key，开箱即用
3. **智能代理** - 自动检测国外网站，无缝切换代理
4. **高级搜索语法** - 支持 site:、filetype:、时间过滤等
5. **多引擎验证** - 交叉验证信息来源，提高准确性

### 使用场景
- ✅ **研究和学习**: 搜索最新技术动态、查找文档和教程
- ✅ **开发支持**: 搜索技术问题和解决方案、查找 API 文档
- ✅ **内容创作**: 收集素材和参考、验证信息和数据
- ✅ **数据分析**: 收集市场信息、竞品调研
- ✅ **跨境访问**: 访问 Google、GitHub 等国外网站（自动代理）

### 不适用场景
- ❌ **实时性要求极高**: 搜索结果可能有几分钟延迟
- ❌ **需要 API 结构化数据**: 本技能返回网页内容，非结构化 API
- ❌ **大量并发请求**: 建议串行使用，避免触发反爬虫

---

## 🎯 触发条件

### 自动触发
```
当满足以下条件时，技能自动激活：
- 用户明确请求搜索： "搜索...", "查找...", "帮我找..."
- 需要事实验证： "确认一下...", "是真的吗？"
- 需要最新信息： "最新的...", "2026 年的..."
- 访问国外网站：URL 包含 google.com, github.com 等
```

### 手动触发
```
用户可以通过以下方式手动触发：
- 关键词：`搜索`, `查找`, `web_search`, `google`
- 命令：直接使用 web_fetch 工具
- API: 调用 web_fetch(url="搜索 URL")
```

### 优先级规则
```
与其他技能的优先级关系：
- 低于：core-principles (核心原则)
- 低于：user-profile (用户配置)
- 高于：agent-orchestration (协作编排)
- 冲突处理：隐私信息搜索需先通过身份验证
```

---

## 🔧 配置和依赖

### 必需配置
```json
{
  "required_settings": {
    "proxy_enabled": true,
    "proxy_http": "http://127.0.0.1:10809",
    "proxy_socks5": "socks5://127.0.0.1:10808"
  }
}
```

### 可选配置
```json
{
  "optional_settings": {
    "default_engine": "google",
    "timeout_seconds": 30,
    "max_retries": 3,
    "retry_delay_seconds": 2,
    "user_agent": "Mozilla/5.0 (compatible; OpenClaw Bot)"
  }
}
```

### 外部依赖
- 工具：`web_fetch` (网页内容提取)
- 工具：`exec` (代理诊断命令)
- 配置：`/root/.openclaw/config/user_profile.json` (代理配置)

---

## 📥 输入定义

### 参数格式 (web_fetch 工具)
```json
{
  "parameters": {
    "url": {
      "type": "string",
      "required": true,
      "description": "搜索引擎结果页面 URL",
      "example": "https://www.google.com/search?q=AI+agents"
    },
    "maxChars": {
      "type": "number",
      "required": false,
      "default": 5000,
      "description": "最大提取字符数"
    },
    "extractMode": {
      "type": "string",
      "required": false,
      "default": "markdown",
      "enum": ["markdown", "text"],
      "description": "提取模式"
    }
  }
}
```

### 输入验证
```
验证规则:
- URL 必须以 http:// 或 https:// 开头
- URL 必须包含支持的搜索引擎域名
- URL 长度不超过 2048 字符

验证失败处理:
- 处理方式：返回错误消息，提供正确示例
- 错误消息："无效的搜索 URL。示例：https://www.google.com/search?q=关键词"
```

---

## 📤 输出定义

### 标准输出格式
```json
{
  "output": {
    "status": "success|error|partial",
    "data": {
      "url": "原始 URL",
      "title": "页面标题",
      "text": "提取的文本内容",
      "markdown": "Markdown 格式内容",
      "search_results": [
        {
          "title": "结果标题",
          "url": "结果链接",
          "snippet": "结果摘要"
        }
      ]
    },
    "metadata": {
      "timestamp": "ISO8601",
      "execution_time_ms": 0,
      "source": "multi-search-engine",
      "engine_used": "google|baidu|...",
      "proxy_used": true|false
    }
  }
}
```

### 输出示例
```json
{
  "status": "success",
  "data": {
    "url": "https://www.google.com/search?q=AI+agents",
    "title": "AI agents - Google 搜索",
    "text": "搜索结果内容...",
    "search_results": [
      {
        "title": "什么是 AI Agent？",
        "url": "https://example.com/ai-agent",
        "snippet": "AI Agent 是..."
      }
    ]
  },
  "metadata": {
    "timestamp": "2026-03-20T10:00:00Z",
    "execution_time_ms": 1250,
    "engine_used": "google",
    "proxy_used": true
  }
}
```

---

## 🔄 执行流程

### 步骤 1: URL 构建和验证
```
输入：搜索关键词或完整 URL
处理:
  1. 检查输入是否为完整 URL
  2. 如果是关键词，根据默认引擎构建 URL
  3. 验证 URL 格式和域名
输出：验证通过的 URL
验证：URL 是否以 http(s)://开头，是否包含支持的域名
```

### 步骤 2: 代理检测
```
输入：验证通过的 URL
处理:
  1. 检查域名是否在代理列表中
  2. 判断是否需要使用代理
决策点:
  - 如果是国外网站 (google.com, github.com 等): 启用代理
  - 如果是国内网站 (baidu.com, zhihu.com 等): 直连
输出：代理配置标志
验证：代理配置是否正确
```

### 步骤 3: 网页抓取
```
输入：URL + 代理配置
处理:
  1. 设置请求头（User-Agent 等）
  2. 配置代理（如需要）
  3. 发送 HTTP 请求
  4. 处理响应（状态码检查）
决策点:
  - 如果状态码 200: 继续处理
  - 如果状态码 4xx/5xx: 重试或切换引擎
  - 如果超时：重试，最多 3 次
输出：原始 HTML 内容
验证：内容是否非空，是否包含预期数据
```

### 步骤 4: 内容提取
```
输入：原始 HTML 内容
处理:
  1. 使用 Readability 算法提取主要内容
  2. 清理广告和无关元素
  3. 转换为 Markdown 或纯文本
  4. 提取搜索结果列表（标题、链接、摘要）
输出：结构化内容
验证：提取的内容是否包含关键信息
```

### 步骤 5: 结果处理
```
输入：结构化内容
处理:
  1. 格式化输出
  2. 添加元数据（时间、引擎、代理状态）
  3. 记录日志
输出：最终结果
验证：输出格式是否符合标准
```

### 完整流程图
```
开始 → URL 构建 → 代理检测 → 网页抓取 → 内容提取 → 结果处理 → 结束
                            ↓           ↓
                        重试机制    错误处理
                            ↓           ↓
                        切换引擎    返回错误
```

---

## ⚠️ 错误处理

### 已知错误类型
| 错误代码 | 错误类型 | 触发条件 | 处理策略 |
|---------|---------|---------|---------|
| E001 | URL 无效 | URL 格式错误或不支持 | 返回错误消息，提供正确示例 |
| E002 | 代理失败 | 代理服务未启动 | 尝试备用代理，或降级为直连 |
| E003 | 请求超时 | 网络延迟或网站响应慢 | 重试 3 次，失败后切换引擎 |
| E004 | 反爬虫拦截 | 触发网站反爬虫机制 | 降低请求频率，更换 User-Agent |
| E005 | 内容为空 | 搜索结果页面为空 | 尝试其他关键词或引擎 |
| E006 | 提取失败 | 页面结构复杂无法解析 | 降级为原始 HTML 返回 |

### 错误处理流程
```
检测到错误
    ↓
分类错误类型 (E001-E006)
    ↓
执行对应处理策略
    ↓
记录错误日志 (包含错误代码、URL、时间戳)
    ↓
返回用户友好的错误消息
```

### 降级策略
```
当主要功能不可用时：
1. 尝试备用代理 (HTTP → SOCKS5)
2. 切换搜索引擎 (Google → Bing → DuckDuckGo)
3. 返回缓存数据（如果可用且未过期）
4. 返回友好错误消息 + 建议操作
```

---

## 📊 监控和日志

### 关键指标
- **成功率**: 执行成功次数 / 总执行次数（目标：>95%）
- **平均执行时间**: 从开始到结束的平均耗时（目标：<3 秒）
- **错误率**: 各类错误的分布（监控 E001-E006）
- **使用频率**: 每日/每周调用次数
- **代理使用率**: 使用代理的请求占比

### 日志格式
```json
{
  "timestamp": "2026-03-20T10:00:00Z",
  "skill_name": "multi-search-engine",
  "action": "search",
  "input": {"url": "https://www.google.com/search?q=..."},
  "output": {"status": "success", "result_count": 10},
  "duration_ms": 1250,
  "engine_used": "google",
  "proxy_used": true,
  "error_code": null
}
```

### 审计要求
- 记录所有搜索请求的 URL（不记录搜索内容）
- 记录所有代理使用情况
- 记录所有错误和异常
- 保留日志 30 天

---

## 🧪 测试用例

### 单元测试
```python
# 测试用例 1: Google 搜索（需要代理）
def test_google_search():
    url = "https://www.google.com/search?q=test"
    result = web_fetch(url=url)
    assert result.status == 200
    assert len(result.text) > 0

# 测试用例 2: 百度搜索（直连）
def test_baidu_search():
    url = "https://www.baidu.com/s?wd=测试"
    result = web_fetch(url=url)
    assert result.status == 200
    assert "百度" in result.text

# 测试用例 3: 无效 URL
def test_invalid_url():
    url = "not-a-valid-url"
    result = web_fetch(url=url)
    assert result.status != 200 or "error" in result

# 测试用例 4: 超时处理
def test_timeout_handling():
    url = "https://www.example.com/slow"
    result = web_fetch(url=url, timeout=5)
    # 应该超时并返回错误或降级结果
```

### 集成测试
```python
# 测试代理自动切换
def test_proxy_auto_switch():
    # 测试国外网站自动使用代理
    google_result = web_fetch(url="https://www.google.com/search?q=test")
    assert google_result.proxy_used == True
    
    # 测试国内网站直连
    baidu_result = web_fetch(url="https://www.baidu.com/s?wd=测试")
    assert baidu_result.proxy_used == False
```

### 性能测试
```python
# 测试执行时间
def test_performance():
    import time
    start = time.time()
    web_fetch(url="https://www.google.com/search?q=test")
    duration = time.time() - start
    assert duration < 5.0  # 5 秒内完成
```

---

## 📚 使用示例

### 示例 1: 基本搜索（自动代理）
```python
# 场景：搜索 AI Agent 最新资料
# Google 搜索 - 自动使用代理
result = web_fetch(url="https://www.google.com/search?q=AI+agent+frameworks+2026")

# 输出包含搜索结果和元数据
print(f"找到 {len(result.search_results)} 条结果")
print(f"使用代理：{result.metadata.proxy_used}")
```

### 示例 2: 多引擎验证
```python
# 场景：验证重要信息，使用多个引擎交叉验证
google = web_fetch(url="https://www.google.com/search?q=话题关键词")
baidu = web_fetch(url="https://www.baidu.com/s?wd=话题关键词")
duckduckgo = web_fetch(url="https://duckduckgo.com/html/?q=话题关键词")

# 对比不同引擎的结果
compare_results(google, baidu, duckduckgo)
```

### 示例 3: 高级搜索语法
```python
# 场景：在 GitHub 找 Python 项目（过去 1 年）
result = web_fetch(url="https://www.google.com/search?q=site:github.com+python+star:>100&tbs=qdr:y")

# 提取项目列表
projects = extract_projects(result.text)
```

### 示例 4: DuckDuckGo Bangs
```python
# 场景：直接搜索 Stack Overflow
result = web_fetch(url="https://duckduckgo.com/html/?q=!so+python+list+index+error")

# 获取解决方案
solutions = extract_solutions(result.text)
```

### 示例 5: 错误处理
```python
# 场景：处理可能的错误
try:
    result = web_fetch(url="https://www.google.com/search?q=test")
    if result.status == 200:
        process_result(result)
    else:
        # 降级处理
        fallback_search()
except Exception as e:
    log_error(e)
    notify_user("搜索失败，请稍后重试")
```

---

## 🔗 相关资源

### 内部文档
- [core-principles](../core-principles/SKILL.md) - 隐私保护原则
- [user-profile](../user-profile/SKILL.md) - 用户配置（含代理设置）
- [web-search-global.deprecated](../web-search-global.deprecated/SKILL.md) - 已弃用的 Brave 搜索技能

### 外部资源
- Google 搜索语法：https://support.google.com/websearch/answer/2466433
- DuckDuckGo Bangs: https://duckduckgo.com/bang
- WolframAlpha 示例：https://www.wolframalpha.com/examples/
- 高级搜索技巧：https://ahrefs.com/blog/google-advanced-search/

### 参考资料
- Anthropic Skills 最佳实践
- OpenClaw 技能开发文档
- 网络爬虫反反爬策略

---

## 📝 更新日志

### v3.0.0 (2026-03-20) - Anthropic 最佳实践优化版
- ✅ 重构为 Anthropic Skills 标准结构
- ✅ 明确触发条件和优先级
- ✅ 完善输入输出定义
- ✅ 结构化执行流程
- ✅ 增强错误处理和降级策略
- ✅ 添加监控和日志规范
- ✅ 补充测试用例
- 🔧 优化代理自动检测逻辑
- 🐛 修复部分网站无法访问问题

### v2.0.0 (2026-03-20)
- ✅ 新增自动代理支持
- ✅ 代理配置集成
- ✅ 故障排除指南

### v1.0.0 (2026-03-17)
- ✅ 初始版本
- ✅ 17 个搜索引擎集成
- ✅ 基本搜索功能

---

## 🆘 故障排除

### 常见问题

**问题 1: Google 等国外网站无法访问**
```
可能原因:
- 代理服务未启动
- 代理端口配置错误
- 防火墙阻止代理连接

解决方法:
1. 检查代理服务状态：ps aux | grep -E "v2ray|clash"
2. 确认代理端口：HTTP 10809, SOCKS5 10808
3. 测试代理连通性：curl --proxy http://127.0.0.1:10809 https://www.google.com
4. 切换代理类型：修改配置使用 SOCKS5
5. 检查防火墙设置：ufw status 或 firewall-cmd --list-all

验证:
- curl 命令成功返回 Google 首页
- web_fetch 可以正常访问国外网站
```

**问题 2: 搜索结果为空或质量差**
```
可能原因:
- 关键词太偏门或拼写错误
- 搜索引擎暂时不可用
- 触发反爬虫机制

解决方法:
1. 尝试更通用的关键词
2. 切换其他搜索引擎
3. 降低请求频率，间隔 5-10 秒
4. 更换 User-Agent

验证:
- 使用相同关键词在浏览器中搜索
- 确认搜索引擎正常工作
```

**问题 3: 页面提取失败**
```
可能原因:
- 网站使用大量 JavaScript 渲染
- 网站有反爬虫保护
- 页面结构复杂

解决方法:
1. 尝试其他搜索引擎
2. 使用 extractMode: "text" 获取纯文本
3. 手动访问网站复制链接内容
4. 考虑使用 browser 工具（如需要 JS 渲染）

验证:
- 检查返回的原始 HTML 是否包含内容
- 尝试不同的 extractMode
```

### 诊断命令
```bash
# 检查代理状态
ps aux | grep -E "v2ray|clash|proxy"

# 测试 HTTP 代理
curl --proxy http://127.0.0.1:10809 -I https://www.google.com

# 测试 SOCKS5 代理
curl --proxy socks5://127.0.0.1:10808 -I https://www.google.com

# 测试直连（国内网站）
curl -I https://www.baidu.com

# 检查网络连接
ping -c 4 8.8.8.8

# 查看技能日志
tail -f /root/.openclaw/logs/skill-multi-search-engine.log
```

---

*全局生效 - 所有 Session 和 Agent 自动可用*  
*最后更新：2026-03-20*  
*版本：v3.0.0*  
*维护人：OpenClaw Team*
