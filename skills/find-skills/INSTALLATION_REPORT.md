# ✅ find-skills 技能安装完成

**安装时间**: 2026-03-18 14:27 GMT+8  
**来源**: https://clawhub.ai/JimLiuxinghai/find-skills  
**作者**: JimLiuxinghai  
**状态**: ✅ 全局生效

---

## 📋 技能信息

| 项目 | 内容 |
|------|------|
| **名称** | find-skills |
| **路径** | `/root/.openclaw/workspace/skills/find-skills/` |
| **版本** | 1.0.0 (从 SKILL.md 推断) |
| **作用域** | 全局 (所有 Session 和 Agent) |
| **描述** | 帮助用户发现和安装 Open Agent Skills 生态中的技能 |

---

## 🎯 核心功能

### Skills CLI 命令
- `npx skills find [query]` - 搜索技能
- `npx skills add <package>` - 安装技能
- `npx skills check` - 检查更新
- `npx skills update` - 更新所有技能

### 使用场景
- 用户问"如何做 X"时查找相关技能
- 用户说"找个技能做 X"
- 用户问"你能做 X 吗"（X 是 specialized capability）
- 用户想扩展 Agent 能力
- 用户寻找工具、模板、工作流

---

## 📁 文件结构

```
find-skills/
├── SKILL.md              # 技能文档
├── _meta.json            # 元数据
└── .clawhub/             # ClawHub 管理文件
```

---

## 🔍 使用示例

### 示例 1: 搜索 React 性能优化
```bash
npx skills find react performance
```

### 示例 2: 安装技能
```bash
npx skills add vercel-labs/agent-skills@vercel-react-best-practices
```

### 示例 3: 浏览技能网站
https://skills.sh/

---

## 📊 安装过程

### 尝试记录
| 次数 | 结果 | 说明 |
|------|------|------|
| 1 | ❌ 失败 | Rate limit exceeded (48s) |
| 2 | ❌ 失败 | Rate limit exceeded (1s) |
| 3 | ✅ 成功 | 安装到 `/root/.openclaw/workspace/skills/find-skills/` |

### 最终状态
```
✔ OK. Installed find-skills -> /root/.openclaw/workspace/skills/find-skills/
```

---

## 🎯 常见技能分类

| 分类 | 搜索示例 |
|------|---------|
| Web 开发 | react, nextjs, typescript, css, tailwind |
| 测试 | testing, jest, playwright, e2e |
| DevOps | deploy, docker, kubernetes, ci-cd |
| 文档 | docs, readme, changelog, api-docs |
| 代码质量 | review, lint, refactor, best-practices |
| 设计 | ui, ux, design-system, accessibility |
| 生产力 | workflow, automation, git |

---

## 💡 搜索技巧

1. **使用具体关键词**: "react testing" 比 "testing" 更好
2. **尝试同义词**: "deploy" 不行就试 "deployment" 或 "ci-cd"
3. **检查热门来源**: vercel-labs/agent-skills, ComposioHQ/awesome-claude-skills

---

## ⚠️ 注意事项

### 如果未找到技能
- 承认没有找到现有技能
- 提出直接用通用能力帮助用户
- 建议用户创建自己的技能：`npx skills init my-skill`

### 速率限制
- ClawHub 有 API 速率限制
- 如果失败，等待几十秒后重试
- 避免短时间内多次请求

---

## 🔗 相关资源

- **技能浏览**: https://skills.sh/
- **ClawHub**: https://clawhub.ai/
- **技能创建**: `npx skills init`

---

## 📝 后续行动

### 立即可用
- ✅ 技能已安装，全局生效
- ✅ 可以在任何 Session 中使用
- ✅ 自动触发（根据描述匹配）

### 测试建议
```bash
# 测试搜索功能
npx skills find react

# 测试帮助
npx skills --help
```

---

*安装报告由小 p (Alpha) 于 2026-03-18 14:27 创建*
