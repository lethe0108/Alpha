# qwen-image-2.0-pro 图片生成技能

> **创建时间**: 2026-03-25 23:55  
> **适用渠道**: 飞书 (Feishu/Lark) + 全局可用  
> **模型**: qwen-image-2.0-pro (千问文生图专业版)

---

## 📋 技能说明

本技能提供 **qwen-image-2.0-pro** 文生图模型的完整调用指南，确保飞书渠道和其他渠道使用正确的 API 配置，避免调用错误。

---

## 🔑 核心配置信息

### 1. Provider 配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| **Provider ID** | `dashscope-image` | 独立图片生成 Provider |
| **模型 ID** | `qwen-image-2.0-pro` | 千问文生图专业版 |
| **模型别名** | `qwen-image-pro` | 快捷使用别名 |

### 2. API 配置（重要！）

| 配置项 | 值 | ⚠️ 注意事项 |
|--------|-----|-------------|
| **API 端点** | `https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation` | ❌ 不是 `compatible-mode/v1` |
| **API Key** | `sk-18dd4c6a5a194faa8e10886ca6e91ae2` | ❌ 不是 `sk-sp-xxx` |
| **API 类型** | `dashscope-multimodal` | ❌ 不是 `openai-completions` |
| **请求方式** | `POST` | 同步调用 |
| **Content-Type** | `application/json` | 必须 |

### 3. OpenClaw 配置位置

**配置文件**: `/root/.openclaw/openclaw.json`

```json
{
  "models": {
    "providers": {
      "dashscope-image": {
        "baseUrl": "https://dashscope.aliyuncs.com/api/v1",
        "apiKey": "sk-18dd4c6a5a194faa8e10886ca6e91ae2",
        "api": "openai-completions",
        "models": [
          {
            "id": "qwen-image-2.0-pro",
            "name": "qwen-image-2.0-pro (千问文生图专业版)",
            "input": ["text"],
            "contextWindow": 8192,
            "maxTokens": 4096
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "models": {
        "dashscope-image/qwen-image-2.0-pro": {
          "alias": "qwen-image-pro"
        }
      }
    }
  }
}
```

---

## 🚀 调用方式

### 方式 1: OpenClaw 模型切换（推荐）

**飞书/全局通用**：

```
/模型 qwen-image-pro
生成一张图片：一只可爱的猫咪，阳光明媚
```

**切换回文本模型**：
```
/模型 qwen3.5-plus
```

### 方式 2: 直接指定模型

```
使用 dashscope-image/qwen-image-2.0-pro 生成图片：xxx
```

### 方式 3: HTTP API 直接调用

```bash
curl -X POST "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-18dd4c6a5a194faa8e10886ca6e91ae2" \
  -d '{
    "model": "qwen-image-2.0-pro",
    "input": {
      "messages": [
        {
          "role": "user",
          "content": [{"text": "一只可爱的猫咪，高清摄影"}]
        }
      ]
    },
    "parameters": {
      "size": "1024*1024",
      "watermark": false,
      "prompt_extend": true
    }
  }'
```

---

## 📝 请求参数详解

### 必填参数

| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `model` | string | 模型名称 | `qwen-image-2.0-pro` |
| `input.messages[].role` | string | 角色固定为 user | `user` |
| `input.messages[].content[].text` | string | 提示词（≤800 字符） | `一只可爱的猫咪` |

### 可选参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `parameters.size` | string | `2048*2048` | 分辨率（512*512 ~ 2048*2048） |
| `parameters.n` | integer | `1` | 输出数量（1-6 张） |
| `parameters.watermark` | bool | `false` | 是否添加水印 |
| `parameters.prompt_extend` | bool | `true` | 智能改写提示词 |
| `parameters.negative_prompt` | string | - | 反向提示词（≤500 字符） |
| `parameters.seed` | integer | 随机 | 随机种子 |

### 推荐分辨率

| 比例 | 分辨率 | 适用场景 |
|------|--------|----------|
| **1:1** | `2048*2048` | 默认，通用 |
| **16:9** | `2688*1536` | 横版海报 |
| **9:16** | `1536*2688` | 手机壁纸 |
| **4:3** | `2368*1728` | 标签设计 |
| **3:4** | `1728*2368` | 竖版海报 |

---

## ✅ 响应格式

### 成功响应

```json
{
  "output": {
    "choices": [
      {
        "finish_reason": "stop",
        "message": {
          "content": [
            {
              "image": "https://dashscope-xxx.png?Expires=xxx"
            }
          ],
          "role": "assistant"
        }
      }
    ]
  },
  "usage": {
    "height": 2048,
    "image_count": 1,
    "width": 2048
  },
  "request_id": "xxx"
}
```

### 错误响应

```json
{
  "code": "InvalidApiKey",
  "message": "Invalid API-key provided.",
  "request_id": "xxx"
}
```

---

## ⚠️ 常见错误与解决方案

### 错误 1: InvalidApiKey

**原因**: 使用了错误的 API Key

❌ 错误：
```
sk-sp-8bb5f7d534e04ee58ca9b20333eee7a1  (bailian coding 端点 Key)
```

✅ 正确：
```
sk-18dd4c6a5a194faa8e10886ca6e91ae2  (dashscope 端点 Key)
```

### 错误 2: 404 Not Found

**原因**: 使用了错误的 API 端点

❌ 错误：
```
https://dashscope.aliyuncs.com/compatible-mode/v1/images/generations
```

✅ 正确：
```
https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
```

### 错误 3: InvalidParameter (request body format)

**原因**: 请求体格式错误

❌ 错误格式：
```json
{"prompt": "一只猫"}  // OpenAI 格式
```

✅ 正确格式：
```json
{
  "input": {
    "messages": [
      {"role": "user", "content": [{"text": "一只猫"}]}
    ]
  }
}
```

---

## 🎯 飞书渠道使用指南

### 1. 模型切换

在飞书对话中：
```
/模型 qwen-image-pro
帮我生成一张产品标签设计图
```

### 2. 直接描述需求

```
使用 qwen-image-2.0-pro 生成：酱油产品标签，白色底色，深棕色文字
```

### 3. 注意事项

| 事项 | 说明 |
|------|------|
| **图片 URL 有效期** | 24 小时，及时下载保存 |
| **提示词长度** | 中文≤800 字符 |
| **生成时间** | 通常 5-15 秒 |
| **并发限制** | 参考百炼控制台配额 |

---

## 📋 使用示例

### 示例 1: 生成可爱动物

```
/模型 qwen-image-pro
生成一张图片：一只坐着的橘黄色的猫，表情愉悦，活泼可爱，逼真准确，阳光透过窗户洒在它身上
```

### 示例 2: 产品标签设计

```
/模型 qwen-image-pro
酱油产品标签设计，尺寸 140mm×75mm，白色底色，深棕色文字。左侧圆形 logo 和产品信息，中间超大字五比一原汁酱油，右侧营养成分表和条形码
```

### 示例 3: 海报设计

```
/模型 qwen-image-pro
电商海报，天猫双十一预售，蓝色调，3D 立体字体，宠物粮包装，可爱小猫，满 399 减 99 促销信息
```

---

## 🔍 配置检查清单

使用前请确认：

- [ ] API Key 是 `sk-18dd4c6a5a194faa8e10886ca6e91ae2`
- [ ] API 端点是 `dashscope.aliyuncs.com/api/v1/...`
- [ ] 模型别名 `qwen-image-pro` 已配置
- [ ] Gateway 服务运行正常
- [ ] 飞书插件已启用

---

## 📞 问题排查

### 检查 Gateway 状态
```bash
ps aux | grep openclaw-gateway
```

### 测试 API 连通性
```bash
curl -X POST "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation" \
  -H "Authorization: Bearer sk-18dd4c6a5a194faa8e10886ca6e91ae2" \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen-image-2.0-pro","input":{"messages":[{"role":"user","content":[{"text":"测试"}]}]},"parameters":{"size":"1024*1024"}}'
```

### 查看配置文件
```bash
grep -A 10 "dashscope-image" /root/.openclaw/openclaw.json
```

---

## 📚 相关文档

- [阿里云百炼官方文档](https://help.aliyun.com/zh/model-studio/qwen-image-api)
- [OpenClaw 配置文档](https://docs.openclaw.ai/config)
- [飞书插件文档](https://docs.openclaw.ai/plugins/feishu)

---

**最后更新**: 2026-03-25 23:55  
**维护者**: OpenClaw Assistant
