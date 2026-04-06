#!/usr/bin/env python3
"""
记忆检索器 - 高效检索记忆内容
按照OpenClaw最佳实践设计
"""

import os
import re
import json
from typing import List, Dict, Optional
from pathlib import Path
from datetime import datetime

class MemoryRetriever:
    """记忆检索器"""
    
    def __init__(self, memory_root: str = "/root/.openclaw/workspace/memory"):
        self.memory_root = Path(memory_root)
        self.memory_index = self.build_memory_index()
        self.access_log = []
        
    def build_memory_index(self) -> Dict:
        """构建记忆索引"""
        index = {
            "core": {},
            "events": {},
            "knowledge": {},
            "hooks": {},
            "files": []
        }
        
        # 索引核心记忆
        core_dir = self.memory_root / "core"
        if core_dir.exists():
            for md_file in core_dir.glob("*.md"):
                index["core"][md_file.stem] = {
                    "path": str(md_file.relative_to(self.memory_root)),
                    "size": md_file.stat().st_size,
                    "modified": datetime.fromtimestamp(md_file.stat().st_mtime).isoformat()
                }
                index["files"].append(str(md_file.relative_to(self.memory_root)))
        
        # 索引事件记忆
        events_dir = self.memory_root / "events"
        if events_dir.exists():
            for md_file in events_dir.glob("*.md"):
                index["events"][md_file.stem] = {
                    "path": str(md_file.relative_to(self.memory_root)),
                    "size": md_file.stat().st_size,
                    "modified": datetime.fromtimestamp(md_file.stat().st_mtime).isoformat()
                }
                index["files"].append(str(md_file.relative_to(self.memory_root)))
        
        # 索引知识记忆
        knowledge_dir = self.memory_root / "knowledge"
        if knowledge_dir.exists():
            for md_file in knowledge_dir.glob("*.md"):
                index["knowledge"][md_file.stem] = {
                    "path": str(md_file.relative_to(self.memory_root)),
                    "size": md_file.stat().st_size,
                    "modified": datetime.fromtimestamp(md_file.stat().st_mtime).isoformat()
                }
                index["files"].append(str(md_file.relative_to(self.memory_root)))
        
        # 索引钩子文件
        hooks_dir = self.memory_root / "hooks"
        if hooks_dir.exists():
            for json_file in hooks_dir.glob("*.json"):
                index["hooks"][json_file.stem] = {
                    "path": str(json_file.relative_to(self.memory_root)),
                    "size": json_file.stat().st_size,
                    "modified": datetime.fromtimestamp(json_file.stat().st_mtime).isoformat()
                }
                index["files"].append(str(json_file.relative_to(self.memory_root)))
        
        return index
    
    def log_access(self, file_path: str, query: str = ""):
        """记录访问日志"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "file": file_path,
            "query": query,
            "access_count": 1
        }
        self.access_log.append(log_entry)
        
        # 限制日志大小
        if len(self.access_log) > 100:
            self.access_log = self.access_log[-50:]
    
    def search_by_keyword(self, keyword: str, category: str = None) -> List[Dict]:
        """按关键词搜索"""
        results = []
        
        # 确定搜索范围
        categories_to_search = []
        if category:
            if category in self.memory_index:
                categories_to_search = [category]
            else:
                return results
        else:
            categories_to_search = ["core", "events", "knowledge"]
        
        for cat in categories_to_search:
            for file_name, file_info in self.memory_index.get(cat, {}).items():
                file_path = self.memory_root / file_info["path"]
                
                # 检查文件名是否包含关键词
                if keyword.lower() in file_name.lower():
                    results.append({
                        "category": cat,
                        "file": file_info["path"],
                        "match_type": "filename",
                        "relevance": 0.9
                    })
                    continue
                
                # 检查文件内容
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # 简单的内容匹配
                    if keyword.lower() in content.lower():
                        # 计算相关性（简单版本）
                        count = content.lower().count(keyword.lower())
                        relevance = min(0.1 + count * 0.1, 0.8)
                        
                        results.append({
                            "category": cat,
                            "file": file_info["path"],
                            "match_type": "content",
                            "relevance": relevance,
                            "count": count
                        })
                except Exception as e:
                    print(f"⚠️ 读取文件 {file_path} 失败: {e}")
        
        # 按相关性排序
        results.sort(key=lambda x: x["relevance"], reverse=True)
        return results
    
    def get_file_content(self, file_path: str, max_lines: int = 20) -> Optional[Dict]:
        """获取文件内容"""
        full_path = self.memory_root / file_path
        if not full_path.exists():
            return None
        
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            # 记录访问
            self.log_access(file_path)
            
            return {
                "path": file_path,
                "total_lines": len(lines),
                "content": "".join(lines[:max_lines]),
                "preview": "".join(lines[:5]) if len(lines) > 5 else "".join(lines)
            }
        except Exception as e:
            return {"error": str(e)}
    
    def get_related_memories(self, file_path: str) -> List[Dict]:
        """获取相关记忆"""
        related = []
        
        # 从钩子索引中查找相关文件
        hooks_index_path = self.memory_root / "HOOKS_INDEX.md"
        if hooks_index_path.exists():
            try:
                with open(hooks_index_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 简单查找相关文件（实际应该解析MARKDOWN）
                # 这里简化处理
                pass
            except:
                pass
        
        return related
    
    def get_memory_stats(self) -> Dict:
        """获取记忆统计"""
        stats = {
            "total_files": len(self.memory_index["files"]),
            "core_files": len(self.memory_index["core"]),
            "event_files": len(self.memory_index["events"]),
            "knowledge_files": len(self.memory_index["knowledge"]),
            "hook_files": len(self.memory_index["hooks"]),
            "total_access": len(self.access_log),
            "recent_access": self.access_log[-10:] if self.access_log else []
        }
        
        # 计算文件大小
        total_size = 0
        for cat in ["core", "events", "knowledge", "hooks"]:
            for file_info in self.memory_index.get(cat, {}).values():
                total_size += file_info.get("size", 0)
        
        stats["total_size_bytes"] = total_size
        stats["total_size_mb"] = total_size / (1024 * 1024)
        
        return stats
    
    def search_contextual(self, query: str, history: List[str] = None) -> List[Dict]:
        """上下文搜索"""
        # 提取查询中的实体和关键词
        entities = self.extract_entities(query)
        keywords = self.extract_keywords(query)
        
        results = []
        
        # 基于实体的搜索
        for entity in entities:
            entity_results = self.search_by_keyword(entity)
            for result in entity_results:
                result["match_reason"] = f"实体匹配: {entity}"
                results.append(result)
        
        # 基于关键词的搜索
        for keyword in keywords:
            keyword_results = self.search_by_keyword(keyword)
            for result in keyword_results:
                result["match_reason"] = f"关键词匹配: {keyword}"
                results.append(result)
        
        # 去重和排序
        unique_results = {}
        for result in results:
            key = result["file"]
            if key not in unique_results or result["relevance"] > unique_results[key]["relevance"]:
                unique_results[key] = result
        
        sorted_results = sorted(unique_results.values(), key=lambda x: x["relevance"], reverse=True)
        return sorted_results[:10]  # 返回前10个结果
    
    def extract_entities(self, text: str) -> List[str]:
        """提取实体"""
        entities = []
        
        # 简单实体提取（实际应该用NLP）
        patterns = {
            "person": r"(南哥|婷姐|小p|Alpha)",
            "date": r"(\d{4}-\d{2}-\d{2}|昨天|今天|明天|前天|后天)",
            "config": r"(US01|10808|10809|代理|SOCKS5|HTTP)",
            "skill": r"(自我进化|工作流|飞书|技能)"
        }
        
        for entity_type, pattern in patterns.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            entities.extend(matches)
        
        return list(set(entities))
    
    def extract_keywords(self, text: str) -> List[str]:
        """提取关键词"""
        # 移除常见词
        stop_words = {'的', '了', '在', '是', '我', '有', '和', '就', '都', '而', '及', '与', '着', '或'}
        
        words = re.findall(r'\b\w+\b', text.lower())
        keywords = [word for word in words if word not in stop_words and len(word) > 1]
        
        return list(set(keywords))

def test_memory_retriever():
    """测试记忆检索器"""
    retriever = MemoryRetriever()
    
    print("🧪 记忆检索器测试")
    print("=" * 50)
    
    # 显示统计信息
    stats = retriever.get_memory_stats()
    print(f"📊 记忆系统统计:")
    print(f"   总文件数: {stats['total_files']}")
    print(f"   核心记忆: {stats['core_files']} 个文件")
    print(f"   事件记忆: {stats['event_files']} 个文件")
    print(f"   知识记忆: {stats['knowledge_files']} 个文件")
    print(f"   钩子文件: {stats['hook_files']} 个文件")
    print(f"   总大小: {stats['total_size_mb']:.2f} MB")
    
    # 测试搜索
    test_searches = [
        "身份",
        "安全",
        "外网",
        "2026-03-15",
        "南哥"
    ]
    
    print(f"\n🔍 搜索测试:")
    for search_term in test_searches:
        print(f"\n  搜索: '{search_term}'")
        results = retriever.search_by_keyword(search_term)
        
        if results:
            for i, result in enumerate(results[:3], 1):
                print(f"    {i}. {result['file']} ({result['category']}) - 相关性: {result['relevance']:.2f}")
        else:
            print("   未找到结果")
    
    # 测试获取文件内容
    print(f"\n📄 文件内容测试:")
    test_files = ["core/IDENTITY.md", "knowledge/SECURITY_PRINCIPLES.md"]
    
    for file_path in test_files:
        print(f"\n  读取: {file_path}")
        content = retriever.get_file_content(file_path, max_lines=3)
        
        if content and "error" not in content:
            print(f"   行数: {content['total_lines']}")
            print(f"   预览: {content['preview'][:100]}...")
        else:
            print(f"   读取失败: {content.get('error', '文件不存在')}")

if __name__ == "__main__":
    test_memory_retriever()