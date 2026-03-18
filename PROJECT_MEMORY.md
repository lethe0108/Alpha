# 股票分析系统 - 项目记忆

> **创建时间**: 2026-03-18  
> **项目**: 股票选股与跟踪系统 Windows 桌面版  
> **状态**: 🟢 开发中

---

## 📋 项目决策记录

### 2026-03-18: 项目启动

**技术选型决策**:
- ✅ 框架：Tauri + Vue3 + Python (用户确认)
- ✅ 测试：Playwright (用户确认)
- ✅ 通信：Redis Mailbox (现有实现)
- ✅ 数据源：iTick (历史) + QVeris (实时) (用户确认)
- ✅ 激活系统：RSA+AES+ 设备绑定 (用户确认)
- ✅ 许可：商业许可 (需授权费) (用户确认)

**开发要求**:
1. ✅ 界面美观简洁，用户友好
2. ✅ 符合炒股用户实际诉求
3. ✅ 按最优设计执行
4. ✅ 所有内容上传 GitHub，商业许可
5. ✅ 定期提交，定期更新项目记忆

**参考产品**:
- 同花顺 PC 版
- 通达信金融终端
- 东方财富 Choice

---

## 📅 开发进度

### 第 1 周：项目搭建 + 核心引擎 (2026-03-18 ~ 2026-03-24)

**已完成**:
- [x] 项目初始化 (13:40)
- [x] Git 仓库创建
- [x] README.md + LICENSE
- [x] 依赖配置 (requirements.txt/package.json)
- [x] Tauri 配置
- [x] 后端基础 (main.py/config.py)
- [x] 数据库模型 (13:45)
- [x] 选股引擎 (13:50)

**进行中**:
- [ ] Tauri 项目搭建
- [ ] 前端页面设计
- [ ] 数据源对接 (等待 API Key)

**待开始**:
- [ ] 交易记录模块
- [ ] 持仓管理模块
- [ ] 激活系统

---

## 🎯 关键设计决策

### 数据库设计
- 使用 SQLite (轻量，无需配置)
- 5 个核心表：stocks/stock_metrics/transactions/positions/strategies
- 支持加密 (生产环境)

### 选股引擎
- 多维度评分：估值 (30%) + 盈利 (30%) + 成长 (25%) + 健康 (15%)
- 支持长线价值 + 短线趋势策略
- 可配置筛选条件

### UI 设计原则
- 参考同花顺/通达信
- 简洁明了，功能优先
- 深色主题 (护眼)
- 快捷键支持

---

## 📝 待办事项

### 立即执行
- [ ] 搭建 Tauri 前端项目
- [ ] 设计 Dashboard 页面
- [ ] 实现选股页面

### 等待 API Key
- [ ] 对接 iTick (历史数据)
- [ ] 对接 QVeris (实时数据)

### 后续开发
- [ ] 交易记录 CRUD
- [ ] 持仓管理
- [ ] 数据可视化 (ECharts)
- [ ] 激活系统
- [ ] Playwright 测试

---

## 🔧 技术笔记

### Redis Mailbox 使用
```python
from skills.agent_teams_framework.mailbox import RedisMailbox

# 发送任务
mailbox.send_message(
    to="backend",
    content={"task": "implement feature"},
    from_agent="commander",
    type="task",
    priority=5
)

# 接收任务
msg = mailbox.receive_message("backend", timeout=0)
```

### Tauri 项目结构
```
frontend/
├── src/
│   ├── components/
│   ├── views/
│   │   ├── Dashboard.vue
│   │   ├── Screener.vue
│   │   ├── Transactions.vue
│   │   └── Holdings.vue
│   └── stores/
├── src-tauri/
│   ├── src/
│   │   └── main.rs
│   └── Cargo.toml
└── package.json
```

---

## 📊 代码统计

- 总文件数：11
- 代码行数：~1000
- Git 提交：2
- 最新提交：15c8fb3 (feat: 数据库模型和选股引擎)

---

## 🚨 风险与问题

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| API Key 未提供 | 数据源无法对接 | 使用 mock 数据开发 |
| Tauri 学习曲线 | 开发进度可能延迟 | 参考官方文档 |
| 激活系统复杂度 | 需要额外开发时间 | 使用成熟方案 |

---

## 📞 联系方式

- GitHub: https://github.com/lethe0108/Alpha
- 邮箱：lethe0108@users.noreply.github.com

---

*最后更新：2026-03-18 13:50*
