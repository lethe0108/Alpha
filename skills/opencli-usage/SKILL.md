# OpenCLI 使用技能 - 全局知识

> 将网站、浏览器会话、Electron 应用和本地工具统一变成适合人类与 AI Agent 使用的确定性接口。

## 核心定位

**首选资料搜索工具** - 当需要搜索网络资料、访问网站、获取信息时，优先使用 OpenCLI。

## 环境配置

### 1. 基础环境

```bash
# OpenCLI 已安装
opencli --version  # v1.7.0

# CDP 端点配置（必须）
export OPENCLI_CDP_ENDPOINT=http://localhost:9222

# 虚拟显示（服务器环境）
export DISPLAY=:99
```

### 2. 浏览器配置

```bash
# 启动带代理的 Chromium（如需访问国外网站）
/snap/bin/chromium \
  --remote-debugging-port=9222 \
  --no-sandbox \
  --disable-setuid-sandbox \
  --proxy-server="socks5://127.0.0.1:10808" \
  --no-first-run \
  --disable-gpu \
  --user-data-dir=/tmp/chromium-profile
```

## 使用模式

### 模式一：内置适配器（推荐）

适合国内网站，快速获取结构化数据：

```bash
# 国内网站（无需代理）
opencli 36kr hot --limit 5      # 36氪热榜
opencli bilibili hot --limit 5  # B站热门
opencli zhihu hot --limit 5     # 知乎热榜（需登录）
opencli v2ex hot --limit 5      # V2EX热门
```

### 模式二：浏览器直接控制

适合复杂搜索、需要交互的页面：

```bash
# 基本导航
opencli browser open <url>
opencli browser state           # 查看页面元素
opencli browser get title       # 获取页面标题

# 交互操作
opencli browser click <index>   # 点击元素
opencli browser type <index> "text"  # 输入文本
opencli browser keys "Enter"    # 按键

# 数据提取
opencli browser eval "document.body.innerText"  # 获取页面文本
opencli browser eval "document.title"           # 获取标题
```

### 模式三：百度搜索流程（标准流程）

```bash
# 1. 打开百度
opencli browser open https://www.baidu.com

# 2. 输入搜索词（通过JavaScript）
opencli browser eval "
  document.getElementById('kw').value = '搜索词';
  document.getElementById('form').submit();
"

# 3. 等待加载后提取结果
opencli browser eval "
  (function(){
    const results = [];
    document.querySelectorAll('.c-container').forEach((item) => {
      const h3 = item.querySelector('h3');
      if (h3) {
        const link = h3.querySelector('a');
        results.push({
          title: h3.textContent.trim(),
          href: link ? link.href : ''
        });
      }
    });
    return JSON.stringify(results.slice(0, 10));
  })()
"
```

## 网站支持情况

### ✅ 完全支持（国内）

| 网站 | 命令 | 说明 |
|------|------|------|
| 36氪 | `opencli 36kr hot` | 热榜文章 |
| Bilibili | `opencli bilibili hot` | 热门视频 |
| 知乎 | `opencli zhihu hot` | 热榜（需登录） |
| V2EX | `opencli v2ex hot` | 热门话题 |
| 百度 | `opencli browser` | 通过浏览器控制 |

### ⚠️ 部分支持（国外，需代理）

| 网站 | 状态 | 说明 |
|------|------|------|
| HackerNews | ⚠️ 部分 | 有时 fetch 失败 |
| Twitter | ❌ 困难 | 需登录，反爬严格 |
| Reddit | ❌ 困难 | 需登录，反爬严格 |

## 最佳实践

### 1. 搜索资料标准流程

```
1. 优先使用内置适配器（国内网站）
2. 复杂搜索使用 browser open + eval
3. 需要交互的页面使用 browser click/type
4. 提取数据使用 eval + JSON.stringify
```

### 2. 错误处理

```bash
# 检查连接
opencli doctor

# 如果失败，检查：
# 1. Chromium 是否运行
# 2. CDP 端口是否可访问
# 3. 代理是否配置（国外网站）
```

### 3. 性能优化

```bash
# 链式命令减少开销
opencli browser open <url> && opencli browser state

# 使用 eval 批量提取数据，避免多次调用
```

## 使用示例

### 示例1：搜索姓氏资料

```bash
export OPENCLI_CDP_ENDPOINT=http://localhost:9222

# 搜索乃姓历史
opencli browser open https://www.baidu.com
opencli browser eval "
  document.getElementById('kw').value = '乃姓 历史 西夏';
  document.getElementById('form').submit();
"
sleep 3
opencli browser eval "
  (function(){
    const results = [];
    document.querySelectorAll('.c-container').forEach((item) => {
      const h3 = item.querySelector('h3');
      if (h3) {
        results.push({title: h3.textContent.trim()});
      }
    });
    return JSON.stringify(results);
  })()
"
```

### 示例2：获取百科内容

```bash
# 打开百度百科
opencli browser open "https://baike.baidu.com/item/乃姓"
sleep 3

# 提取内容
opencli browser eval "
  (function(){
    return {
      title: document.querySelector('h1').textContent,
      summary: document.querySelector('.lemma-summary').textContent.slice(0, 500)
    };
  })()
"
```

## 注意事项

1. **国内网站优先** - 内置适配器对国内网站支持最好
2. **国外网站需代理** - 配置 `--proxy-server` 参数
3. **登录态问题** - 部分网站（知乎、Twitter）需要登录才能获取完整内容
4. **超时处理** - 复杂页面可能需要增加等待时间

## 相关文档

- 项目地址：https://github.com/jackwener/opencli
- 内置命令：`opencli list`
- 诊断工具：`opencli doctor`

---

**创建时间**：2026-04-10
**适用场景**：网络资料搜索、网站数据提取、浏览器自动化
**优先级**：高（首选工具）
