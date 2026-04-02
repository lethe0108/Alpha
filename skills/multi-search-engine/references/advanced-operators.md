# 高级搜索语法大全

## 通用搜索运算符

### 精确匹配
```
"关键词"
```
搜索包含完整短语的页面
```python
web_fetch(url="https://www.google.com/search?q=%22artificial+intelligence%22")
```

### 排除关键词
```
关键词 -排除词
```
排除包含特定词的页面
```python
web_fetch(url="https://www.google.com/search?q=python+-snake")
```

### OR 搜索
```
词 1 OR 词 2
```
搜索包含任一关键词的页面
```python
web_fetch(url="https://www.google.com/search?q=cat+OR+dog")
```

### 站内搜索
```
site:域名 关键词
```
在特定网站内搜索
```python
web_fetch(url="https://www.google.com/search?q=site:github.com+python")
web_fetch(url="https://www.baidu.com/s?wd=site:zhihu.com+AI")
```

### 文件类型搜索
```
filetype:扩展名 关键词
```
搜索特定文件类型
```python
web_fetch(url="https://www.google.com/search?q=machine+learning+filetype:pdf")
web_fetch(url="https://www.google.com/search?q=annual+report+filetype:xlsx")
```

### 标题搜索
```
intitle:关键词
```
搜索标题中包含关键词的页面
```python
web_fetch(url="https://www.google.com/search?q=intitle:python+tutorial")
```

### URL 搜索
```
inurl:关键词
```
搜索 URL 中包含关键词的页面
```python
web_fetch(url="https://www.google.com/search?q=inurl:blog+python")
```

### 相关网站
```
related:域名
```
搜索与指定网站相关的页面
```python
web_fetch(url="https://www.google.com/search?q=related:github.com")
```

### 链接搜索
```
link:域名
```
搜索链接到指定网站的页面
```python
web_fetch(url="https://www.google.com/search?q=link:example.com")
```

---

## Google 专用语法

### 时间范围过滤
```
&tbs=qdr:h  - 过去 1 小时
&tbs=qdr:d  - 过去 1 天
&tbs=qdr:w  - 过去 1 周
&tbs=qdr:m  - 过去 1 月
&tbs=qdr:y  - 过去 1 年
```

### 自定义时间范围
```
&tbs=cdr:1&cd_min:mm/dd/yyyy&cd_max:mm/dd/yyyy
```

### 数字范围
```
关键词 数字 1..数字 2
```
```python
web_fetch(url="https://www.google.com/search?q=smartphone+$300..$500")
```

### 定义查询
```
define:单词
```
```python
web_fetch(url="https://www.google.com/search?q=define:quantum")
```

### 缓存页面
```
cache:URL
```
```python
web_fetch(url="https://www.google.com/search?q=cache:example.com")
```

---

## 百度专用语法

### 百度高级搜索
```
wd=关键词
```
基本搜索

### 标题搜索
```
intitle:关键词
```

### 站内搜索
```
site:域名 关键词
```

### 文件类型
```
filetype:pdf 关键词
```

### 相关搜索
```
related:域名
```

---

## DuckDuckGo Bangs

### 常用 Bangs

| Bang | 目标网站 | 示例 |
|------|---------|------|
| `!g` | Google | `!g python tutorial` |
| `!gh` | GitHub | `!gh tensorflow` |
| `!so` | Stack Overflow | `!so python error` |
| `!w` | Wikipedia | `!w artificial intelligence` |
| `!yt` | YouTube | `!yt python tutorial` |
| `!r` | Reddit | `!r machine learning` |
| `!amz` | Amazon | `!amz python book` |
| `!tw` | Twitter | `!tw AI news` |
| `!li` | LinkedIn | `!li software engineer` |
| `!ncbi` | NCBI | `!ncbi gene sequencing` |
| `!arxiv` | arXiv | `!arxiv deep learning` |
| `!npm` | npm | `!npm react` |
| `!pypi` | PyPI | `!pypi pandas` |

### 使用示例
```python
# GitHub 搜索
web_fetch(url="https://duckduckgo.com/html/?q=!gh+ai+framework")

# Stack Overflow 搜索
web_fetch(url="https://duckduckgo.com/html/?q=!so+python+asyncio")

# 学术搜索
web_fetch(url="https://duckduckgo.com/html/?q=!arxiv+transformer+attention")
```

---

## WolframAlpha 查询类型

### 数学计算
```
integrate x^2 dx
derivative of sin(x)
sum of 1 to 100
```

### 单位转换
```
100 USD to CNY
10 miles in km
50 kg in lbs
```

### 股票查询
```
AAPL stock
GOOGL vs MSFT
S&P 500
```

### 天气查询
```
weather in Beijing
temperature Shanghai tomorrow
```

### 人口统计数据
```
population of China
GDP of Japan
```

### 化学公式
```
H2O molar mass
CO2 molecular weight
```

### 使用示例
```python
web_fetch(url="https://www.wolframalpha.com/input?i=AAPL+stock+price")
web_fetch(url="https://www.wolframalpha.com/input?i=100+USD+to+CNY")
web_fetch(url="https://www.wolframalpha.com/input?i=integrate+x^2+dx")
```

---

## 组合使用示例

### 1. 找最新技术文档
```python
# Google: GitHub 上的 Python 项目（过去 1 年，PDF 格式）
web_fetch(url="https://www.google.com/search?q=site:github.com+python+tutorial+filetype:pdf&tbs=qdr:y")
```

### 2. 找技术问题解决方案
```python
# DuckDuckGo: Stack Overflow 搜索特定错误
web_fetch(url="https://duckduckgo.com/html/?q=!so+python+list+index+out+of+range")
```

### 3. 多源验证信息
```python
# Google
google = web_fetch(url="https://www.google.com/search?q=AI+breakthrough+2026")
# 百度
baidu = web_fetch(url="https://www.baidu.com/s?wd=AI 突破+2026")
# 今日头条
toutiao = web_fetch(url="https://so.toutiao.com/search?keyword=AI+2026")
```

### 4. 财经数据查询
```python
# 集思录
jisilu = web_fetch(url="https://www.jisilu.cn/explore/?keyword=量化策略")
# WolframAlpha 股票查询
wolfram = web_fetch(url="https://www.wolframalpha.com/input?i=AAPL+stock")
```

### 5. 学术研究搜索
```python
# arXiv 论文
arxiv = web_fetch(url="https://duckduckgo.com/html/?q=!arxiv+transformer+2026")
# Google Scholar（通过 Google）
scholar = web_fetch(url="https://www.google.com/search?q=site:scholar.google.com+deep+learning")
```

---

*最后更新：2026-03-17*
