#!/usr/bin/env python3
"""
全量内容同步脚本 v2
同步所有相关文件到记忆数据库
"""

import subprocess
import os
from sentence_transformers import SentenceTransformer
import hashlib

# 设置代理
os.environ['HTTP_PROXY'] = 'http://127.0.0.1:10809'
os.environ['HTTPS_PROXY'] = 'http://127.0.0.1:10809'

# 配置
SYNC_PATHS = [
    '/root/.openclaw/workspace/corrections/',
    '/root/.openclaw/workspace/self-improving/',
    '/root/.openclaw/workspace/*.md',
]
MODEL_NAME = 'paraphrase-multilingual-MiniLM-L12-v2'

def load_model():
    print(f"📥 加载模型...")
    model = SentenceTransformer(MODEL_NAME)
    print(f"✅ 模型加载完成")
    return model

def run_sql(sql):
    cmd = f"sudo -u postgres psql -d memory_db -t -A -c \"{sql}\""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout.strip()

def get_file_hash(content):
    return hashlib.md5(content.encode()).hexdigest()

def sync_file(model, filepath, mem_type):
    """同步单个文件"""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        if len(content) < 50:
            return False
        
        file_hash = get_file_hash(content)
        
        # 检查是否已存在
        existing = run_sql(f"SELECT id FROM memories WHERE metadata->>'file_hash' = '{file_hash}';")
        if existing and existing != '':
            print(f"⏭️  跳过：{filepath}")
            return False
        
        # 分段生成向量
        chunks = []
        chunk_size = 2000
        for i in range(0, min(len(content), 10000), chunk_size):
            chunk = content[i:i+chunk_size].strip()
            if len(chunk) > 50:
                chunks.append(chunk)
        
        # 插入数据库
        for j, chunk in enumerate(chunks[:5]):
            embedding = model.encode([chunk])[0].tolist()
            embedding_str = '[' + ','.join(map(str, embedding)) + ']'
            
            safe_content = chunk.replace("'", "''").replace('\n', ' ')[:2000]
            chunk_id = f"{file_hash}_{j}"
            
            sql = f"""
            INSERT INTO memories (id, content, embedding, type, metadata)
            VALUES ('{chunk_id}', '{safe_content}', '{embedding_str}'::vector, '{mem_type}',
                    '{{"file": "{filepath}", "chunk": {j}, "file_hash": "{file_hash}"}}')
            ON CONFLICT (id) DO NOTHING;
            """
            run_sql(sql)
        
        print(f"✅ 同步：{filepath} ({len(chunks)} chunks)")
        return True
    except Exception as e:
        print(f"❌ 失败 {filepath}: {e}")
        return False

def main():
    print("=" * 60)
    print("🔄 全量内容同步 v2")
    print("=" * 60)
    
    model = load_model()
    print()
    
    success = 0
    
    # 同步 corrections
    print("📂 同步 corrections...")
    corrections_dir = '/root/.openclaw/workspace/corrections/'
    if os.path.exists(corrections_dir):
        for filename in os.listdir(corrections_dir):
            if filename.endswith('.md'):
                filepath = os.path.join(corrections_dir, filename)
                if sync_file(model, filepath, 'correction'):
                    success += 1
    
    # 同步 self-improving
    print("📂 同步 self-improving...")
    si_dir = '/root/.openclaw/workspace/self-improving/'
    if os.path.exists(si_dir):
        for filename in os.listdir(si_dir):
            if filename.endswith('.md'):
                filepath = os.path.join(si_dir, filename)
                if sync_file(model, filepath, 'correction'):
                    success += 1
    
    # 同步 workspace 根目录的 md 文件
    print("📂 同步 workspace/*.md...")
    workspace_dir = '/root/.openclaw/workspace/'
    for filename in ['SOUL.md', 'AGENTS.md', 'TOOLS.md', 'IDENTITY.md', 'USER.md', 'HEARTBEAT.md', 'CONFIG.md']:
        filepath = os.path.join(workspace_dir, filename)
        if os.path.exists(filepath):
            if sync_file(model, filepath, 'core'):
                success += 1
    
    print()
    print("=" * 60)
    print(f"✅ 完成：同步 {success} 个文件")
    
    # 验证
    total = run_sql("SELECT COUNT(*) FROM memories;")
    with_embedding = run_sql("SELECT COUNT(*) FROM memories WHERE embedding IS NOT NULL;")
    print(f"📈 数据库：{total} 条记忆，{with_embedding} 条有向量")
    print("=" * 60)

if __name__ == "__main__":
    main()
