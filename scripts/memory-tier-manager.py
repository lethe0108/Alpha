#!/usr/bin/env python3
"""
记忆分层管理器 - 自动管理记忆文件层级
基于访问频率自动将记忆文件分配到 HOT/WARM/COLD/ARCHIVE 层
"""

import os
import json
import gzip
import shutil
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional

class MemoryTierManager:
    """记忆分层管理器"""
    
    def __init__(self, memory_root: str = "/root/.openclaw/workspace/memory"):
        self.memory_root = Path(memory_root)
        self.index_file = self.memory_root / "memory_index.json"
        self.index = self.load_index()
        
        # 层级目录
        self.tier_dirs = {
            "hot": self.memory_root / "hot",
            "warm": self.memory_root / "warm",
            "cold": self.memory_root / "cold",
            "archive": self.memory_root / "archive"
        }
        
        # 确保目录存在
        for dir_path in self.tier_dirs.values():
            dir_path.mkdir(exist_ok=True)
    
    def load_index(self) -> Dict:
        """加载索引文件"""
        if self.index_file.exists():
            with open(self.index_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {
            "version": "1.0.0",
            "created_at": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat(),
            "tiers": {},
            "files": {},
            "access_log": []
        }
    
    def save_index(self):
        """保存索引文件"""
        self.index["last_updated"] = datetime.now().isoformat()
        with open(self.index_file, 'w', encoding='utf-8') as f:
            json.dump(self.index, f, indent=2, ensure_ascii=False)
    
    def scan_memory_files(self) -> List[Dict]:
        """扫描记忆文件"""
        files = []
        
        # 扫描根目录的 .md 文件
        for md_file in self.memory_root.glob("*.md"):
            if md_file.name in ["MEMORY.md", "memory_index.json"]:
                continue
            
            stat = md_file.stat()
            files.append({
                "name": md_file.name,
                "path": str(md_file),
                "size": stat.st_size,
                "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "access_count": self.index.get("files", {}).get(md_file.name, {}).get("access_count", 0),
                "last_accessed": self.index.get("files", {}).get(md_file.name, {}).get("last_accessed", None),
                "current_tier": self.get_current_tier(md_file)
            })
        
        return files
    
    def get_current_tier(self, file_path: Path) -> str:
        """获取文件当前所在层级"""
        for tier_name, tier_dir in self.tier_dirs.items():
            try:
                file_path.relative_to(tier_dir)
                return tier_name
            except ValueError:
                continue
        return "root"  # 根目录
    
    def determine_tier(self, file_info: Dict) -> str:
        """根据访问频率确定文件应该在哪层"""
        access_count = file_info.get("access_count", 0)
        last_accessed = file_info.get("last_accessed")
        
        # 从未访问或访问次数为 0
        if access_count == 0:
            return "cold"
        
        # 解析最后访问时间
        if last_accessed:
            try:
                last_access = datetime.fromisoformat(last_accessed)
                days_since_access = (datetime.now() - last_access).days
                
                # 最近 7 天访问过且访问次数 >= 3
                if days_since_access <= 7 and access_count >= 3:
                    return "hot"
                
                # 最近 30 天访问过
                if days_since_access <= 30:
                    return "warm"
                
                # 超过 30 天未访问
                if days_since_access > 30:
                    return "cold"
            except:
                pass
        
        # 默认根据访问次数
        if access_count >= 3:
            return "warm"
        elif access_count >= 1:
            return "cold"
        else:
            return "cold"
    
    def move_to_tier(self, file_info: Dict, target_tier: str, dry_run: bool = False):
        """移动文件到指定层级"""
        file_path = Path(file_info["path"])
        file_name = file_info["name"]
        
        # 确定目标目录
        if target_tier == "archive":
            target_dir = self.tier_dirs["archive"]
            # 压缩
            if not dry_run:
                target_path = target_dir / f"{file_name}.gz"
                with open(file_path, 'rb') as f_in:
                    with gzip.open(target_path, 'wb') as f_out:
                        shutil.copyfileobj(f_in, f_out)
                # 删除原文件
                file_path.unlink()
                print(f"  📦 归档：{file_name} -> {target_path.name} (压缩)")
            else:
                print(f"  [DRY RUN] 归档：{file_name}")
        else:
            target_dir = self.tier_dirs[target_tier]
            if not dry_run:
                target_path = target_dir / file_name
                # 如果目标已存在，先删除
                if target_path.exists():
                    target_path.unlink()
                # 移动文件
                shutil.move(str(file_path), str(target_path))
                print(f"  📁 移动：{file_name} -> {target_tier}/")
            else:
                print(f"  [DRY RUN] 移动：{file_name} -> {target_tier}/")
        
        # 更新索引
        if not dry_run:
            if "files" not in self.index:
                self.index["files"] = {}
            
            if file_name not in self.index["files"]:
                self.index["files"][file_name] = {}
            
            self.index["files"][file_name]["tier"] = target_tier
            self.index["files"][file_name]["path"] = str(target_dir / (f"{file_name}.gz" if target_tier == "archive" else file_name))
            self.index["files"][file_name]["last_tier_change"] = datetime.now().isoformat()
    
    def run_tiering(self, dry_run: bool = False):
        """执行分层管理"""
        print("=" * 60)
        print("记忆分层管理器 - 开始执行")
        print("=" * 60)
        
        # 扫描文件
        files = self.scan_memory_files()
        print(f"\n📊 扫描到 {len(files)} 个记忆文件")
        
        # 统计
        tier_stats = {"hot": 0, "warm": 0, "cold": 0, "archive": 0, "root": 0}
        moves = []
        
        # 分析每个文件
        for file_info in files:
            current_tier = file_info["current_tier"]
            target_tier = self.determine_tier(file_info)
            
            tier_stats[current_tier] = tier_stats.get(current_tier, 0) + 1
            
            # 需要移动
            if current_tier != target_tier:
                moves.append((file_info, target_tier))
        
        # 打印统计
        print(f"\n📈 当前层级分布:")
        for tier, count in tier_stats.items():
            if count > 0:
                print(f"   {tier.upper()}: {count} 个文件")
        
        # 执行移动
        if moves:
            print(f"\n🔄 需要移动 {len(moves)} 个文件:")
            for file_info, target_tier in moves:
                self.move_to_tier(file_info, target_tier, dry_run)
        else:
            print(f"\n✅ 所有文件已在正确层级，无需移动")
        
        # 保存索引
        if not dry_run and moves:
            self.save_index()
            print(f"\n💾 索引已更新")
        
        print("\n" + "=" * 60)
        print("记忆分层管理完成")
        print("=" * 60)
        
        return len(moves)

if __name__ == "__main__":
    import sys
    
    dry_run = "--dry-run" in sys.argv
    manager = MemoryTierManager()
    moves = manager.run_tiering(dry_run=dry_run)
    
    if dry_run:
        print(f"\n⚠️  这是预演模式，没有实际移动文件")
        print(f"   运行不带 --dry-run 参数执行实际移动")
    
    sys.exit(0 if moves >= 0 else 1)
