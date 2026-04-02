"""
Project Development - 项目开发核心实现
"""

import sys
sys.path.insert(0, '/root/.openclaw/skills/agent-teams-framework')
from mailbox import RedisMailbox, get_task_mailbox, get_result_mailbox
from scheduler import get_scheduler
from datetime import datetime, timezone
import json
import subprocess
import time
import threading
from typing import Dict, List, Optional


class ProjectDevelopment:
    """
    项目开发入口类
    
    多 Agent 并发协作 + Mailbox 通信 + 自我驱动
    """
    
    def __init__(
        self,
        name: str,
        description: str,
        requirements: List[str] = None,
        tech_stack: Dict = None,
        deadline: str = None,
        agent_config: Dict = None,
        mailbox_config: Dict = None,
        report_config: Dict = None
    ):
        """
        初始化项目
        
        Args:
            name: 项目名称
            description: 项目描述
            requirements: 需求列表
            tech_stack: 技术栈
            deadline: 截止日期
            agent_config: Agent 配置
            mailbox_config: Mailbox 配置
            report_config: 报告配置
        """
        self.name = name
        self.description = description
        self.requirements = requirements or []
        self.tech_stack = tech_stack or {}
        self.deadline = deadline
        self.agent_config = agent_config or {"max_agents": 4, "timeout": 600, "retry": 3}
        self.mailbox_config = mailbox_config or {"host": "localhost", "port": 6379, "db": 0}
        self.report_config = report_config or {"interval": 1200}  # 20 分钟
        
        # 初始化 Mailbox
        self.task_mailbox = get_task_mailbox()
        self.result_mailbox = get_result_mailbox()
        
        # Agent 实例
        self.agents = {}
        
        # 状态
        self.started = False
        self.initialized = False
    
    def initialize(self):
        """初始化项目环境"""
        print(f"🚀 初始化项目：{self.name}")
        
        # 1. 创建功能列表
        features = self._create_feature_list()
        with open('claude-features.json', 'w', encoding='utf-8') as f:
            json.dump(features, f, ensure_ascii=False, indent=2)
        print(f"✅ 创建功能列表：{len(features)} 个功能")
        
        # 2. 创建进度文件
        with open('claude-progress.txt', 'w', encoding='utf-8') as f:
            f.write(f"# 项目进度日志\n\n")
            f.write(f"## 项目：{self.name}\n")
            f.write(f"## 描述：{self.description}\n")
            f.write(f"## 创建时间：{datetime.now(timezone.utc).isoformat()}\n\n")
            f.write(f"## 功能列表\n")
            for feat in features:
                f.write(f"- [ ] {feat['id']}: {feat['description']}\n")
        print("✅ 创建进度文件")
        
        # 3. 创建启动脚本
        self._create_init_script()
        print("✅ 创建启动脚本")
        
        # 4. 初始化 Git
        self._init_git()
        print("✅ 初始化 Git")
        
        # 5. 启动 Mailbox
        self._verify_mailbox()
        print("✅ Mailbox 已就绪")
        
        self.initialized = True
        print("✅ 初始化完成")
    
    def start(self):
        """启动开发"""
        if not self.initialized:
            print("❌ 请先调用 initialize() 初始化项目")
            return
        
        print(f"🚀 启动多 Agent 开发...")
        
        # 启动 Commander
        self._start_commander()
        print("✅ Commander Agent 已启动")
        
        # 启动 Specialist Agents
        self._start_specialists()
        print("✅ Specialist Agents 已启动")
        
        # 启动进度报告
        self._start_reporting()
        print("✅ 进度报告已启动 (每 20 分钟)")
        
        self.started = True
        print("✅ 开发已启动，自动推进直到完成")
    
    def get_progress(self) -> Dict:
        """获取进度"""
        try:
            with open('claude-features.json', encoding='utf-8') as f:
                features = json.load(f)
            
            done = sum(1 for feat in features if feat.get('passes', False))
            total = len(features)
            
            return {
                "done": done,
                "total": total,
                "percent": done / total * 100 if total > 0 else 0
            }
        except Exception as e:
            return {"done": 0, "total": 0, "percent": 0, "error": str(e)}
    
    def get_current_tasks(self) -> List[Dict]:
        """获取当前任务"""
        tasks = []
        
        # 查看队列中的任务
        for agent_type in ['backend', 'frontend', 'qa', 'docs']:
            size = self.task_mailbox.get_queue_size(agent_type)
            if size > 0:
                tasks.append({
                    "agent": agent_type,
                    "pending": size
                })
        
        return tasks
    
    def get_agent_status(self) -> Dict:
        """获取 Agent 状态"""
        status = {}
        for name in ['commander', 'backend', 'frontend', 'qa', 'docs']:
            status[name] = "🟢 运行中" if name in self.agents else "⚪ 未启动"
        return status
    
    def _create_feature_list(self) -> List[Dict]:
        """创建功能列表"""
        features = []
        feature_id = 1
        
        # 根据需求创建功能
        for req in self.requirements:
            features.append({
                "id": f"FEAT-{feature_id:03d}",
                "category": "requirement",
                "description": req,
                "steps": [
                    "实现功能",
                    "编写测试",
                    "验证功能",
                    "编写文档"
                ],
                "passes": False,
                "priority": "P0"
            })
            feature_id += 1
        
        # 如果没有需求，创建默认功能
        if not features:
            features = [
                {
                    "id": "FEAT-001",
                    "category": "setup",
                    "description": "项目初始化",
                    "steps": ["创建项目结构", "配置环境", "初始化 Git"],
                    "passes": False,
                    "priority": "P0"
                }
            ]
        
        return features
    
    def _create_init_script(self):
        """创建启动脚本"""
        script = """#!/bin/bash
# 项目启动脚本

echo "🚀 启动项目..."

# 启动 Redis
redis-server --daemonize yes
echo "✅ Redis 已启动"

# 启动后端
if [ -d "backend" ]; then
    cd backend && python3 -m uvicorn app.main:app --reload &
    echo "✅ 后端已启动"
fi

# 启动前端
if [ -d "frontend" ]; then
    cd frontend && npm run dev &
    echo "✅ 前端已启动"
fi

# 等待服务
sleep 5

# 运行测试
if [ -f "run_tests.sh" ]; then
    ./run_tests.sh
fi

echo "✅ 所有服务已启动"
"""
        
        with open('init.sh', 'w', encoding='utf-8') as f:
            f.write(script)
        
        import os
        os.chmod('init.sh', 0o755)
    
    def _init_git(self):
        """初始化 Git"""
        try:
            subprocess.run(['git', 'init'], check=True, capture_output=True)
            subprocess.run(['git', 'add', '.'], check=True, capture_output=True)
            subprocess.run(['git', 'commit', '-m', 'Initial setup by ProjectDevelopment'], check=True, capture_output=True)
        except Exception as e:
            print(f"⚠️ Git 初始化失败：{e}")
    
    def _verify_mailbox(self):
        """验证 Mailbox"""
        try:
            self.task_mailbox.redis.ping()
            self.result_mailbox.redis.ping()
        except Exception as e:
            print(f"❌ Mailbox 连接失败：{e}")
            raise
    
    def _start_commander(self):
        """启动 Commander"""
        from agents import CommanderAgent
        self.agents['commander'] = CommanderAgent(self.task_mailbox, self.result_mailbox, self.agent_config)
        
        def run():
            self.agents['commander'].run()
        
        threading.Thread(target=run, daemon=True).start()
    
    def _start_specialists(self):
        """启动 Specialist Agents"""
        from agents import BackendAgent, FrontendAgent, QAAgent, DocsAgent
        
        agent_classes = {
            'backend': BackendAgent,
            'frontend': FrontendAgent,
            'qa': QAAgent,
            'docs': DocsAgent
        }
        
        for name, agent_class in agent_classes.items():
            self.agents[name] = agent_class(self.task_mailbox, self.result_mailbox, self.agent_config)
            
            def run(agent_name):
                self.agents[agent_name].run()
            
            threading.Thread(target=run, args=(name,), daemon=True).start()
    
    def _start_reporting(self):
        """启动进度报告 - 精确计时"""
        from datetime import datetime, timezone
        
        def report_loop():
            interval = self.report_config.get('interval', 1200)
            next_report_time = datetime.now(timezone.utc).timestamp() + interval
            
            while True:
                # 计算到下次报告的时间
                now = datetime.now(timezone.utc).timestamp()
                sleep_time = max(0, next_report_time - now)
                
                if sleep_time > 0:
                    time.sleep(sleep_time)
                
                # 发送报告
                self._send_report()
                
                # 更新下次报告时间
                next_report_time = datetime.now(timezone.utc).timestamp() + interval
        
        threading.Thread(target=report_loop, daemon=True).start()
    
    def _send_report(self):
        """发送进度报告"""
        progress = self.get_progress()
        current_tasks = self.get_current_tasks()
        agent_status = self.get_agent_status()
        
        report = f"""
# 📊 项目进度报告

**项目**: {self.name}
**时间**: {datetime.now(timezone.utc).isoformat()}
**进度**: {progress['percent']:.1f}% ({progress['done']}/{progress['total']})

## 当前任务
"""
        
        if current_tasks:
            for task in current_tasks:
                report += f"- {task['agent']}: {task['pending']} 个待处理\n"
        else:
            report += "- 无待处理任务\n"
        
        report += "\n## Agent 状态\n"
        for agent, status in agent_status.items():
            report += f"- {agent}: {status}\n"
        
        report += f"\n## 下次报告\n20 分钟后\n"
        
        # 输出报告
        print(report)
        
        # 保存到文件
        with open('progress_report.md', 'a', encoding='utf-8') as f:
            f.write(f"\n## {datetime.now(timezone.utc).isoformat()}\n")
            f.write(report)


# 快捷函数
def create_project(name: str, description: str, **kwargs) -> ProjectDevelopment:
    """创建项目"""
    return ProjectDevelopment(name, description, **kwargs)


def quick_start(name: str, requirements: List[str], **kwargs):
    """快速启动项目"""
    project = create_project(name, f"开发{requirements[0] if requirements else '项目'}", requirements=requirements, **kwargs)
    project.initialize()
    project.start()
    return project
