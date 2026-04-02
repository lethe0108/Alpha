# 国际搜索引擎详细指南

## Google

### 基本信息
- **URL**: `https://www.google.com/search?q={keyword}`
- **特点**: 全球最大搜索引擎，索引最全面
- **适用**: 英文内容、国际网站、学术研究

### 高级语法
```
site:域名              - 站内搜索
filetype:扩展名         - 文件类型
"精确短语"             - 精确匹配
关键词 - 排除词         - 排除关键词
词 1 OR 词 2           - OR 搜索
intitle:关键词         - 标题搜索
inurl:关键词           - URL 搜索
related:域名           - 相关网站
link:域名              - 链接搜索
&tbs=qdr:w            - 过去 1 周
&tbs=qdr:m            - 过去 1 月
&tbs=qdr:y            - 过去 1 年
```

### 使用示例
```python
# 基本搜索
web_fetch(url="https://www.google.com/search?q=AI+agent+framework")

# 站内搜索
web_fetch(url="https://www.google.com/search?q=site:github.com+python")

# PDF 文件
web_fetch(url="https://www.google.com/search?q=machine+learning+filetype:pdf")

# 时间过滤（过去 1 周）
web_fetch(url="https://www.google.com/search?q=AI+news&tbs=qdr:w")

# 精确匹配
web_fetch(url="https://www.google.com/search?q=%22deep+learning%22")
```

### Google Scholar
```python
# 学术搜索
web_fetch(url="https://www.google.com/search?q=site:scholar.google.com+transformer+attention")
```

---

## Google HK

### 基本信息
- **URL**: `https://www.google.com.hk/search?q={keyword}`
- **特点**: 繁体中文、香港内容
- **适用**: 港澳台内容、繁体中文资料

### 使用示例
```python
web_fetch(url="https://www.google.com.hk/search?q=人工智能")
web_fetch(url="https://www.google.com.hk/search?q=機器學習")
```

---

## DuckDuckGo

### 基本信息
- **URL**: `https://duckduckgo.com/html/?q={keyword}`
- **特点**: 隐私保护、无追踪、HTML 版本易抓取
- **适用**: 隐私搜索、技术问答、开源项目

### Bangs 快捷搜索
```
!g       - Google
!gh      - GitHub
!so      - Stack Overflow
!w       - Wikipedia
!yt      - YouTube
!r       - Reddit
!amz     - Amazon
!tw      - Twitter
!li      - LinkedIn
!ncbi    - NCBI
!arxiv   - arXiv
!npm     - npm
!pypi    - PyPI
```

### 使用示例
```python
# 基本搜索
web_fetch(url="https://duckduckgo.com/html/?q=python+tutorial")

# GitHub 搜索
web_fetch(url="https://duckduckgo.com/html/?q=!gh+tensorflow")

# Stack Overflow
web_fetch(url="https://duckduckgo.com/html/?q=!so+python+error")

# 学术搜索
web_fetch(url="https://duckduckgo.com/html/?q=!arxiv+deep+learning")

# Wikipedia
web_fetch(url="https://duckduckgo.com/html/?q=!w+artificial+intelligence")
```

### 优势
- 无个性化过滤，结果一致
- HTML 版本易于抓取
- Bangs 提供快速跳转
- 隐私保护，无追踪

---

## Yahoo

### 基本信息
- **URL**: `https://search.yahoo.com/search?p={keyword}`
- **特点**: 新闻、财经、体育
- **适用**: 美国新闻、财经数据

### 使用示例
```python
# 基本搜索
web_fetch(url="https://search.yahoo.com/search?p=stock+market")

# 新闻搜索
web_fetch(url="https://news.search.yahoo.com/search?p=tech+news")

# 财经搜索
web_fetch(url="https://finance.search.yahoo.com/search?p=AAPL")
```

---

## Startpage

### 基本信息
- **URL**: `https://www.startpage.com/sp/search?query={keyword}`
- **特点**: Google 搜索结果 + 隐私保护
- **适用**: 需要 Google 质量但注重隐私

### 使用示例
```python
web_fetch(url="https://www.startpage.com/sp/search?query=AI+research")
```

---

## Brave Search

### 基本信息
- **URL**: `https://search.brave.com/search?q={keyword}`
- **特点**: 独立索引、隐私保护、无追踪
- **适用**: 隐私搜索、替代 Google

### 使用示例
```python
web_fetch(url="https://search.brave.com/search?q=quantum+computing")
```

---

## Ecosia

### 基本信息
- **URL**: `https://www.ecosia.org/search?q={keyword}`
- **特点**: 环保、用广告收入植树
- **适用**: 环保搜索、欧洲内容

### 使用示例
```python
web_fetch(url="https://www.ecosia.org/search?q=renewable+energy")
```

---

## Qwant

### 基本信息
- **URL**: `https://www.qwant.com/?q={keyword}`
- **特点**: 欧洲搜索引擎、GDPR 合规
- **适用**: 欧洲内容、隐私保护

### 使用示例
```python
web_fetch(url="https://www.qwant.com/?q=European+AI+regulation")
```

---

## WolframAlpha

### 基本信息
- **URL**: `https://www.wolframalpha.com/input?i={keyword}`
- **特点**: 计算引擎、数据查询、知识图谱
- **适用**: 数学计算、数据转换、股票查询

### 查询类型

#### 数学计算
```
integrate x^2 dx
derivative of sin(x)
sum of 1 to 100
matrix {{1,2},{3,4}}
```

#### 单位转换
```
100 USD to CNY
10 miles in km
50 kg in lbs
```

#### 股票查询
```
AAPL stock
GOOGL vs MSFT
S&P 500
```

#### 天气查询
```
weather in Beijing
temperature Shanghai tomorrow
```

#### 人口统计
```
population of China
GDP of Japan
```

#### 化学
```
H2O molar mass
CO2 molecular weight
```

### 使用示例
```python
# 股票查询
web_fetch(url="https://www.wolframalpha.com/input?i=AAPL+stock+price")

# 货币转换
web_fetch(url="https://www.wolframalpha.com/input?i=100+USD+to+CNY")

# 数学计算
web_fetch(url="https://www.wolframalpha.com/input?i=integrate+x^2+dx")

# 天气
web_fetch(url="https://www.wolframalpha.com/input?i=weather+Beijing")
```

---

## 国际搜索引擎对比

| 引擎 | 索引规模 | 隐私保护 | 技术资源 | 学术资源 | 推荐场景 |
|------|---------|---------|---------|---------|---------|
| Google | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 通用搜索 |
| DuckDuckGo | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | 隐私搜索 |
| Bing | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | 技术文档 |
| Startpage | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | Google 替代 |
| Brave | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | 隐私搜索 |
| WolframAlpha | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 计算查询 |

---

## 最佳实践

### 1. 英文内容优先 Google
```python
google = web_fetch(url="https://www.google.com/search?q=keyword")
```

### 2. 技术问答用 DuckDuckGo Bangs
```python
# Stack Overflow
stackoverflow = web_fetch(url="https://duckduckgo.com/html/?q=!so+python+error")

# GitHub
github = web_fetch(url="https://duckduckgo.com/html/?q=!gh+ai+framework")
```

### 3. 学术研究
```python
# arXiv
arxiv = web_fetch(url="https://duckduckgo.com/html/?q=!arxiv+transformer")

# Google Scholar
scholar = web_fetch(url="https://www.google.com/search?q=site:scholar.google.com+deep+learning")
```

### 4. 数据查询用 WolframAlpha
```python
# 股票
stock = web_fetch(url="https://www.wolframalpha.com/input?i=AAPL+stock")

# 转换
convert = web_fetch(url="https://www.wolframalpha.com/input?i=100+USD+to+CNY")
```

### 5. 隐私搜索
```python
# DuckDuckGo
ddg = web_fetch(url="https://duckduckgo.com/html/?q=keyword")

# Startpage (Google 结果)
startpage = web_fetch(url="https://www.startpage.com/sp/search?query=keyword")
```

### 6. 多引擎验证
```python
# 重要信息用多个引擎验证
google = web_fetch(url="https://www.google.com/search?q=keyword")
ddg = web_fetch(url="https://duckduckgo.com/html/?q=keyword")
bing = web_fetch(url="https://cn.bing.com/search?q=keyword&ensearch=1")
```

---

## 跨区域搜索策略

### 中文 + 英文结合
```python
# 中文资料
baidu = web_fetch(url="https://www.baidu.com/s?wd=关键词")

# 英文资料
google = web_fetch(url="https://www.google.com/search?q=keyword")

# 对比分析
```

### 技术资源优先
```python
# GitHub
github = web_fetch(url="https://duckduckgo.com/html/?q=!gh+keyword")

# Stack Overflow
stackoverflow = web_fetch(url="https://duckduckgo.com/html/?q=!so+keyword")

# 官方文档
google = web_fetch(url="https://www.google.com/search?q=site:docs.python.org+keyword")
```

---

*最后更新：2026-03-17*
