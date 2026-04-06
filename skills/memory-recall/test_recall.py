#!/usr/bin/env python3
"""
回忆技能测试脚本
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from recall import MemoryRecallSkill

def test_integration():
    """集成测试"""
    print("🧪 回忆技能集成测试")
    print("=" * 50)
    
    # 创建技能实例
    skill = MemoryRecallSkill()
    
    # 测试触发条件
    test_cases = [
        ("你是谁？", True, "身份查询"),
        ("昨天完成了什么？", True, "事件查询"),
        ("外网怎么访问？", True, "知识查询"),
        ("安全原则是什么？", True, "安全查询"),
        ("今天天气怎么样？", False, "非记忆查询"),
        ("帮我写个代码", False, "非记忆查询")
    ]
    
    print("\n📊 触发条件测试:")
    for query, expected, description in test_cases:
        result = skill.should_trigger(query)
        status = "✅" if result == expected else "❌"
        print(f"  {status} {description}: '{query}' -> {result} (期望: {expected})")
    
    # 测试回忆功能
    print("\n🔍 回忆功能测试:")
    recall_queries = [
        "你是谁？",
        "昨天完成了什么？",
        "外网怎么访问？",
        "安全原则是什么？"
    ]
    
    for query in recall_queries:
        print(f"\n📝 查询: '{query}'")
        
        # 处理查询
        response = skill.process_query(query)
        
        if response:
            print(f"✅ 生成响应 ({len(response)} 字符)")
            # 显示前200字符
            preview = response[:200] + "..." if len(response) > 200 else response
            print(f"   预览: {preview}")
        else:
            print("❌ 未生成响应")
    
    # 测试关键词提取
    print("\n📝 关键词提取测试:")
    test_queries = [
        "你是谁？",
        "昨天完成了什么重要任务？",
        "怎么设置外网代理访问？"
    ]
    
    for query in test_queries:
        keywords = skill.extract_keywords(query)
        print(f"  '{query}' -> {keywords}")
    
    print("\n✅ 集成测试完成")

def test_performance():
    """性能测试"""
    import time
    
    print("\n⚡ 性能测试")
    print("=" * 50)
    
    skill = MemoryRecallSkill()
    test_queries = [
        "你是谁？",
        "昨天完成了什么？",
        "外网怎么访问？",
        "安全原则是什么？",
        "你有什么技能？"
    ]
    
    total_time = 0
    successful = 0
    
    for query in test_queries:
        start_time = time.time()
        response = skill.process_query(query)
        end_time = time.time()
        
        elapsed = end_time - start_time
        total_time += elapsed
        
        if response:
            successful += 1
            status = "✅"
        else:
            status = "❌"
        
        print(f"{status} '{query}' - {elapsed:.3f}秒")
    
    avg_time = total_time / len(test_queries)
    success_rate = successful / len(test_queries) * 100
    
    print(f"\n📊 性能统计:")
    print(f"  平均响应时间: {avg_time:.3f}秒")
    print(f"  成功率: {success_rate:.1f}%")
    print(f"  总测试时间: {total_time:.3f}秒")
    
    # 性能要求
    assert avg_time < 1.0, f"平均响应时间 {avg_time:.3f}秒 超过1秒限制"
    assert success_rate >= 80, f"成功率 {success_rate:.1f}% 低于80%要求"
    
    print("✅ 性能测试通过")

if __name__ == "__main__":
    print("🧠 回忆技能测试套件")
    print("=" * 50)
    
    try:
        test_integration()
        test_performance()
        print("\n🎉 所有测试通过！回忆技能已准备好使用。")
    except AssertionError as e:
        print(f"\n❌ 测试失败: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 测试出错: {e}")
        sys.exit(1)