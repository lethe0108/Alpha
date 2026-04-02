# 国内搜索引擎详细指南

## 百度搜索

### 基本信息
- **URL**: `https://www.baidu.com/s?wd={keyword}`
- **特点**: 中文内容最全，国内网站索引最完整
- **适用**: 中文资料、国内网站、本地化内容

### 搜索语法
```
site:域名         - 站内搜索
filetype:扩展名    - 文件类型
intitle:关键词    - 标题搜索
inurl:关键词      - URL 搜索
related:域名      - 相关网站
```

### 使用示例
```python
# 基本搜索
web_fetch(url="https://www.baidu.com/s?wd=Python 教程")

# 站内搜索
web_fetch(url="https://www.baidu.com/s?wd=site:github.com+Python")

# PDF 文件
web_fetch(url="https://www.baidu.com/s?wd=filetype:pdf+机器学习")

# 标题搜索
web_fetch(url="https://www.baidu.com/s?wd=intitle:人工智能")
```

### 注意事项
- 搜索结果包含广告（标注"广告"）
- 需要处理百度特有的页面结构
- 部分结果可能需要登录才能查看

---

## 必应中国

### 基本信息
- **中国版**: `https://cn.bing.com/search?q={keyword}&ensearch=0`
- **国际版**: `https://cn.bing.com/search?q={keyword}&ensearch=1`
- **特点**: 中英文混合搜索，页面简洁
- **适用**: 中英文内容、技术文档

### 搜索语法
与 Google 类似，支持大部分高级语法

### 使用示例
```python
# 中国版搜索
web_fetch(url="https://cn.bing.com/search?q=Python 教程&ensearch=0")

# 国际版搜索
web_fetch(url="https://cn.bing.com/search?q=Python+tutorial&ensearch=1")

# 代码搜索
web_fetch(url="https://cn.bing.com/search?q=site:github.com+python+machine+learning&ensearch=1")
```

---

## 360 搜索

### 基本信息
- **URL**: `https://www.so.com/s?q={keyword}`
- **特点**: 安全搜索，过滤恶意网站
- **适用**: 安全浏览、中文内容

### 使用示例
```python
# 基本搜索
web_fetch(url="https://www.so.com/s?q=人工智能")

# 新闻搜索
web_fetch(url="https://www.so.com/s?q=AI 新闻&src=news")

# 视频搜索
web_fetch(url="https://www.so.com/s?q=Python 教程&src=video")
```

---

## 搜狗搜索

### 基本信息
- **URL**: `https://sogou.com/web?query={keyword}`
- **特点**: 微信公众号内容独家
- **适用**: 微信文章、中文内容

### 搜索语法
```
site:域名         - 站内搜索
filetype:扩展名    - 文件类型
```

### 使用示例
```python
# 网页搜索
web_fetch(url="https://sogou.com/web?query=人工智能")

# 微信文章（使用微信搜索）
web_fetch(url="https://wx.sogou.com/weixin?type=2&query=AI 技术")

# 站内搜索
web_fetch(url="https://sogou.com/web?query=site:zhihu.com+Python")
```

---

## 微信搜索

### 基本信息
- **URL**: `https://wx.sogou.com/weixin?type=2&query={keyword}`
- **特点**: 独家微信公众号文章
- **适用**: 公众号文章、行业观点、深度分析

### 搜索参数
```
type=2  - 搜索文章
type=1  - 搜索公众号
```

### 使用示例
```python
# 搜索文章
web_fetch(url="https://wx.sogou.com/weixin?type=2&query=量化交易")

# 搜索公众号
web_fetch(url="https://wx.sogou.com/weixin?type=1&query=财经")
```

### 注意事项
- 部分内容需要微信登录才能查看
- 搜索结果可能包含广告
- 文章质量参差不齐，需筛选

---

## 今日头条搜索

### 基本信息
- **URL**: `https://so.toutiao.com/search?keyword={keyword}`
- **特点**: 新闻资讯、热点话题、算法推荐
- **适用**: 实时新闻、市场观点、热点追踪

### 使用示例
```python
# 基本搜索
web_fetch(url="https://so.toutiao.com/search?keyword=AI 突破")

# 财经新闻
web_fetch(url="https://so.toutiao.com/search?keyword=股市分析")

# 科技资讯
web_fetch(url="https://so.toutiao.com/search?keyword=科技前沿")
```

### 注意事项
- 内容偏向大众化、娱乐化
- 需要筛选高质量内容
- 注意信息时效性

---

## 集思录

### 基本信息
- **URL**: `https://www.jisilu.cn/explore/?keyword={keyword}`
- **特点**: 财经投资、量化交易、专业社区
- **适用**: 股票分析、量化策略、投资讨论

### 使用示例
```python
# 搜索策略
web_fetch(url="https://www.jisilu.cn/explore/?keyword=量化选股")

# 搜索讨论
web_fetch(url="https://www.jisilu.cn/explore/?keyword=可转债")

# 搜索数据
web_fetch(url="https://www.jisilu.cn/explore/?keyword=ETF")
```

### 注意事项
- 专业性强，适合投资者
- 部分内容需要注册查看
- 社区讨论质量较高

---

## 国内搜索引擎对比

| 引擎 | 中文内容 | 技术资源 | 新闻时效 | 专业深度 | 推荐场景 |
|------|---------|---------|---------|---------|---------|
| 百度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | 通用搜索 |
| 必应中国 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | 技术文档 |
| 360 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | 安全浏览 |
| 搜狗 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | 微信文章 |
| 微信搜索 | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | 公众号 |
| 今日头条 | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | 热点新闻 |
| 集思录 | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 财经投资 |

---

## 最佳实践

### 1. 中文内容优先百度
```python
baidu = web_fetch(url="https://www.baidu.com/s?wd=关键词")
```

### 2. 技术文档用必应
```python
bing = web_fetch(url="https://cn.bing.com/search?q=site:github.com+keyword&ensearch=1")
```

### 3. 微信文章用搜狗
```python
wechat = web_fetch(url="https://wx.sogou.com/weixin?type=2&query=关键词")
```

### 4. 财经投资用集思录
```python
jisilu = web_fetch(url="https://www.jisilu.cn/explore/?keyword=关键词")
```

### 5. 热点新闻用头条
```python
toutiao = web_fetch(url="https://so.toutiao.com/search?keyword=关键词")
```

### 6. 多引擎验证
```python
# 重要信息用多个引擎验证
baidu = web_fetch(url="https://www.baidu.com/s?wd=关键词")
bing = web_fetch(url="https://cn.bing.com/search?q=keyword&ensearch=0")
google = web_fetch(url="https://www.google.com/search?q=keyword")
```

---

*最后更新：2026-03-17*
