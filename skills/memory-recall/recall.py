#!/usr/bin/env python3
"""
回忆技能主程序 - OpenClaw技能格式
为Web UI中的AI助手提供记忆查询功能
"""

import os
import sys
import re
import json
from typing import Dict, List, Optional, Any
from pathlib import Path

# 添加必要的路径
sys.path.append(str(Path(__file__).parent))

try:
    from hook_matcher import HookMatcher
    from memory_retriever import MemoryRetriever
except ImportError:
    # 如果导入失败，创建简化版本
    pass

class MemoryRecallSkill:
    """回忆技能 - OpenClaw技能类"""
    
    def __init__(self):
        self.name = "memory-recall"
        self.description = "基于钩子的记忆检索系统"
        self.version = "1.0.0"
        
        # 初始化组件
        self.memory_root = "/root/.openclaw/workspace/memory"
        self.hook_matcher = None
        self.memory_retriever = None
        
        # 关键词触发列表
        self.trigger_keywords = [
            # 身份相关
            "谁", "身份", "我是谁", "你是谁", "叫什么",
            # 事件相关
            "昨天", "今天", "明天", "完成", "任务", "事件",
            # 知识相关
            "什么", "怎么", "如何", "为什么", "原因",
            # 配置相关
            "安全", "代理", "配置", "设置", "网络",
            # 技能相关
            "技能", "能力", "功能", "本领",
            # 关系相关
            "南哥", "婷姐", "朋友", "关系",
            # 记忆相关
            "回忆", "记忆", "记住", "查找"
        ]
        
        # 初始化组件
        self._initialize_components()
    
    def _initialize_components(self):
        """初始化组件"""
        try:
            self.hook_matcher = HookMatcher()
            self.memory_retriever = MemoryRetriever()
            print(f"✅ 回忆技能初始化成功 - 版本 {self.version}")
        except Exception as e:
            print(f"⚠️ 回忆技能组件初始化失败: {e}")
            print("   使用简化模式运行")
    
    def should_trigger(self, query: str) -> bool:
        """检查是否应该触发回忆技能"""
        query_lower = query.lower()
        
        # 检查是否包含触发关键词
        for keyword in self.trigger_keywords:
            if keyword in query_lower:
                return True
        
        # 检查特定模式
        patterns = [
            r"什么.*是", r"怎么.*做", r"如何.*设置",
            r"为什么.*不能", r"谁.*的", r"昨天.*了"
        ]
        
        for pattern in patterns:
            if re.search(pattern, query_lower):
                return True
        
        return False
    
    def extract_keywords(self, query: str) -> List[str]:
        """提取关键词"""
        # 移除常见词
        stop_words = {'的', '了', '在', '是', '我', '有', '和', '就', '都', '而', '及', '与', '着', '或'}
        
        words = re.findall(r'\b\w+\b', query.lower())
        keywords = [word for word in words if word not in stop_words and len(word) > 1]
        
        return list(set(keywords))
    
    def recall_memory(self, query: str) -> Dict[str, Any]:
        """回忆记忆 - 主功能"""
        print(f"🧠 回忆技能触发: {query}")
        
        # 提取关键词
        keywords = self.extract_keywords(query)
        print(f"📝 提取关键词: {keywords}")
        
        # 尝试使用完整组件
        if self.hook_matcher and self.memory_retriever:
            try:
                return self._recall_with_components(query, keywords)
            except Exception as e:
                print(f"⚠️ 完整回忆失败，使用简化模式: {e}")
        
        # 简化模式
        return self._recall_simple(query, keywords)
    
    def _recall_with_components(self, query: str, keywords: List[str]) -> Dict[str, Any]:
        """使用完整组件回忆"""
        # 匹配钩子
        hook_matches = self.hook_matcher.match_hooks_advanced(query)
        
        # 搜索记忆
        memories = []
        for keyword in keywords[:3]:  # 限制前3个关键词
            search_results = self.memory_retriever.search_by_keyword(keyword)
            for result in search_results[:2]:  # 每个关键词取前2个结果
                # 获取文件内容
                content = self.memory_retriever.get_file_content(result["file"])
                if content and "error" not in content:
                    memories.append({
                        "keyword": keyword,
                        "file": result["file"],
                        "category": result["category"],
                        "content_preview": content.get("preview", "")[:200]
                    })
        
        # 构建响应
        response = {
            "query": query,
            "keywords": keywords,
            "hook_matches": len(hook_matches),
            "memories_found": len(memories),
            "memories": memories,
            "summary": self._generate_summary(memories)
        }
        
        return response
    
    def _recall_simple(self, query: str, keywords: List[str]) -> Dict[str, Any]:
        """简化回忆模式"""
        memories = []
        
        # 检查核心记忆文件
        core_files = [
            ("core/IDENTITY.md", "身份"),
            ("core/RELATIONSHIPS.md", "关系"),
            ("core/VALUES.md", "价值观"),
            ("core/CONFIGURATION.md", "配置")
        ]
        
        # 检查事件文件
        event_files = []
        events_dir = Path(self.memory_root) / "events"
        if events_dir.exists():
            for md_file in events_dir.glob("*.md"):
                event_files.append((f"events/{md_file.name}", "事件"))
        
        # 检查知识文件
        knowledge_files = [
            ("knowledge/SECURITY_PRINCIPLES.md", "安全"),
            ("knowledge/NETWORK_CONFIG.md", "网络"),
            ("knowledge/SKILLS_KNOWLEDGE.md", "技能")
        ]
        
        # 所有文件
        all_files = core_files + event_files + knowledge_files
        
        # 简单匹配
        for file_path, category in all_files:
            full_path = Path(self.memory_root) / file_path
            if not full_path.exists():
                continue
            
            # 检查文件名是否包含关键词
            file_name = Path(file_path).stem.lower()
            for keyword in keywords:
                if keyword in file_name:
                    try:
                        with open(full_path, 'r', encoding='utf-8') as f:
                            content = f.read(300)  # 读取前300字符
                        
                        memories.append({
                            "keyword": keyword,
                            "file": file_path,
                            "category": category,
                            "content_preview": content
                        })
                        break  # 找到匹配就停止
                    except:
                        pass
        
        response = {
            "query": query,
            "keywords": keywords,
            "hook_matches": 0,
            "memories_found": len(memories),
            "memories": memories,
            "summary": self._generate_summary(memories),
            "mode": "simple"
        }
        
        return response
    
    def _generate_summary(self, memories: List[Dict]) -> str:
        """生成摘要"""
        if not memories:
            return "未找到相关记忆"
        
        summary_parts = []
        for memory in memories[:3]:  # 限制前3个
            category = memory["category"]
            file_name = Path(memory["file"]).stem
            summary_parts.append(f"📁 {category}: {file_name}")
        
        return "\n".join(summary_parts)
    
    def format_response(self, recall_result: Dict[str, Any]) -> str:
        """格式化响应为文本"""
        query = recall_result["query"]
        memories_found = recall_result["memories_found"]
        
        if memories_found == 0:
            return f"关于'{query}'，我没有找到相关的记忆。"
        
        # 构建响应
        response_parts = [f"🔍 关于'{query}'，我找到了{memories_found}个相关记忆："]
        
        for i, memory in enumerate(recall_result["memories"][:3], 1):  # 限制前3个
            category = memory["category"]
            file_name = Path(memory["file"]).stem
            preview = memory["content_preview"][:150].replace('\n', ' ')
            
            response_parts.append(f"\n{i}. **{category} - {file_name}**")
            response_parts.append(f"   {preview}...")
        
        # 添加摘要
        if "summary" in recall_result:
            response_parts.append(f"\n📋 记忆摘要：")
            response_parts.append(recall_result["summary"])
        
        return "\n".join(response_parts)
    
    def process_query(self, query: str) -> str:
        """处理查询 - 主入口点"""
        # 检查是否应该触发
        if not self.should_trigger(query):
            return ""
        
        # 回忆记忆
        recall_result = self.recall_memory(query)
        
        # 格式化响应
        response = self.format_response(recall_result)
        
        return response

# 测试函数
def test_skill():
    """测试回忆技能"""
    skill = MemoryRecallSkill()
    
    test_queries = [
        "你是谁？",
        "昨天完成了什么？",
        "外网怎么访问？",
        "安全原则是什么？",
        "南哥是谁？",
        "你有什么技能？"
    ]
    
    print("🧪 回忆技能测试")
    print("=" * 50)
    
    for query in test_queries:
        print(f"\n📝 查询: {query}")
        
        # 检查触发
        should_trigger = skill.should_trigger(query)
        print(f"   触发检查: {'✅' if should_trigger else '❌'}")
        
        if should_trigger:
            response = skill.process_query(query)
            if response:
                print(f"   响应: {response[:100]}...")
            else:
                print("   未生成响应")
        else:
            print("   不触发回忆技能")
    
    print("\n✅ 测试完成")

if __name__ == "__main__":
    # 如果是直接运行，执行测试
    test_skill()
else:
    # 如果是作为模块导入，创建技能实例
    memory_recall_skill = MemoryRecallSkill()