#!/usr/bin/env python3
"""
股票数据API获取脚本 - v4.1
自动从多个免费API获取股票数据
"""

import requests
import json
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import time

class StockDataAPI:
    """股票数据API类"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.cache = {}
        self.cache_time = 300  # 缓存5分钟
    
    def _get_cached(self, key: str) -> Optional[Dict]:
        """获取缓存数据"""
        if key in self.cache:
            data, timestamp = self.cache[key]
            if time.time() - timestamp < self.cache_time:
                return data
        return None
    
    def _set_cached(self, key: str, data: Dict):
        """设置缓存数据"""
        self.cache[key] = (data, time.time())
    
    def get_realtime_quote(self, stock_code: str) -> Optional[Dict]:
        """
        获取实时行情数据
        数据源: 腾讯财经API（免费，稳定）
        """
        cache_key = f"quote_{stock_code}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        try:
            # 腾讯财经API
            url = f"https://qt.gtimg.cn/q={stock_code}"
            response = self.session.get(url, timeout=10)
            response.encoding = 'gbk'
            
            # 解析数据
            data = response.text
            if not data or '~' not in data:
                return None
            
            # 腾讯数据格式: v_xxxx="名称~代码~价格~..."
            parts = data.split('"')[1].split('~')
            
            result = {
                'stock_code': stock_code,
                'stock_name': parts[1],
                'current_price': float(parts[3]),
                'yesterday_close': float(parts[4]),
                'today_open': float(parts[5]),
                'high': float(parts[33]),
                'low': float(parts[34]),
                'volume': float(parts[36]) * 100,  # 手转股
                'turnover': float(parts[37]) * 10000,  # 万元转元
                'market_cap': float(parts[44]) * 100000000 if parts[44] else 0,  # 总市值
                'float_cap': float(parts[45]) * 100000000 if parts[45] else 0,  # 流通市值
                'pe_ttm': float(parts[52]) if parts[52] else 0,
                'pb': float(parts[46]) if parts[46] else 0,
                'turnover_rate': float(parts[38]) if parts[38] else 0,  # 换手率
                'update_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'data_source': '腾讯财经API'
            }
            
            # 计算涨跌幅
            result['change_percent'] = round(
                (result['current_price'] - result['yesterday_close']) / result['yesterday_close'] * 100, 2
            )
            
            self._set_cached(cache_key, result)
            return result
            
        except Exception as e:
            print(f"获取实时行情失败 {stock_code}: {e}")
            return None
    
    def get_kline_data(self, stock_code: str, days: int = 120) -> Optional[pd.DataFrame]:
        """
        获取K线数据（日线）
        数据源: 腾讯财经API
        """
        cache_key = f"kline_{stock_code}_{days}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        try:
            # 腾讯K线API
            url = f"https://web.ifzq.gtimg.cn/appstock/finance/dayquotation/get?code={stock_code}"
            response = self.session.get(url, timeout=10)
            data = response.json()
            
            if 'data' not in data or stock_code not in data['data']:
                return None
            
            kline_data = data['data'][stock_code].get('day', [])
            
            if not kline_data:
                return None
            
            # 转换为DataFrame
            df = pd.DataFrame(kline_data, columns=['date', 'open', 'close', 'low', 'high', 'volume'])
            df['date'] = pd.to_datetime(df['date'])
            for col in ['open', 'close', 'low', 'high', 'volume']:
                df[col] = pd.to_numeric(df[col], errors='coerce')
            
            # 计算技术指标
            df['ma5'] = df['close'].rolling(window=5).mean()
            df['ma10'] = df['close'].rolling(window=10).mean()
            df['ma20'] = df['close'].rolling(window=20).mean()
            df['ma60'] = df['close'].rolling(window=60).mean()
            
            # 计算年线偏离度
            df['year_ma'] = df['close'].rolling(window=250).mean()
            df['deviation_from_year_ma'] = (df['close'] - df['year_ma']) / df['year_ma'] * 100
            
            self._set_cached(cache_key, df)
            return df
            
        except Exception as e:
            print(f"获取K线数据失败 {stock_code}: {e}")
            return None
    
    def get_fund_flow(self, stock_code: str) -> Optional[Dict]:
        """
        获取资金流向数据
        数据源: 东方财富API（模拟，实际需解析页面或使用付费API）
        注意: 免费API限制较多，这里提供框架
        """
        cache_key = f"fundflow_{stock_code}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        # 注意: 东方财富没有官方免费API，这里提供数据结构和获取思路
        # 实际使用时需要:
        # 1. 使用 selenium/playwright 爬取页面
        # 2. 或购买付费API（如聚宽、Tushare Pro）
        
        result = {
            'stock_code': stock_code,
            'main_force_5d': 0,  # 主力5日净流入（万元）
            'main_force_continuous_days': 0,  # 主力连续流入天数
            'retail_5d': 0,  # 散户5日净流入（万元）
            'northbound_5d': 0,  # 北向资金5日净流入（万元）
            'update_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'data_source': '需手动获取或使用付费API',
            'note': '东方财富无官方免费API，建议使用Tushare Pro或聚宽'
        }
        
        return result
    
    def get_industry_data(self, stock_code: str) -> Optional[Dict]:
        """
        获取行业数据
        用于计算相对涨幅
        """
        # 这里需要根据股票代码获取所属行业指数
        # 然后计算相对涨幅
        
        industry_map = {
            # 股票代码前缀: 行业指数代码
            '600519': 'sh000951',  # 白酒
            '300750': 'sz399417',  # 新能源
            '000858': 'sh000951',  # 白酒
            # ... 更多映射
        }
        
        return {
            'stock_code': stock_code,
            'industry_name': '需根据股票代码查询',
            'industry_index_code': industry_map.get(stock_code, ''),
            'note': '行业数据需额外获取'
        }
    
    def analyze_stock(self, stock_code: str) -> Dict:
        """
        综合分析一只股票
        返回包含所有维度的分析结果
        """
        result = {
            'stock_code': stock_code,
            'analysis_time': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'realtime_quote': None,
            'kline_analysis': None,
            'fund_flow': None,
            'veto_check': {},
            'technical_score': 0,
            'errors': []
        }
        
        # 1. 获取实时行情
        quote = self.get_realtime_quote(stock_code)
        if quote:
            result['realtime_quote'] = quote
        else:
            result['errors'].append("获取实时行情失败")
        
        # 2. 获取K线数据
        kline = self.get_kline_data(stock_code)
        if kline is not None and not kline.empty:
            latest = kline.iloc[-1]
            
            # 技术面分析
            result['kline_analysis'] = {
                'current_price': latest['close'],
                'ma5': latest['ma5'],
                'ma10': latest['ma10'],
                'ma20': latest['ma20'],
                'ma60': latest['ma60'],
                'year_ma': latest['year_ma'],
                'deviation_from_year_ma': latest['deviation_from_year_ma'],
                'trend': 'up' if latest['close'] > latest['ma20'] else 'down',
                'ma_alignment': self._check_ma_alignment(latest)
            }
            
            # 计算6个月涨幅
            if len(kline) >= 120:
                price_6m_ago = kline.iloc[-120]['close']
                result['kline_analysis']['change_6m'] = round(
                    (latest['close'] - price_6m_ago) / price_6m_ago * 100, 2
                )
        else:
            result['errors'].append("获取K线数据失败")
        
        # 3. 获取资金流向
        fund_flow = self.get_fund_flow(stock_code)
        if fund_flow:
            result['fund_flow'] = fund_flow
        
        # 4. 一票否决检查
        if quote and kline is not None:
            result['veto_check'] = self._veto_check(quote, kline)
        
        return result
    
    def _check_ma_alignment(self, latest: pd.Series) -> str:
        """检查均线排列"""
        if latest['ma5'] > latest['ma10'] > latest['ma20'] > latest['ma60']:
            return '多头排列'
        elif latest['ma5'] < latest['ma10'] < latest['ma20'] < latest['ma60']:
            return '空头排列'
        else:
            return '震荡整理'
    
    def _veto_check(self, quote: Dict, kline: pd.DataFrame) -> Dict:
        """
        一票否决检查（v4.1 标准）
        """
        latest = kline.iloc[-1]
        float_cap = quote.get('float_cap', 0)  # 流通市值（元）
        
        checks = {
            'is_st': False,  # 需要额外获取
            'price_too_high': False,
            'main_force_outflow': False,
            'continuous_outflow': False,
            'turnover_too_high': False,
            'retail_takeover': False,
            'huge_volume': False,
            'data_timeout': False,
            'dividend_stop': False,  # 需要额外获取
            'history_crash': False  # 需要额外获取
        }
        
        # 检查1: 周K涨幅（相对年线）
        deviation = latest.get('deviation_from_year_ma', 0)
        if deviation > 30:  # 高于年线30%
            checks['price_too_high'] = True
        
        # 检查2: 换手率（按市值分类）
        turnover_rate = quote.get('turnover_rate', 0)
        if float_cap > 50000000000:  # 大盘股 > 500亿
            if turnover_rate > 5:
                checks['turnover_too_high'] = True
        elif float_cap > 10000000000:  # 中盘股 > 100亿
            if turnover_rate > 10:
                checks['turnover_too_high'] = True
        else:  # 小盘股
            if turnover_rate > 15:
                checks['turnover_too_high'] = True
        
        # 检查3: 成交量（相对20日均量）
        if len(kline) >= 20:
            avg_volume_20 = kline['volume'].tail(20).mean()
            today_volume = latest['volume']
            if today_volume > avg_volume_20 * 2:  # 大于20日均量2倍
                checks['huge_volume'] = True
        
        # 检查4: 数据时效性
        update_time = quote.get('update_time', '')
        if update_time:
            update_dt = datetime.strptime(update_time, '%Y-%m-%d %H:%M:%S')
            if datetime.now() - update_dt > timedelta(days=1):
                checks['data_timeout'] = True
        
        # 统计
        checks['veto_count'] = sum([
            checks['is_st'],
            checks['price_too_high'],
            checks['main_force_outflow'],
            checks['continuous_outflow'],
            checks['turnover_too_high'],
            checks['retail_takeover'],
            checks['huge_volume'],
            checks['data_timeout'],
            checks['dividend_stop'],
            checks['history_crash']
        ])
        checks['is_vetoed'] = checks['veto_count'] > 0
        
        return checks


def main():
    """测试函数"""
    api = StockDataAPI()
    
    # 测试股票
    test_stocks = [
        'sh600519',  # 茅台
        'sz300750',  # 宁德时代
        'sh000001',  # 上证指数
    ]
    
    for stock in test_stocks:
        print(f"\n{'='*60}")
        print(f"分析股票: {stock}")
        print('='*60)
        
        result = api.analyze_stock(stock)
        
        if result['realtime_quote']:
            q = result['realtime_quote']
            print(f"\n实时行情:")
            print(f"  名称: {q['stock_name']}")
            print(f"  价格: {q['current_price']}")
            print(f"  涨跌: {q['change_percent']}%")
            print(f"  市值: {q['market_cap']/1e8:.2f}亿")
            print(f"  流通市值: {q['float_cap']/1e8:.2f}亿")
            print(f"  换手率: {q['turnover_rate']}%")
            print(f"  PE: {q['pe_ttm']}")
            print(f"  PB: {q['pb']}")
        
        if result['kline_analysis']:
            k = result['kline_analysis']
            print(f"\n技术分析:")
            print(f"  年线偏离: {k['deviation_from_year_ma']:.2f}%")
            print(f"  6月涨幅: {k.get('change_6m', 0):.2f}%")
            print(f"  均线排列: {k['ma_alignment']}")
            print(f"  趋势: {k['trend']}")
        
        if result['veto_check']:
            v = result['veto_check']
            print(f"\n一票否决检查:")
            print(f"  是否被否决: {'是' if v['is_vetoed'] else '否'}")
            print(f"  否决项数: {v['veto_count']}")
            if v['is_vetoed']:
                for key, value in v.items():
                    if value and key not in ['veto_count', 'is_vetoed']:
                        print(f"  - {key}: 触发")
        
        if result['errors']:
            print(f"\n错误:")
            for error in result['errors']:
                print(f"  - {error}")


if __name__ == '__main__':
    main()
