#!/usr/bin/env python3
"""
心跳记忆审查 - 每次心跳自动审查记忆层级
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime

sys.path.insert(0, '/root/.openclaw/scripts')
from memory-tier-manager import MemoryTierManager

def heartbeat_review():
    """心跳审查"""
    print("=" * 60)
    print("🧠 Self-Improving 心跳审查 - 记忆层级管理")
    print("=" * 60)
    
    manager = MemoryTierManager()
    
    # 执行分层（不实际移动，只检查）
    moves = manager.run_tiering(dry_run=True)
    
    # 更新心跳状态
    heartbeat_state = Path("/root/.openclaw/workspace/heartbeat-state.md")
    if heartbeat_state.exists():
        content = heartbeat_state.read_text(encoding='utf-8')
        
        # 添加审查记录
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        new_line = f"| {timestamp} | {moves} | 0 | 0 | 0 |\n"
        
        # 找到审查历史部分并添加
        if "### 审查历史" in content:
            lines = content.split("\n")
            for i, line in enumerate(lines):
                if "| 日期 | 纠正审查 |" in line:
                    # 在表头后插入新行
                    lines.insert(i + 2, new_line.strip())
                    break
            
            heartbeat_state.write_text("\n".join(lines), encoding='utf-8')
            print(f"\n✅ 心跳状态已更新")
    
    print("\n" + "=" * 60)
    print(f"心跳审查完成 - 发现 {moves} 个需要调整的文件")
    print("=" * 60)
    
    return moves

if __name__ == "__main__":
    moves = heartbeat_review()
    sys.exit(0)
