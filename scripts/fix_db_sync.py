#!/usr/bin/env python3
"""
修复数据库同步 - 手动插入 corrections 和 core 内容
"""

import subprocess
import os
from sentence_transformers import SentenceTransformer

os.environ['HTTP_PROXY'] = 'http://127.0.0.1:10809'
os.environ['HTTPS_PROXY'] = 'http://127.0.0.1:10809'

model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')

def run_sql(sql):
    cmd = f"sudo -u postgres psql -d memory_db -t -A -c \"{sql}\""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout.strip()

files_to_sync = [
    ('/root/.openclaw/workspace/corrections/edit-failure-lesson.md', 'correction'),
    ('/root/.openclaw/workspace/self-improving/corrections.md', 'correction'),
    ('/root/.openclaw/workspace/SOUL.md', 'core'),
    ('/root/.openclaw/workspace/AGENTS.md', 'core'),
    ('/root/.openclaw/workspace/MEMORY.md', 'core'),
]

for filepath, mem_type in files_to_sync:
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # 生成向量
    embedding = model.encode([content[:2000]])[0].tolist()
    embedding_str = '[' + ','.join(map(str, embedding)) + ']'
    
    safe_content = content[:2000].replace("'", "''").replace('\n', ' ')
    
    sql = f"""
    INSERT INTO memories (content, embedding, type, metadata)
    VALUES ('{safe_content}', '{embedding_str}'::vector, '{mem_type}', '{{"file": "{filepath}"}}');
    """
    
    result = run_sql(sql)
    print(f"✅ 插入：{filepath} ({mem_type})")

print("完成！")

# 验证
total = run_sql("SELECT COUNT(*) FROM memories;")
by_type = run_sql("SELECT type, COUNT(*) FROM memories GROUP BY type;")
print(f"数据库总计：{total} 条")
print(f"按类型：{by_type}")
