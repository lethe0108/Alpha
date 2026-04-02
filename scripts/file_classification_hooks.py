#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文件分类 Hook 系统
用于统一管理文件分类规则，让所有 Session 都能按规则查找文件

创建时间：2026-03-18
状态：✅ 全局可用
"""

import os
import json
import shutil
import fnmatch
from datetime import datetime
from pathlib import Path

# 基础路径
WORKSPACE_BASE = "/root/.openclaw/workspace"

# 分类目录定义
CATEGORIES = {
    '01-core': {
        'name': '核心配置',
        'description': '系统核心配置文件',
        'patterns': ['AGENTS.md', 'SOUL.md', 'USER.md', 'IDENTITY.md', 
                     'TOOLS.md', 'HEARTBEAT.md', 'BOOTSTRAP.md', 'MEMORY.md'],
        'keywords': ['core', 'identity', 'soul', 'agents', 'user']
    },
    
    '02-principles': {
        'name': '原则和规范',
        'description': '核心原则、最佳实践、经验教训',
        'patterns': ['lessons_*', '*_BEST_PRACTICES*', '*_PRINCIPLES*'],
        'keywords': ['principles', 'lessons', 'best practices', 'security']
    },
    
    '03-backup': {
        'name': '备份相关',
        'description': '备份系统文档和清单',
        'patterns': ['ALPHA_BACKUP_*', 'BACKUP_*'],
        'keywords': ['backup', 'alpha', 'manifest']
    },
    
    '04-projects': {
        'name': '项目相关',
        'description': '项目计划、进度、总结',
        'patterns': ['POT_*', 'PROJECT_*', 'project_*'],
        'keywords': ['project', 'pot', 'prompt', 'development']
    },
    
    '05-feishu': {
        'name': '飞书相关',
        'description': '飞书集成、配置、文档',
        'patterns': ['FEISHU_*', 'feishu_*'],
        'keywords': ['feishu', 'lark', 'oauth', 'token']
    },
    
    '06-github': {
        'name': 'GitHub 相关',
        'description': 'GitHub 配置、脚本、报告',
        'patterns': ['GITHUB_*', 'github_*', '*_github*'],
        'keywords': ['github', 'git', 'repo', 'commit']
    },
    
    '07-reports': {
        'name': '报告文档',
        'description': '各类报告、部署指南、修复报告',
        'patterns': ['*_REPORT*', '*_SUMMARY*', '*_STATUS*', 'DEPLOYMENT_*'],
        'keywords': ['report', 'summary', 'status', 'deployment', 'fix']
    },
    
    '08-scripts': {
        'name': '脚本文件',
        'description': 'Shell 脚本、Python 脚本',
        'extensions': ['.sh', '.py', '.bash'],
        'keywords': ['script', 'automation', 'tool']
    },
    
    '09-config': {
        'name': '配置文件',
        'description': 'JSON 配置、文本配置、记录',
        'extensions': ['.json', '.txt', '.yaml', '.yml', '.toml'],
        'keywords': ['config', 'setting', 'profile']
    },
    
    '10-research': {
        'name': '研究报告',
        'description': '技术调研、架构设计、计划',
        'patterns': ['*_RESEARCH*', '*_STUDY*', '*_ANALYSIS*', 'EVOMAP_*'],
        'keywords': ['research', 'study', 'analysis', 'architecture', 'plan']
    },
    
    '11-session-sync': {
        'name': 'Session 同步',
        'description': 'Session 同步、记忆同步、状态管理',
        'patterns': ['*_SYNC_*', 'session_*', 'MEMORY_*', 'SYNC_*'],
        'keywords': ['session', 'sync', 'memory', 'state']
    }
}

# 原有系统目录 (保持不变)
SYSTEM_DIRS = [
    'backend', 'docs', 'input-method', 'memory', 'miniprogram',
    'net-slang-tool', 'prompt-master', 'projects', 'skills',
    'stock-screening-guide'
]


def guess_category(filename):
    """
    根据文件名猜测分类
    
    参数:
        filename: 文件名
    
    返回:
        分类目录名或 None
    """
    filename_upper = filename.upper()
    
    # 检查精确匹配
    for category, config in CATEGORIES.items():
        if 'patterns' in config:
            for pattern in config['patterns']:
                if fnmatch.fnmatch(filename_upper, pattern.upper()):
                    return category
    
    # 检查扩展名
    for category, config in CATEGORIES.items():
        if 'extensions' in config:
            for ext in config['extensions']:
                if filename.lower().endswith(ext):
                    return category
    
    # 检查关键词
    for category, config in CATEGORIES.items():
        if 'keywords' in config:
            for keyword in config['keywords']:
                if keyword.lower() in filename.lower():
                    return category
    
    return None


def find_file(keyword):
    """
    查找文件
    
    参数:
        keyword: 文件名或关键词
    
    返回:
        文件路径列表
    """
    results = []
    
    # 1. 精确匹配
    for category in CATEGORIES:
        path = os.path.join(WORKSPACE_BASE, category, keyword)
        if os.path.exists(path):
            results.append({
                'path': path,
                'category': category,
                'match_type': 'exact'
            })
    
    # 2. 在系统目录中搜索
    for system_dir in SYSTEM_DIRS:
        dir_path = os.path.join(WORKSPACE_BASE, system_dir)
        if os.path.exists(dir_path):
            for root, dirs, files in os.walk(dir_path):
                for file in files:
                    if keyword.lower() in file.lower():
                        results.append({
                            'path': os.path.join(root, file),
                            'category': system_dir,
                            'match_type': 'fuzzy'
                        })
    
    # 3. 模式匹配
    if not results:
        for category, config in CATEGORIES.items():
            if 'patterns' in config:
                dir_path = os.path.join(WORKSPACE_BASE, category)
                if os.path.exists(dir_path):
                    for file in os.listdir(dir_path):
                        for pattern in config['patterns']:
                            if fnmatch.fnmatch(file.upper(), pattern.upper()):
                                if keyword.upper() in file.upper():
                                    results.append({
                                        'path': os.path.join(dir_path, file),
                                        'category': category,
                                        'match_type': 'pattern'
                                    })
    
    return results


def move_to_category(filepath):
    """
    将文件移动到正确的分类目录
    
    参数:
        filepath: 文件路径
    
    返回:
        新路径或原路径
    """
    filename = os.path.basename(filepath)
    category = guess_category(filename)
    
    if not category:
        print(f"⚠️  无法分类：{filename}")
        return filepath
    
    # 目标路径
    dest_dir = os.path.join(WORKSPACE_BASE, category)
    dest_path = os.path.join(dest_dir, filename)
    
    # 如果已经在正确位置，返回
    if filepath == dest_path:
        return filepath
    
    # 确保目标目录存在
    os.makedirs(dest_dir, exist_ok=True)
    
    # 移动文件
    shutil.move(filepath, dest_path)
    print(f"✓ 移动：{filename} → {category}/")
    
    return dest_path


def list_category_files(category):
    """
    列出分类目录中的所有文件
    
    参数:
        category: 分类目录名
    
    返回:
        文件列表
    """
    if category not in CATEGORIES:
        return []
    
    dir_path = os.path.join(WORKSPACE_BASE, category)
    if not os.path.exists(dir_path):
        return []
    
    return os.listdir(dir_path)


def update_file_index():
    """更新文件索引"""
    index_path = os.path.join(WORKSPACE_BASE, "FILE_INDEX.json")
    index = {
        "version": "1.0",
        "updated_at": datetime.now().isoformat(),
        "files": {},
        "categories": {}
    }
    
    # 扫描所有分类目录
    for category in CATEGORIES:
        dir_path = os.path.join(WORKSPACE_BASE, category)
        if not os.path.exists(dir_path):
            continue
        
        files = os.listdir(dir_path)
        index["categories"][category] = {
            "file_count": len(files),
            "files": []
        }
        
        for filename in files:
            filepath = os.path.join(dir_path, filename)
            if os.path.isfile(filepath):
                file_stat = os.stat(filepath)
                index["files"][filename] = {
                    "path": filepath,
                    "category": category,
                    "size": file_stat.st_size,
                    "updated_at": datetime.fromtimestamp(file_stat.st_mtime).isoformat()
                }
                index["categories"][category]["files"].append(filename)
    
    # 保存索引
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index, f, indent=2, ensure_ascii=False)
    
    print(f"✓ 索引已更新：{index_path}")
    return index


def main():
    """主函数 - 演示用法"""
    print("=" * 60)
    print("文件分类 Hook 系统")
    print("=" * 60)
    
    # 示例 1: 查找文件
    print("\n📍 查找 AGENTS.md:")
    results = find_file("AGENTS.md")
    for result in results:
        print(f"  ✓ {result['path']} ({result['category']})")
    
    # 示例 2: 列出分类
    print("\n📁 01-core 目录文件:")
    files = list_category_files("01-core")
    for file in files[:10]:  # 只显示前 10 个
        print(f"  - {file}")
    
    # 示例 3: 更新索引
    print("\n🔄 更新文件索引:")
    index = update_file_index()
    print(f"  总文件数：{len(index['files'])}")
    print(f"  分类数：{len(index['categories'])}")


if __name__ == "__main__":
    main()
