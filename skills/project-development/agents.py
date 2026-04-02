"""
Agent 实现 - Commander 和 Specialist Agents
"""

from mailbox import Message
import time


class CommanderAgent:
    """总指挥 Agent"""
    
    def __init__(self, task_mailbox, result_mailbox, config=None):
        self.task_mailbox = task_mailbox
        self.result_mailbox = result_mailbox
        self.config = config or {}
    
    def run(self):
        """运行 Commander"""
        print("🤖 Commander Agent 启动")
        
        while True:
            try:
                # 1. 读取功能列表
                features = self._load_features()
                
                # 2. 选择最高优先级的未完成功能
                pending = [f for f in features if not f.get('passes', False)]
                if not pending:
                    print("✅ 所有功能已完成！")
                    time.sleep(60)
                    continue
                
                next_feature = self._select_priority(pending)
                
                # 3. 分配给合适的 Agent
                agent_type = self._assign_agent(next_feature)
                
                # 4. 发送任务
                self.task_mailbox.send_message(
                    to=agent_type,
                    content=next_feature,
                    from_agent="commander",
                    type="task",
                    priority=self._get_priority(next_feature)
                )
                
                print(f"📤 分配任务：{next_feature['id']} → {agent_type}")
                
                # 5. 等待结果
                result = self.result_mailbox.receive_message(
                    to="commander",
                    timeout=self.config.get('timeout', 600)
                )
                
                if result:
                    print(f"📥 收到结果：{next_feature['id']} - {result.content.get('status')}")
                    
                    # 6. 验证结果
                    if result.content.get('status') == 'success':
                        next_feature['passes'] = True
                        self._save_features(features)
                        self._log_progress(f"完成 {next_feature['id']}")
                
            except Exception as e:
                print(f"❌ Commander 错误：{e}")
                time.sleep(10)
    
    def _load_features(self):
        """加载功能列表"""
        import json
        try:
            with open('claude-features.json', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []
    
    def _save_features(self, features):
        """保存功能列表"""
        import json
        with open('claude-features.json', 'w', encoding='utf-8') as f:
            json.dump(features, f, ensure_ascii=False, indent=2)
    
    def _select_priority(self, features):
        """选择最高优先级"""
        priority_map = {"P0": 0, "P1": 1, "P2": 2}
        return min(features, key=lambda f: priority_map.get(f.get('priority', 'P2'), 2))
    
    def _assign_agent(self, feature):
        """分配 Agent"""
        desc = feature.get('description', '').lower()
        
        if 'api' in desc or '后端' in desc or 'database' in desc:
            return 'backend'
        elif '页面' in desc or '前端' in desc or 'ui' in desc:
            return 'frontend'
        elif '测试' in desc or 'test' in desc:
            return 'qa'
        elif '文档' in desc or 'doc' in desc:
            return 'docs'
        else:
            return 'backend'
    
    def _get_priority(self, feature):
        """获取优先级"""
        priority_map = {"P0": 10, "P1": 5, "P2": 1}
        return priority_map.get(feature.get('priority', 'P2'), 1)
    
    def _log_progress(self, message):
        """记录进度"""
        from datetime import datetime, timezone
        with open('claude-progress.txt', 'a', encoding='utf-8') as f:
            f.write(f"## {datetime.now(timezone.utc).isoformat()}\n")
            f.write(f"{message}\n\n")


class BackendAgent:
    """后端开发 Agent"""
    
    def __init__(self, task_mailbox, result_mailbox, config=None):
        self.task_mailbox = task_mailbox
        self.result_mailbox = result_mailbox
        self.config = config or {}
    
    def run(self):
        """运行 Backend"""
        print("🤖 Backend Agent 启动")
        
        while True:
            try:
                # 接收任务
                task = self.task_mailbox.receive_message("backend", timeout=300, block=True)
                
                if task:
                    print(f"📥 收到任务：{task.content.get('id')}")
                    
                    try:
                        # 实现功能
                        result = self._implement(task.content)
                        
                        # 发送成功结果
                        self.result_mailbox.send_message(
                            to="commander",
                            content={
                                "feature_id": task.content.get('id'),
                                "status": "success",
                                "result": result
                            },
                            from_agent="backend",
                            type="result"
                        )
                        
                        print(f"✅ 完成任务：{task.content.get('id')}")
                        
                    except Exception as e:
                        # 发送失败结果
                        self.result_mailbox.send_message(
                            to="commander",
                            content={
                                "feature_id": task.content.get('id'),
                                "status": "failed",
                                "error": str(e)
                            },
                            from_agent="backend",
                            type="result"
                        )
                        
                        print(f"❌ 任务失败：{task.content.get('id')} - {e}")
            
            except Exception as e:
                print(f"❌ Backend 错误：{e}")
                time.sleep(10)
    
    def _implement(self, feature):
        """实现功能"""
        # TODO: 实际实现
        return {"status": "implemented"}


class FrontendAgent:
    """前端开发 Agent"""
    
    def __init__(self, task_mailbox, result_mailbox, config=None):
        self.task_mailbox = task_mailbox
        self.result_mailbox = result_mailbox
        self.config = config or {}
    
    def run(self):
        """运行 Frontend"""
        print("🤖 Frontend Agent 启动")
        
        while True:
            try:
                task = self.task_mailbox.receive_message("frontend", timeout=300, block=True)
                
                if task:
                    print(f"📥 收到任务：{task.content.get('id')}")
                    
                    try:
                        result = self._implement(task.content)
                        
                        self.result_mailbox.send_message(
                            to="commander",
                            content={
                                "feature_id": task.content.get('id'),
                                "status": "success",
                                "result": result
                            },
                            from_agent="frontend",
                            type="result"
                        )
                        
                        print(f"✅ 完成任务：{task.content.get('id')}")
                    
                    except Exception as e:
                        self.result_mailbox.send_message(
                            to="commander",
                            content={
                                "feature_id": task.content.get('id'),
                                "status": "failed",
                                "error": str(e)
                            },
                            from_agent="frontend",
                            type="result"
                        )
            
            except Exception as e:
                print(f"❌ Frontend 错误：{e}")
                time.sleep(10)
    
    def _implement(self, feature):
        """实现功能"""
        return {"status": "implemented"}


class QAAgent:
    """测试 QA Agent"""
    
    def __init__(self, task_mailbox, result_mailbox, config=None):
        self.task_mailbox = task_mailbox
        self.result_mailbox = result_mailbox
        self.config = config or {}
    
    def run(self):
        """运行 QA"""
        print("🤖 QA Agent 启动")
        
        while True:
            try:
                task = self.task_mailbox.receive_message("qa", timeout=300, block=True)
                
                if task:
                    print(f"📥 收到任务：{task.content.get('id')}")
                    
                    result = self._verify(task.content)
                    
                    self.result_mailbox.send_message(
                        to="commander",
                        content={
                            "feature_id": task.content.get('id'),
                            "status": "success" if result else "failed",
                            "passed": result
                        },
                        from_agent="qa",
                        type="result"
                    )
            
            except Exception as e:
                print(f"❌ QA 错误：{e}")
                time.sleep(10)
    
    def _verify(self, feature):
        """验证功能"""
        return True


class DocsAgent:
    """文档 Agent"""
    
    def __init__(self, task_mailbox, result_mailbox, config=None):
        self.task_mailbox = task_mailbox
        self.result_mailbox = result_mailbox
        self.config = config or {}
    
    def run(self):
        """运行 Docs"""
        print("🤖 Docs Agent 启动")
        
        while True:
            try:
                task = self.task_mailbox.receive_message("docs", timeout=300, block=True)
                
                if task:
                    print(f"📥 收到任务：{task.content.get('id')}")
                    
                    self._document(task.content)
                    
                    self.result_mailbox.send_message(
                        to="commander",
                        content={
                            "feature_id": task.content.get('id'),
                            "status": "success"
                        },
                        from_agent="docs",
                        type="result"
                    )
            
            except Exception as e:
                print(f"❌ Docs 错误：{e}")
                time.sleep(10)
    
    def _document(self, feature):
        """编写文档"""
        pass
