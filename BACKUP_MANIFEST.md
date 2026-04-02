# Alpha 备份清单

**最新备份**: 2026-04-01 05:03:20
**备份范围**: /root/.openclaw (排除敏感目录)
**仓库**: https://github.com/lethe0108/Alpha (Private)

## 本次备份内容

- 22 个文件变更
- 扩展模块更新 (openclaw-lark)
- 定时任务记录
- 技能和文档更新

## 排除的敏感目录

以下目录已添加到 .gitignore，不会被备份：

- `agents/*/sessions/` - Agent 会话文件 (可能包含 token)
- `config/` - 用户配置文件 (包含 GitHub Token 等)
- `identity/` - 设备认证信息
- `devices/` - 设备配对信息
- `qqbot/data/` - QQ 凭证数据
- `qqbot/sessions/` - QQ 会话文件

## 备份历史

| 日期 | 文件数 | 状态 |
|------|--------|------|
| 2026-04-01 | 22 | ✅ 成功 |

---
*Alpha 系统 - 保护南哥的数据安全* 🛡️
