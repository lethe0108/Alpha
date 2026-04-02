# 📐 Skill 优化模板 (基于 Anthropic 最佳实践)

> **版本**: 1.0.0  
> **创建时间**: 2026-03-20  
> **目的**: 标准化 Skill 结构，提升可维护性和复用性

---

## 🎯 Anthropic Skills 核心设计原则

### 1. 明确的触发条件 (Explicit Triggers)
- **何时激活**: 清晰定义技能被触发的场景
- **何时停用**: 明确技能不再适用的情况
- **优先级**: 与其他技能的优先级关系

### 2. 上下文注入 (Context Injection)
- **前置知识**: 技能执行需要的背景信息
- **动态加载**: 按需加载，避免上下文污染
- **隔离执行**: 独立上下文，不影响主会话

### 3. 结构化执行逻辑 (Structured Execution)
- **步骤清晰**: 分步骤的执行流程
- **决策点**: 明确的分支判断
- **可验证**: 每步可检查、可测试

### 4. 输入输出定义 (I/O Definition)
- **输入格式**: 接受的参数类型和格式
- **输出格式**: 返回结果的标准化结构
- **错误处理**: 异常情况的处理方式

### 5. 反馈循环 (Feedback Loop)
- **执行日志**: 记录关键决策点
- **成功率统计**: 跟踪技能执行效果
- **持续优化**: 基于反馈迭代改进

---

## 📋 优化后的 Skill 结构模板

```markdown
---
name: <技能名称>
description: <一句话描述>
version: <语义化版本号>
scope: <global|session|agent>
priority: <数字，0 最高>
triggers:
  - <触发条件 1>
  - <触发条件 2>
dependencies:
  - <依赖的技能或工具>
metadata:
  author: <作者>
  created: <创建日期>
  updated: <更新日期>
  tags: [<标签 1>, <标签 2>]
---

# <技能名称>

> **版本**: <version>  
> **作用域**: <scope>  
> **优先级**: <priority>  
> **状态**: ✅ 激活 / ⏸️ 实验 / ❌ 已弃用

---

## 📋 技能概述

<用 2-3 句话描述技能的核心价值和用途>

### 核心能力
1. **能力 1** - 简短描述
2. **能力 2** - 简短描述
3. **能力 3** - 简短描述

### 使用场景
- ✅ **场景 1**: 何时使用此技能
- ✅ **场景 2**: 典型应用
- ❌ **不适用**: 何时不应该使用

---

## 🎯 触发条件

### 自动触发
```
当满足以下条件时，技能自动激活：
- 条件 1: <具体描述>
- 条件 2: <具体描述>
- 条件 3: <具体描述>
```

### 手动触发
```
用户可以通过以下方式手动触发：
- 关键词：<关键词>
- 命令：<命令格式>
- API: <调用方式>
```

### 优先级规则
```
与其他技能的优先级关系：
- 高于：<技能列表>
- 低于：<技能列表>
- 冲突处理：<解决策略>
```

---

## 🔧 配置和依赖

### 必需配置
```json
{
  "required_settings": {
    "setting1": "value",
    "setting2": "value"
  }
}
```

### 可选配置
```json
{
  "optional_settings": {
    "setting1": "default_value",
    "setting2": "default_value"
  }
}
```

### 外部依赖
- 工具：`<工具名称>`
- API: `<API 名称>`
- 其他技能：`<技能名称>`

---

## 📥 输入定义

### 参数格式
```json
{
  "parameters": {
    "param1": {
      "type": "string",
      "required": true,
      "description": "参数描述",
      "example": "示例值"
    },
    "param2": {
      "type": "number",
      "required": false,
      "default": 0,
      "description": "参数描述"
    }
  }
}
```

### 输入验证
```
验证规则:
- 规则 1: <描述>
- 规则 2: <描述>

验证失败处理:
- 处理方式：<描述>
- 错误消息：<模板>
```

---

## 📤 输出定义

### 标准输出格式
```json
{
  "output": {
    "status": "success|error|partial",
    "data": {},
    "metadata": {
      "timestamp": "ISO8601",
      "execution_time_ms": 0,
      "source": "技能名称"
    }
  }
}
```

### 输出示例
```json
{
  "status": "success",
  "data": {
    "result": "示例结果"
  },
  "metadata": {
    "timestamp": "2026-03-20T10:00:00Z",
    "execution_time_ms": 150
  }
}
```

---

## 🔄 执行流程

### 步骤 1: <步骤名称>
```
输入：<上一步输出或初始输入>
处理：<具体操作描述>
输出：<本步骤输出>
验证：<检查点>
```

### 步骤 2: <步骤名称>
```
输入：<上一步输出>
处理：<具体操作描述>
决策点:
  - 如果 <条件 A>: 执行 <操作 A>
  - 如果 <条件 B>: 执行 <操作 B>
输出：<本步骤输出>
验证：<检查点>
```

### 步骤 3: <步骤名称>
```
...
```

### 完整流程图
```
开始 → 步骤 1 → 步骤 2 → 决策点 → 步骤 3 → 结束
                          ↓
                      错误处理 → 结束
```

---

## ⚠️ 错误处理

### 已知错误类型
| 错误代码 | 错误类型 | 触发条件 | 处理策略 |
|---------|---------|---------|---------|
| E001 | 输入验证失败 | 参数缺失或格式错误 | 返回错误消息，请求重新输入 |
| E002 | 外部 API 失败 | API 超时或返回错误 | 重试 3 次，失败后降级处理 |
| E003 | 资源不可用 | 依赖服务离线 | 使用缓存或备用方案 |

### 错误处理流程
```
检测到错误
    ↓
分类错误类型
    ↓
执行对应处理策略
    ↓
记录错误日志
    ↓
返回用户友好的错误消息
```

### 降级策略
```
当主要功能不可用时：
1. 尝试备用方案 A
2. 尝试备用方案 B
3. 返回缓存数据（如果可用）
4. 返回友好错误消息
```

---

## 📊 监控和日志

### 关键指标
- **成功率**: 执行成功次数 / 总执行次数
- **平均执行时间**: 从开始到结束的平均耗时
- **错误率**: 各类错误的分布
- **使用频率**: 每日/每周调用次数

### 日志格式
```json
{
  "timestamp": "ISO8601",
  "skill_name": "技能名称",
  "action": "操作名称",
  "input": "输入摘要",
  "output": "输出摘要",
  "duration_ms": 0,
  "status": "success|error",
  "error_code": "E001"
}
```

### 审计要求
- 记录所有敏感操作
- 记录所有外部 API 调用
- 记录所有错误和异常
- 保留日志 30 天

---

## 🧪 测试用例

### 单元测试
```python
# 测试用例 1: 正常流程
def test_normal_flow():
    input = {...}
    expected = {...}
    result = skill.execute(input)
    assert result == expected

# 测试用例 2: 边界条件
def test_boundary_condition():
    input = {...}  # 边界值
    expected = {...}
    result = skill.execute(input)
    assert result == expected

# 测试用例 3: 错误处理
def test_error_handling():
    input = {...}  # 无效输入
    result = skill.execute(input)
    assert result.status == "error"
    assert result.error_code == "E001"
```

### 集成测试
```python
# 测试与其他技能的协作
def test_integration():
    # 前置条件
    setup_prerequisites()
    
    # 执行技能
    result = skill.execute(input)
    
    # 验证结果
    assert result.status == "success"
    
    # 清理
    cleanup()
```

### 性能测试
```python
# 测试执行时间
def test_performance():
    import time
    start = time.time()
    skill.execute(large_input)
    duration = time.time() - start
    assert duration < max_allowed_time
```

---

## 📚 使用示例

### 示例 1: 基本使用
```python
# 场景描述
# 输入
input = {...}
# 执行
result = skill.execute(input)
# 输出
print(result)
```

### 示例 2: 高级使用
```python
# 场景描述
# 带配置的执行
config = {...}
result = skill.execute(input, config)
# 处理结果
process_result(result)
```

### 示例 3: 错误处理
```python
# 场景描述
try:
    result = skill.execute(invalid_input)
except SkillError as e:
    handle_error(e)
```

---

## 🔗 相关资源

### 内部文档
- [相关技能 1](../related-skill-1/SKILL.md)
- [相关技能 2](../related-skill-2/SKILL.md)
- [配置文档](../../config/README.md)

### 外部资源
- [官方文档](https://example.com/docs)
- [API 参考](https://example.com/api)
- [最佳实践](https://example.com/best-practices)

### 参考资料
- 论文/文章标题
- 博客链接
- 视频教程

---

## 📝 更新日志

### v<version> (<date>)
- ✅ 新增：<新功能>
- 🔧 优化：<优化内容>
- 🐛 修复：<修复的 bug>
- ❌ 弃用：<弃用的功能>

### v<previous-version> (<date>)
- ...

---

## 🆘 故障排除

### 常见问题

**问题 1: <问题描述>**
```
可能原因:
- 原因 1
- 原因 2

解决方法:
1. 步骤 1
2. 步骤 2
3. 步骤 3

验证:
- 如何确认问题已解决
```

**问题 2: <问题描述>**
```
...
```

### 诊断命令
```bash
# 检查技能状态
command1

# 查看日志
command2

# 测试连接
command3
```

---

*全局生效 - 所有 Session 和 Agent 自动可用*  
*最后更新：<date>*  
*版本：<version>*

```

---

## 🎯 优化检查清单

在优化每个 Skill 时，检查以下项目：

- [ ] **元数据完整**: name, version, scope, priority, triggers
- [ ] **触发条件清晰**: 何时激活、何时停用
- [ ] **输入输出定义**: 参数格式、验证规则、输出结构
- [ ] **执行流程结构化**: 分步骤、有决策点、可验证
- [ ] **错误处理完善**: 错误类型、处理策略、降级方案
- [ ] **监控和日志**: 关键指标、日志格式、审计要求
- [ ] **测试用例覆盖**: 单元测试、集成测试、性能测试
- [ ] **使用示例丰富**: 基本使用、高级使用、错误处理
- [ ] **相关资源链接**: 内部文档、外部资源、参考资料
- [ ] **更新日志完整**: 版本历史、变更内容

---

*此模板用于指导 Skill 优化，确保所有技能遵循统一标准*
