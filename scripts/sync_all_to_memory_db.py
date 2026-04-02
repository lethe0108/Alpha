#!/usr/bin/env python3
"""
全量记忆同步脚本
将所有 Markdown 文件内容同步到记忆数据库
"""

import subprocess
import os
from sentence_transformers import SentenceTransformer
from datetime import datetime
import hashlib

# 设置代理
os.environ['HTTP_PROXY'] = 'http://127.0.0.1:10809'
os.environ['HTTPS_PROXY'] = 'http://127.0.0.1:10809'

# 配置
MEMORY_ROOT = '/root/.openclaw/workspace/memory'
EXCLUDE_DIRS = ['recall', '__pycache__']
MODEL_NAME = 'paraphrase-multilingual-MiniLM-L12-v2'

def load_model():
    """加载模型"""
    print(f"📥 加载模型：{MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)
    print(f"✅ 模型加载完成")
    return model

def run_sql(sql):
    """执行 SQL"""
    cmd = f"sudo -u postgres psql -d memory_db -t -A -c \"{sql}\""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout.strip()

def get_file_hash(content):
    """生成文件内容哈希"""
    return hashlib.md5(content.encode()).hexdigest()

def read_markdown_files(root_dir):
    """读取所有 Markdown 文件"""
    files = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # 跳过排除目录
        for exclude in EXCLUDE_DIRS:
            if exclude in dirnames:
                dirnames.remove(exclude)
        
        for filename in filenames:
            if filename.endswith('.md'):
                filepath = os.path.join(dirpath, filename)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # 跳过空文件或过大文件
                    if len(content) < 50 or len(content) > 50000:
                        continue
                    
                    files.append({
                        'path': filepath,
                        'filename': filename,
                        'content': content,
                        'size': len(content)
                    })
                except Exception as e:
                    print(f"⚠️ 读取失败 {filepath}: {e}")
    
    return files

def sync_to_database(model, files):
    """同步文件到数据库"""
    success, failed, skipped = 0, 0, 0
    
    for i, file_info in enumerate(files, 1):
        filepath = file_info['path']
        content = file_info['content']
        filename = file_info['filename']
        
        # 生成文件哈希（用于去重）
        file_hash = get_file_hash(content)
        
        # 检查是否已存在
        existing = run_sql(f"SELECT id FROM memories WHERE metadata->>'file_hash' = '{file_hash}';")
        
        if existing and existing != '':
            print(f"[{i}/{len(files)}] ⏭️  跳过 (已存在): {filename}")
            skipped += 1
            continue
        
        # 分段处理大文件
        chunks = []
        chunk_size = 2000
        for i in range(0, len(content), chunk_size):
            chunk = content[i:i+chunk_size]
            if len(chunk.strip()) > 50:
                chunks.append(chunk)
        
        # 生成向量并插入数据库
        for j, chunk in enumerate(chunks[:5]):  # 每个文件最多 5 个 chunk
            try:
                embedding = model.encode([chunk])[0].tolist()
                embedding_str = '[' + ','.join(map(str, embedding)) + ']'
                
                # 确定记忆类型
                if 'PROJECT' in filename:
                    mem_type = 'project'
                elif 'correction' in filename.lower():
                    mem_type = 'correction'
                elif filename.startswith('2026-'):
                    mem_type = 'diary'
                else:
                    mem_type = 'knowledge'
                
                # 插入数据库
                chunk_id = f"{file_hash}_{j}"
                safe_content = chunk.replace("'", "''").replace('\n', ' ')[:2000]
                
                sql = f"""
                INSERT INTO memories (id, content, embedding, type, metadata)
                VALUES ('{chunk_id}', '{safe_content}', '{embedding_str}'::vector, '{mem_type}', 
                        '{{"file": "{filepath}", "chunk": {j}, "file_hash": "{file_hash}"}}')
                ON CONFLICT (id) DO NOTHING;
                """
                
                result = run_sql(sql)
                
                if j == 0:
                    print(f"[{i}/{len(files)}] ✅ 同步：{filename} ({mem_type})")
                    success += 1
            except Exception as e:
                print(f"[{i}/{len(files)}] ❌ 失败 {filename}: {e}")
                failed += 1
                break
    
    return success, failed, skipped

def main():
    print("=" * 70)
    print("🧠 全量记忆同步 - 所有文件到数据库")
    print("=" * 70)
    print(f"开始时间：{datetime.now()}")
    print(f"记忆根目录：{MEMORY_ROOT}")
    print()
    
    # 加载模型
    model = load_model()
    print()
    
    # 读取文件
    print("📂 读取 Markdown 文件...")
    files = read_markdown_files(MEMORY_ROOT)
    print(f"✅ 找到 {len(files)} 个文件")
    print()
    
    # 同步到数据库
    print("🔄 开始同步到数据库...")
    print()
    
    success, failed, skipped = sync_to_database(model, files)
    
    # 统计
    print()
    print("=" * 70)
    print("📊 同步完成")
    print(f"✅ 成功：{success} 个文件")
    print(f"❌ 失败：{failed} 个文件")
    print(f"⏭️  跳过：{skipped} 个文件 (已存在)")
    print("=" * 70)
    
    # 验证
    total = run_sql("SELECT COUNT(*) FROM memories;")
    with_embedding = run_sql("SELECT COUNT(*) FROM memories WHERE embedding IS NOT NULL;")
    print(f"📈 数据库总计：{total} 条记忆，{with_embedding} 条有向量")
    print("=" * 70)

if __name__ == "__main__":
    main()
