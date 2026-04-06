#!/usr/bin/env python3
"""
钩子匹配器 - 优化钩子匹配算法
按照OpenClaw最佳实践设计
"""

import re
import json
from typing import List, Dict, Tuple
from pathlib import Path

class HookMatcher:
    """钩子匹配器"""
    
    def __init__(self, hooks_dir: str = "/root/.openclaw/workspace/memory/hooks"):
        self.hooks_dir = Path(hooks_dir)
        self.hooks = self.load_all_hooks()
        self.synonyms = self.load_synonyms()
        
    def load_all_hooks(self) -> Dict:
        """加载所有钩子"""
        hooks = {}
        
        # 加载JSON钩子文件
        for json_file in self.hooks_dir.glob("*.json"):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    hook_data = json.load(f)
                    hook_type = hook_data.get("hook_type", json_file.stem)
                    hooks[hook_type] = hook_data
            except Exception as e:
                print(f"⚠️ 加载钩子文件 {json_file} 失败: {e}")
        
        return hooks
    
    def load_synonyms(self) -> Dict[str, List[str]]:
        """加载同义词表"""
        synonyms = {
            "谁": ["何人", "什么人", "哪位"],
            "什么": ["啥", "何事", "何物"],
            "怎么": ["如何", "怎样", "咋"],
            "为什么": ["为何", "为啥", "何故"],
            "完成": ["做完", "结束", "达成", "实现"],
            "昨天": ["昨日", "前一天"],
            "今天": ["今日", "本日"],
            "明天": ["明日", "次日"],
            "安全": ["安保", "防护", "保护"],
            "代理": ["代理服务器", "proxy", "中转"],
            "技能": ["能力", "功能", "本领"],
            "记忆": ["回忆", "记住", "记忆系统"]
        }
        return synonyms
    
    def normalize_query(self, query: str) -> str:
        """标准化查询"""
        # 转换为小写
        query = query.lower()
        
        # 替换同义词
        for word, syn_list in self.synonyms.items():
            for syn in syn_list:
                if syn in query:
                    query = query.replace(syn, word)
        
        return query
    
    def extract_ngrams(self, text: str, n: int = 2) -> List[str]:
        """提取n-gram"""
        words = re.findall(r'\b\w+\b', text)
        ngrams = []
        
        for i in range(len(words) - n + 1):
            ngram = " ".join(words[i:i+n])
            ngrams.append(ngram)
        
        return ngrams
    
    def calculate_similarity(self, query: str, keyword: str) -> float:
        """计算相似度"""
        # 简单相似度计算
        if keyword in query:
            return 1.0
        
        # 检查n-gram匹配
        query_ngrams = self.extract_ngrams(query, 2)
        keyword_ngrams = self.extract_ngrams(keyword, 2)
        
        common_ngrams = set(query_ngrams) & set(keyword_ngrams)
        if common_ngrams:
            return 0.8
        
        # 检查字符重叠
        query_chars = set(query)
        keyword_chars = set(keyword)
        overlap = len(query_chars & keyword_chars)
        total = len(query_chars | keyword_chars)
        
        if total > 0:
            return overlap / total
        
        return 0.0
    
    def match_hooks_advanced(self, query: str) -> List[Dict]:
        """高级钩子匹配"""
        normalized_query = self.normalize_query(query)
        matches = []
        
        for hook_type, hook_data in self.hooks.items():
            keywords = hook_data.get("keywords", [])
            priority = hook_data.get("priority", 3)
            
            for keyword in keywords:
                similarity = self.calculate_similarity(normalized_query, keyword)
                
                if similarity > 0.3:  # 相似度阈值
                    matches.append({
                        "hook_type": hook_type,
                        "keyword": keyword,
                        "similarity": similarity,
                        "priority": priority,
                        "score": similarity * (1.0 / priority)  # 优先级越高，分数越高
                    })
        
        # 按分数排序
        matches.sort(key=lambda x: x["score"], reverse=True)
        return matches
    
    def get_contextual_hooks(self, query: str, conversation_history: List[str] = None) -> List[Dict]:
        """获取上下文相关的钩子"""
        matches = self.match_hooks_advanced(query)
        
        # 如果有对话历史，考虑上下文
        if conversation_history and len(conversation_history) > 0:
            last_query = conversation_history[-1]
            last_matches = self.match_hooks_advanced(last_query)
            
            # 如果上一个查询匹配了某个钩子类型，提高该类型的分数
            if last_matches:
                last_hook_type = last_matches[0]["hook_type"]
                for match in matches:
                    if match["hook_type"] == last_hook_type:
                        match["score"] *= 1.2  # 提高20%分数
        
        return matches[:5]  # 返回前5个最佳匹配
    
    def generate_hook_suggestions(self, query: str) -> List[str]:
        """生成钩子建议"""
        matches = self.match_hooks_advanced(query)
        
        if not matches:
            return ["未找到相关钩子"]
        
        suggestions = []
        seen_types = set()
        
        for match in matches[:3]:
            hook_type = match["hook_type"]
            if hook_type not in seen_types:
                seen_types.add(hook_type)
                
                # 获取该类型的所有关键词
                hook_data = self.hooks.get(hook_type, {})
                all_keywords = hook_data.get("keywords", [])
                
                # 生成建议
                suggestion = f"🔗 {hook_type}钩子: {', '.join(all_keywords[:3])}"
                if len(all_keywords) > 3:
                    suggestion += f" 等{len(all_keywords)}个关键词"
                suggestions.append(suggestion)
        
        return suggestions
    
    def analyze_query_pattern(self, query: str) -> Dict:
        """分析查询模式"""
        patterns = {
            "identity_query": r"(谁|什么.*名字|你.*谁|身份|我是谁)",
            "knowledge_query": r"(什么.*是|怎么|如何|为什么|原因)",
            "event_query": r"(什么.*时候|何时|日期|时间|昨天|今天|明天)",
            "action_query": r"(做.*什么|完成.*什么|执行.*什么|任务)",
            "configuration_query": r"(设置|配置|怎么.*设置|如何.*配置)"
        }
        
        pattern_matches = {}
        for pattern_name, pattern in patterns.items():
            if re.search(pattern, query, re.IGNORECASE):
                pattern_matches[pattern_name] = True
        
        return pattern_matches

def test_hook_matcher():
    """测试钩子匹配器"""
    matcher = HookMatcher()
    
    test_queries = [
        "你是谁？",
        "昨天完成了什么？",
        "外网怎么访问？",
        "安全原则是什么？",
        "你有什么技能？",
        "南哥是谁？",
        "怎么设置代理？",
        "记忆系统怎么用？"
    ]
    
    print("🧪 钩子匹配器测试")
    print("=" * 50)
    
    for query in test_queries:
        print(f"\n📝 查询: {query}")
        
        # 分析查询模式
        patterns = matcher.analyze_query_pattern(query)
        if patterns:
            print(f"   📊 查询模式: {', '.join(patterns.keys())}")
        
        # 匹配钩子
        matches = matcher.match_hooks_advanced(query)
        if matches:
            print(f"   🔗 匹配钩子: {len(matches)} 个")
            for i, match in enumerate(matches[:2], 1):
                print(f"      {i}. {match['hook_type']} - {match['keyword']} (相似度: {match['similarity']:.2f})")
        else:
            print("   ❌ 未匹配到钩子")
        
        # 生成建议
        suggestions = matcher.generate_hook_suggestions(query)
        if suggestions and "未找到" not in suggestions[0]:
            print(f"   💡 建议: {suggestions[0]}")

if __name__ == "__main__":
    test_hook_matcher()