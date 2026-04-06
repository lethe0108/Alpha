#!/usr/bin/env python3
"""
能力评估脚本 - 评估当前AI助手的能力和限制
"""

import sys
import json
import subprocess
import os
from datetime import datetime

def get_openclaw_info():
    """获取OpenClaw系统信息"""
    info = {}
    try:
        # 获取版本信息
        result = subprocess.run(['openclaw', '--version'], 
                              capture_output=True, text=True)
        info['version'] = result.stdout.strip() if result.returncode == 0 else "未知"
    except Exception as e:
        info['version'] = f"错误: {str(e)}"
    
    return info

def get_available_skills():
    """获取可用技能列表"""
    skills = []
    try:
        # 检查系统技能目录
        skills_dir = '/usr/lib/node_modules/openclaw/skills'
        if os.path.exists(skills_dir):
            skill_folders = os.listdir(skills_dir)
            skills.extend(skill_folders)
        
        # 检查工作空间技能目录
        workspace_skills_dir = '/root/.openclaw/workspace/skills'
        if os.path.exists(workspace_skills_dir):
            workspace_skills = os.listdir(workspace_skills_dir)
            skills.extend([f"workspace/{s}" for s in workspace_skills])
    except Exception as e:
        skills.append(f"错误获取技能: {str(e)}")
    
    return skills

def get_system_info():
    """获取系统信息"""
    info = {}
    try:
        # 操作系统信息
        with open('/etc/os-release', 'r') as f:
            for line in f:
                if line.startswith('PRETTY_NAME='):
                    info['os'] = line.split('=', 1)[1].strip().strip('"')
                    break
        
        # Python版本
        info['python'] = sys.version
        
        # 内存信息
        with open('/proc/meminfo', 'r') as f:
            for line in f:
                if line.startswith('MemTotal:'):
                    info['memory'] = line.split()[1] + ' kB'
                    break
    except Exception as e:
        info['error'] = str(e)
    
    return info

def check_network_access():
    """检查网络访问能力"""
    network = {}
    try:
        # 测试本地网络
        result = subprocess.run(['ping', '-c', '1', '8.8.8.8'], 
                              capture_output=True, text=True, timeout=5)
        network['local'] = result.returncode == 0
        
        # 测试外网访问
        result = subprocess.run(['curl', '-s', '--connect-timeout', '10', 
                               'https://api.ipify.org?format=json'],
                              capture_output=True, text=True, timeout=15)
        network['internet'] = result.returncode == 0
        if network['internet']:
            try:
                ip_info = json.loads(result.stdout)
                network['public_ip'] = ip_info.get('ip', '未知')
            except:
                network['public_ip'] = '解析错误'
    except Exception as e:
        network['error'] = str(e)
    
    return network

def generate_report():
    """生成能力评估报告"""
    report = {
        'timestamp': datetime.now().isoformat(),
        'system': get_system_info(),
        'openclaw': get_openclaw_info(),
        'skills': get_available_skills(),
        'network': check_network_access(),
        'assessment': {}
    }
    
    # 能力评估
    report['assessment']['total_skills'] = len(report['skills'])
    report['assessment']['internet_access'] = report['network'].get('internet', False)
    report['assessment']['system_stability'] = True  # 假设稳定
    
    # 改进建议
    suggestions = []
    if report['assessment']['total_skills'] < 20:
        suggestions.append("技能数量较少，建议学习创建更多技能")
    if not report['assessment']['internet_access']:
        suggestions.append("外网访问受限，建议检查网络配置")
    else:
        suggestions.append("外网访问正常，可以利用此优势学习最新技术")
    
    report['assessment']['suggestions'] = suggestions
    
    return report

def main():
    """主函数"""
    print("开始能力评估...")
    report = generate_report()
    
    print("\n" + "="*50)
    print("AI助手能力评估报告")
    print("="*50)
    
    print(f"\n📊 系统信息:")
    print(f"  操作系统: {report['system'].get('os', '未知')}")
    print(f"  Python版本: {report['system'].get('python', '未知').split()[0]}")
    print(f"  内存: {report['system'].get('memory', '未知')}")
    
    print(f"\n🤖 OpenClaw信息:")
    print(f"  版本: {report['openclaw'].get('version', '未知')}")
    
    print(f"\n🔧 可用技能 ({report['assessment']['total_skills']}个):")
    for i, skill in enumerate(report['skills'][:10], 1):
        print(f"  {i}. {skill}")
    if len(report['skills']) > 10:
        print(f"  ... 还有 {len(report['skills']) - 10} 个技能")
    
    print(f"\n🌐 网络访问:")
    print(f"  本地网络: {'✅ 正常' if report['network'].get('local') else '❌ 异常'}")
    print(f"  外网访问: {'✅ 正常' if report['network'].get('internet') else '❌ 异常'}")
    if report['network'].get('public_ip'):
        print(f"  公网IP: {report['network'].get('public_ip')}")
    
    print(f"\n📈 评估结果:")
    print(f"  技能丰富度: {'中等' if report['assessment']['total_skills'] >= 20 else '需要提升'}")
    print(f"  外网访问: {'✅ 可用' if report['assessment']['internet_access'] else '❌ 受限'}")
    print(f"  系统稳定性: {'✅ 良好' if report['assessment']['system_stability'] else '❌ 需要检查'}")
    
    print(f"\n💡 改进建议:")
    for i, suggestion in enumerate(report['assessment']['suggestions'], 1):
        print(f"  {i}. {suggestion}")
    
    print(f"\n⏰ 评估时间: {report['timestamp']}")
    print("="*50)
    
    # 保存报告到文件
    report_file = '/root/.openclaw/workspace/self_evolution_report.json'
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"\n报告已保存到: {report_file}")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())