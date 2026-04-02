# 👤 全局用户配置技能

> **版本**: 1.0.0  
> **作用域**: 全局 (所有会话可访问)  
> **状态**: ✅ 全局激活  
> **认证**: 需要用户 ID 验证

---

## 📋 技能概述

提供全局用户配置访问，包括 GitHub 信息、偏好设置等。所有会话都可以通过认证获取这些信息。

### 核心能力
1. **用户信息管理** - 存储和访问用户基本信息
2. **GitHub 配置** - GitHub 用户名、仓库、Token 等
3. **偏好设置** - 开发模式、报告间隔等
4. **身份验证** - 验证用户身份后访问敏感信息

---

## 🔐 访问方式

### 1. 获取基本信息（无需认证）

```python
from user_profile import get_user_profile

profile = get_user_profile()

# 获取用户信息
user_info = profile.get_user_info()
print(f"用户名：{user_info.get('name')}")

# 获取 GitHub 用户名
github_username = profile.get_github_username()
print(f"GitHub: {github_username}")
```

### 2. 获取敏感信息（需要认证）

```python
from user_profile import verify_and_get_github_info

# 验证用户身份
user_id = "ou_5965d62297ded953e874f2b15373e3b8"  # 南哥的 ID

try:
    github_info = verify_and_get_github_info(user_id)
    print(f"GitHub 信息：{github_info}")
except PermissionError:
    print("认证失败")
```

### 3. 快捷函数

```python
from user_profile import get_github_username, get_github_info

# 获取 GitHub 用户名
username = get_github_username()  # 返回："lethe0108"

# 获取完整 GitHub 信息
info = get_github_info()
```

---

## 📊 当前配置

### 用户信息
```json
{
  "name": "南哥",
  "label": "乃学南",
  "id": "ou_5965d62297ded953e874f2b15373e3b8",
  "timezone": "Asia/Shanghai"
}
```

### GitHub 信息
```json
{
  "username": "lethe0108",
  "repositories": {
    "prompt-master": {
      "url": "https://github.com/lethe0108/prompt-master",
      "visibility": "private",
      "description": "POT - AI 提示词优化工具"
    }
  }
}
```

### 偏好设置
```json
{
  "development_mode": "multi_agent_concurrent",
  "report_interval": 1200,
  "auto_commit": true,
  "require_approval_for": ["major_changes", "deployment"]
}
```

---

## 🔧 使用方法

### 在 Web 会话中使用

```python
# Web 会话中
from user_profile import get_github_username, verify_and_get_github_info

# 1. 获取公开信息（无需认证）
username = get_github_username()
print(f"GitHub 用户名：{username}")  # lethe0108

# 2. 获取完整信息（需要认证）
user_id = get_current_user_id()  # 从会话获取用户 ID
github_info = verify_and_get_github_info(user_id)

# 3. 使用 GitHub 信息
repo_url = github_info['repositories']['prompt-master']['url']
print(f"仓库地址：{repo_url}")
```

### 在开发项目中使用

```python
from project_development import ProjectDevelopment
from user_profile import get_github_username

# 自动使用 GitHub 用户名
project = ProjectDevelopment(
    name="POT",
    requirements=["功能 1", "功能 2"],
    github_username=get_github_username()  # 自动使用 lethe0108
)

project.initialize()
project.start()
```

### 更新 GitHub Token

```python
from user_profile import get_user_profile

profile = get_user_profile()

# 更新 Token（仅当用户认证后）
if profile.verify_user("ou_5965d62297ded953e874f2b15373e3b8"):
    profile.update_github_token("ghp_xxxxxxxxxxxx")
    print("Token 已更新")
```

---

## 📝 配置管理

### 查看配置

```python
from user_profile import get_user_profile

profile = get_user_profile()

# 查看所有配置（隐藏敏感信息）
print(profile.to_dict(include_sensitive=False))

# 查看所有配置（包含敏感信息，需要认证）
if profile.verify_user(user_id):
    print(profile.to_dict(include_sensitive=True))
```

### 添加新仓库

```python
from user_profile import get_user_profile

profile = get_user_profile()

if profile.verify_user(user_id):
    profile.add_repository(
        "new-repo",
        {
            "url": "https://github.com/lethe0108/new-repo",
            "visibility": "private",
            "description": "新项目"
        }
    )
```

---

## 🔐 安全说明

### 认证机制
```
1. 用户 ID 验证 - 匹配用户 ID
2. 敏感信息保护 - Token 等敏感信息默认隐藏
3. 访问日志 - 记录所有敏感信息访问
```

### 敏感信息
```
✅ 公开信息：用户名、仓库 URL
⚠️ 敏感信息：Token、Email（需要认证）
```

---

## 📞 南哥，配置完成！

### 全局信息已保存

**位置**: `/root/.openclaw/config/user_profile.json`  
**访问方式**: `from user_profile import get_github_username`  
**认证**: 需要你的用户 ID 验证

### 所有会话都可以使用

```python
# 任何会话中
from user_profile import get_github_username

# 直接获取你的 GitHub 用户名
username = get_github_username()  # 返回 "lethe0108"

# 用于项目配置
project = ProjectDevelopment(
    name="项目名",
    github_username=username  # 自动使用 lethe0108
)
```

### Web 会话也可以使用

Web 会话中的 Agent 可以通过认证获取你的 GitHub 信息，直接用于项目开发！

---

*全局生效 - 所有会话可访问*  
*最后更新：2026-03-17*
