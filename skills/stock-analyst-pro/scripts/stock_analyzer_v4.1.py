#!/usr/bin/env python3
"""
股票分析报告自动生成脚本 - v4.1
整合API数据获取和量化分析
"""

import sys
import json
from datetime import datetime
from pathlib import Path

# 添加脚本目录到路径
sys.path.insert(0, str(Path(__file__).parent))

from stock_data_api import StockDataAPI


class StockAnalyzer:
    """股票分析器 - v4.1"""
    
    def __init__(self):
        self.api = StockDataAPI()
    
    def analyze(self, stock_code: str, stock_name: str = "") -> dict:
        """
        完整分析一只股票
        返回包含所有维度的分析报告
        """
        # 获取基础数据
        data = self.api.analyze_stock(stock_code)
        
        if not data['realtime_quote']:
            return {
                'error': f'无法获取 {stock_code} 的数据',
                'stock_code': stock_code,
                'stock_name': stock_name
            }
        
        quote = data['realtime_quote']
        name = stock_name or quote.get('stock_name', stock_code)
        
        # 识别股票类型
        stock_type = self._identify_stock_type(quote)
        
        # 一票否决检查
        veto_result = self._detailed_veto_check(data)
        
        # 五维分析评分
        five_dimension = self._analyze_five_dimensions(data)
        
        # 历史分析评分（简化版）
        history_score = self._analyze_history(data, stock_type)
        
        # 计算综合得分
        if stock_type == 'value':
            weights = {'five': 0.6, 'history': 0.4}
        elif stock_type == 'growth':
            weights = {'five': 0.75, 'history': 0.25}
        else:
            weights = {'five': 0.7, 'history': 0.3}
        
        total_score = (
            five_dimension['total'] * weights['five'] +
            history_score * weights['history']
        )
        
        # 确定评级
        rating, position = self._determine_rating(
            total_score, five_dimension, veto_result, data
        )
        
        return {
            'stock_code': stock_code,
            'stock_name': name,
            'analysis_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'stock_type': stock_type,
            'realtime_data': {
                'price': quote.get('current_price', 0),
                'change_percent': quote.get('change_percent', 0),
                'market_cap': quote.get('market_cap', 0) / 1e8,  # 亿
                'float_cap': quote.get('float_cap', 0) / 1e8,  # 亿
                'pe_ttm': quote.get('pe_ttm', 0),
                'pb': quote.get('pb', 0),
                'turnover_rate': quote.get('turnover_rate', 0),
            },
            'veto_check': veto_result,
            'five_dimension': five_dimension,
            'history_score': history_score,
            'weights': weights,
            'total_score': round(total_score, 2),
            'rating': rating,
            'suggested_position': position,
            'recommendation': self._generate_recommendation(rating, veto_result)
        }
    
    def _identify_stock_type(self, quote: dict) -> str:
        """识别股票类型"""
        pe = quote.get('pe_ttm', 0)
        
        if pe > 0 and pe < 20:
            return 'value'  # 价值股
        elif pe > 30:
            return 'growth'  # 成长股
        else:
            return 'balanced'  # 平衡型
    
    def _detailed_veto_check(self, data: dict) -> dict:
        """详细一票否决检查"""
        veto = data.get('veto_check', {})
        quote = data.get('realtime_quote', {})
        
        result = {
            'is_vetoed': veto.get('is_vetoed', False),
            'veto_count': veto.get('veto_count', 0),
            'details': []
        }
        
        # 检查各项
        checks = [
            ('price_too_high', '股价过高（高于年线30%）'),
            ('turnover_too_high', '换手率过高'),
            ('huge_volume', '天量成交（>20日均量2倍）'),
            ('data_timeout', '数据超时'),
            ('main_force_outflow', '主力资金大幅流出'),
            ('continuous_outflow', '主力连续流出'),
        ]
        
        for key, desc in checks:
            if veto.get(key):
                result['details'].append(desc)
        
        # 添加具体数据
        if quote:
            result['data'] = {
                'deviation_from_year_ma': data.get('kline_analysis', {}).get('deviation_from_year_ma', 0),
                'turnover_rate': quote.get('turnover_rate', 0),
                'float_cap': quote.get('float_cap', 0) / 1e8,  # 亿
            }
        
        return result
    
    def _analyze_five_dimensions(self, data: dict) -> dict:
        """五维分析评分"""
        quote = data.get('realtime_quote', {})
        kline = data.get('kline_analysis', {})
        
        scores = {}
        
        # 1. 政策面（简化，需要人工判断）
        scores['policy'] = {
            'score': 15,  # 默认中性
            'max': 20,
            'comment': '需人工确认政策环境'
        }
        
        # 2. 基本面（基于PE/PB）
        pe = quote.get('pe_ttm', 0)
        pb = quote.get('pb', 0)
        
        if 0 < pe < 30 and 0 < pb < 3:
            basic_score = 20
        elif 0 < pe < 50 and 0 < pb < 5:
            basic_score = 15
        else:
            basic_score = 10
        
        scores['basic'] = {
            'score': basic_score,
            'max': 20,
            'pe': pe,
            'pb': pb,
            'comment': f'PE={pe:.1f}, PB={pb:.1f}'
        }
        
        # 3. 技术面
        deviation = kline.get('deviation_from_year_ma', 0)
        alignment = kline.get('ma_alignment', '')
        
        if deviation < 20 and '多头' in alignment:
            tech_score = 20
        elif deviation < 30:
            tech_score = 15
        else:
            tech_score = 10
        
        scores['technical'] = {
            'score': tech_score,
            'max': 20,
            'deviation': deviation,
            'alignment': alignment,
            'comment': f'年线偏离{deviation:.1f}%, {alignment}'
        }
        
        # 4. 资金面（简化，需要更详细数据）
        turnover = quote.get('turnover_rate', 0)
        float_cap = quote.get('float_cap', 0)
        
        # 根据市值判断换手率
        if float_cap > 50000000000:  # 大盘股
            normal_turnover = 5
        elif float_cap > 10000000000:  # 中盘股
            normal_turnover = 10
        else:  # 小盘股
            normal_turnover = 15
        
        if turnover < normal_turnover:
            fund_score = 20
        elif turnover < normal_turnover * 1.5:
            fund_score = 15
        else:
            fund_score = 10
        
        scores['fund'] = {
            'score': fund_score,
            'max': 20,
            'turnover': turnover,
            'normal_turnover': normal_turnover,
            'comment': f'换手率{turnover:.1f}%(标准{normal_turnover}%)'
        }
        
        # 5. 估值面
        if 0 < pe < 20 and 0 < pb < 2:
            value_score = 20
        elif 0 < pe < 30 and 0 < pb < 3:
            value_score = 15
        else:
            value_score = 10
        
        scores['value'] = {
            'score': value_score,
            'max': 20,
            'pe': pe,
            'pb': pb,
            'comment': f'PE={pe:.1f}, PB={pb:.1f}'
        }
        
        # 计算总分
        total = sum(s['score'] for s in scores.values())
        
        return {
            'details': scores,
            'total': total,
            'max': 100,
            'passed': sum(1 for s in scores.values() if s['score'] >= 15)
        }
    
    def _analyze_history(self, data: dict, stock_type: str) -> int:
        """历史分析评分（简化版）"""
        quote = data.get('realtime_quote', {})
        kline = data.get('kline_analysis', {})
        
        # 基于现有数据的简化评分
        deviation = kline.get('deviation_from_year_ma', 0)
        pe = quote.get('pe_ttm', 0)
        
        score = 60  # 基础分
        
        # 股价位置
        if deviation < -10:
            score += 15  # 低位加分
        elif deviation > 30:
            score -= 10  # 高位扣分
        
        # 估值
        if 10 < pe < 30:
            score += 10
        elif pe > 50:
            score -= 10
        
        return max(0, min(100, score))
    
    def _determine_rating(self, total_score: float, five_dim: dict, 
                          veto: dict, data: dict) -> tuple:
        """确定评级和仓位建议"""
        
        # 如果一票否决
        if veto.get('is_vetoed'):
            return '⭐⭐', '观望'
        
        # 根据得分确定评级
        if total_score >= 85 and five_dim['passed'] >= 5:
            rating = '⭐⭐⭐⭐⭐'
            position = '7-8成'
        elif total_score >= 70 and five_dim['passed'] >= 5:
            rating = '⭐⭐⭐⭐'
            position = '5-6成'
        elif total_score >= 55 and five_dim['passed'] >= 4:
            rating = '⭐⭐⭐'
            position = '3-4成'
        elif total_score >= 40:
            rating = '⭐⭐'
            position = '1-2成或观望'
        else:
            rating = '⭐'
            position = '排除'
        
        return rating, position
    
    def _generate_recommendation(self, rating: str, veto: dict) -> str:
        """生成操作建议"""
        if veto.get('is_vetoed'):
            veto_reasons = veto.get('details', [])
            return f"⚠️ 一票否决: {', '.join(veto_reasons)}。建议观望或排除。"
        
        recommendations = {
            '⭐⭐⭐⭐⭐': '✅ 优质标的，可考虑重仓买入。建议分批建仓，设置止损。',
            '⭐⭐⭐⭐': '✅ 良好标的，可中等仓位买入。关注资金流向变化。',
            '⭐⭐⭐': '⭕ 一般标的，可轻仓尝试。需密切关注技术面变化。',
            '⭐⭐': '⚠️ 风险较高，建议观望。如买入需严格控制仓位。',
            '⭐': '❌ 不建议买入，直接排除。'
        }
        
        return recommendations.get(rating, '建议观望')
    
    def generate_report(self, stock_list: list) -> str:
        """生成完整分析报告"""
        report_lines = [
            "# 📊 股票分析报告（v4.1 量化版）",
            f"**报告时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"**数据来源**: 腾讯财经API（实时）",
            f"**分析引擎**: StockAnalyst Pro v4.1",
            "",
            "---",
            ""
        ]
        
        for stock in stock_list:
            code = stock.get('code', '')
            name = stock.get('name', '')
            
            result = self.analyze(code, name)
            
            if 'error' in result:
                report_lines.append(f"## ❌ {code} - 分析失败")
                report_lines.append(f"错误: {result['error']}")
                report_lines.append("")
                continue
            
            # 股票标题
            report_lines.append(f"## {result['stock_name']} ({result['stock_code']})")
            report_lines.append(f"**类型**: {result['stock_type']} | **评级**: {result['rating']}")
            report_lines.append("")
            
            # 实时数据
            rt = result['realtime_data']
            report_lines.append("### 📈 实时数据")
            report_lines.append(f"- 价格: {rt['price']:.2f} ({rt['change_percent']:+.2f}%)")
            report_lines.append(f"- 市值: {rt['market_cap']:.2f}亿")
            report_lines.append(f"- 流通市值: {rt['float_cap']:.2f}亿")
            report_lines.append(f"- PE: {rt['pe_ttm']:.2f} | PB: {rt['pb']:.2f}")
            report_lines.append(f"- 换手率: {rt['turnover_rate']:.2f}%")
            report_lines.append("")
            
            # 一票否决检查
            veto = result['veto_check']
            report_lines.append("### 🚫 一票否决检查")
            if veto['is_vetoed']:
                report_lines.append(f"⚠️ **被否决** ({veto['veto_count']}项)")
                for detail in veto['details']:
                    report_lines.append(f"- ❌ {detail}")
            else:
                report_lines.append("✅ **全部通过**")
            report_lines.append("")
            
            # 五维分析
            report_lines.append("### 📊 五维分析")
            fd = result['five_dimension']
            for dim, detail in fd['details'].items():
                report_lines.append(f"- {dim}: {detail['score']}/{detail['max']}分 - {detail['comment']}")
            report_lines.append(f"- **总分**: {fd['total']}/{fd['max']}分 (通过{fd['passed']}/5项)")
            report_lines.append("")
            
            # 综合评估
            report_lines.append("### 🎯 综合评估")
            report_lines.append(f"- **历史评分**: {result['history_score']}分")
            report_lines.append(f"- **权重分配**: 五维{result['weights']['five']*100:.0f}% + 历史{result['weights']['history']*100:.0f}%")
            report_lines.append(f"- **综合得分**: {result['total_score']}分")
            report_lines.append(f"- **建议仓位**: {result['suggested_position']}")
            report_lines.append("")
            
            # 操作建议
            report_lines.append("### 💡 操作建议")
            report_lines.append(result['recommendation'])
            report_lines.append("")
            
            report_lines.append("---")
            report_lines.append("")
        
        return '\n'.join(report_lines)


def main():
    """主函数"""
    analyzer = StockAnalyzer()
    
    # 测试股票列表
    test_stocks = [
        {'code': 'sh600519', 'name': '贵州茅台'},
        {'code': 'sz300750', 'name': '宁德时代'},
        {'code': 'sh000001', 'name': '上证指数'},
    ]
    
    print("正在生成分析报告...")
    report = analyzer.generate_report(test_stocks)
    
    # 保存报告
    output_file = f"/tmp/stock_analysis_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"\n报告已保存至: {output_file}")
    print("\n" + "="*60)
    print(report)


if __name__ == '__main__':
    main()
