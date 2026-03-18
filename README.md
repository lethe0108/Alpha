# 股票选股与跟踪系统

> **版本**: 0.1.0  
> **创建时间**: 2026-03-18  
> **技术栈**: Tauri + Vue3 + Python + Redis  
> **许可**: 商业许可 (需授权费)

---

## 📊 项目概述

一站式股票投资管理系统，提供选股、交易、跟踪、优化闭环功能。

### 核心功能
- 🎯 **智能选股** - 长线价值 + 短线交易策略
- 📝 **交易记录** - 完整交易流水管理
- 💼 **持仓跟踪** - 实时盈亏分析
- 📈 **数据分析** - 可视化报表
- 🔐 **激活系统** - 离线激活码授权

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────┐
│          Tauri (Rust + WebView)         │
│              Vue 3 + TypeScript          │
│              Element Plus               │
│              ECharts                    │
└─────────────────────────────────────────┘
                    ↕ IPC
┌─────────────────────────────────────────┐
│          Python FastAPI                 │
│          SQLAlchemy                     │
│          Pandas + NumPy                 │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│          SQLite (加密)                   │
│          Redis Mailbox                  │
└─────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Python 3.11+
- Rust 1.70+
- Redis 7.0+

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/lethe0108/Alpha.git
cd stock-system

# 2. 安装后端依赖
cd backend
pip install -r requirements.txt

# 3. 安装前端依赖
cd ../frontend
npm install

# 4. 启动开发环境
npm run tauri dev
```

---

## 📁 项目结构

```
stock-system/
├── backend/           # Python 后端
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── api/
│   │   └── services/
│   └── tests/
├── frontend/          # Tauri + Vue3 前端
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   └── stores/
│   └── src-tauri/
├── tests/            # 端到端测试
├── docs/             # 文档
└── scripts/          # 工具脚本
```

---

## 📊 功能模块

### 第 1 周：核心引擎
- [ ] 选股引擎 (长线 + 短线)
- [ ] 数据库设计
- [ ] 数据源对接 (iTick/QVeris)

### 第 2 周：交易管理
- [ ] 交易记录 CRUD
- [ ] 持仓管理
- [ ] 盈亏计算

### 第 3 周：数据可视化
- [ ] Dashboard
- [ ] ECharts 图表
- [ ] 数据分析

### 第 4 周：激活系统
- [ ] 激活码生成
- [ ] 设备绑定
- [ ] 防破解保护

### 第 5-6 周：测试优化
- [ ] Playwright 测试
- [ ] 性能优化
- [ ] 打包发布

---

## 📝 开发日志

### 2026-03-18: 项目启动
- ✅ 项目初始化
- ✅ Git 仓库创建
- ✅ 技术栈确认
- ✅ 开发环境准备

---

## 📄 许可证

**商业许可** - 需授权费

未经书面许可，不得用于商业用途。

---

## 👥 开发团队

- **总指挥**: Alpha
- **后端开发**: AI Agent
- **前端开发**: AI Agent
- **测试工程师**: AI Agent
- **文档工程师**: AI Agent

---

## 📞 联系方式

- GitHub: https://github.com/lethe0108/Alpha
- 邮箱：lethe0108@users.noreply.github.com

---

*最后更新：2026-03-18*
