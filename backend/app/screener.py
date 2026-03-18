"""
选股引擎核心逻辑
"""
from typing import List, Dict, Optional
from dataclasses import dataclass
from datetime import datetime


@dataclass
class StockFilter:
    """股票筛选条件"""
    # 估值
    pe_min: Optional[float] = None
    pe_max: Optional[float] = None
    pb_min: Optional[float] = None
    pb_max: Optional[float] = None
    peg_min: Optional[float] = None
    peg_max: Optional[float] = None
    
    # 盈利
    roe_min: Optional[float] = None
    gross_margin_min: Optional[float] = None
    net_margin_min: Optional[float] = None
    
    # 成长
    revenue_growth_min: Optional[float] = None
    profit_growth_min: Optional[float] = None
    
    # 财务健康
    debt_ratio_max: Optional[float] = None
    current_ratio_min: Optional[float] = None


@dataclass
class StockScore:
    """股票评分"""
    stock_code: str
    stock_name: str
    total_score: float
    valuation_score: float
    profitability_score: float
    growth_score: float
    health_score: float
    details: Dict


class StockScreener:
    """选股引擎"""
    
    def __init__(self):
        self.filters: List[StockFilter] = []
    
    def add_filter(self, filter: StockFilter):
        """添加筛选条件"""
        self.filters.append(filter)
    
    def screen(self, stocks: List[Dict]) -> List[StockScore]:
        """
        筛选股票
        
        Args:
            stocks: 股票列表 (包含指标数据)
        
        Returns:
            评分后的股票列表
        """
        results = []
        
        for stock in stocks:
            # 1. 应用筛选条件
            if not self._apply_filters(stock):
                continue
            
            # 2. 计算评分
            score = self._calculate_score(stock)
            results.append(score)
        
        # 3. 按评分排序
        results.sort(key=lambda x: x.total_score, reverse=True)
        return results
    
    def _apply_filters(self, stock: Dict) -> bool:
        """应用筛选条件"""
        for f in self.filters:
            # 估值筛选
            if f.pe_min and stock.get('pe_ttm', 0) < f.pe_min:
                return False
            if f.pe_max and stock.get('pe_ttm', float('inf')) > f.pe_max:
                return False
            
            if f.pb_min and stock.get('pb', 0) < f.pb_min:
                return False
            if f.pb_max and stock.get('pb', float('inf')) > f.pb_max:
                return False
            
            if f.peg_min and stock.get('peg', 0) < f.peg_min:
                return False
            if f.peg_max and stock.get('peg', float('inf')) > f.peg_max:
                return False
            
            # 盈利筛选
            if f.roe_min and stock.get('roe', 0) < f.roe_min:
                return False
            
            if f.gross_margin_min and stock.get('gross_margin', 0) < f.gross_margin_min:
                return False
            
            if f.net_margin_min and stock.get('net_margin', 0) < f.net_margin_min:
                return False
            
            # 成长筛选
            if f.revenue_growth_min and stock.get('revenue_growth', 0) < f.revenue_growth_min:
                return False
            
            if f.profit_growth_min and stock.get('profit_growth', 0) < f.profit_growth_min:
                return False
            
            # 财务健康筛选
            if f.debt_ratio_max and stock.get('debt_ratio', 0) > f.debt_ratio_max:
                return False
            
            if f.current_ratio_min and stock.get('current_ratio', 0) < f.current_ratio_min:
                return False
        
        return True
    
    def _calculate_score(self, stock: Dict) -> StockScore:
        """
        计算股票评分
        
        评分维度:
        - 估值 (30%): PE, PB, PEG
        - 盈利 (30%): ROE, 毛利率，净利率
        - 成长 (25%): 营收增速，净利润增速
        - 财务健康 (15%): 资产负债率，流动比率
        """
        # 估值评分 (越低越好)
        valuation_score = self._score_valuation(stock)
        
        # 盈利评分 (越高越好)
        profitability_score = self._score_profitability(stock)
        
        # 成长评分 (越高越好)
        growth_score = self._score_growth(stock)
        
        # 财务健康评分
        health_score = self._score_health(stock)
        
        # 加权总分
        total_score = (
            valuation_score * 0.30 +
            profitability_score * 0.30 +
            growth_score * 0.25 +
            health_score * 0.15
        )
        
        return StockScore(
            stock_code=stock['code'],
            stock_name=stock['name'],
            total_score=total_score,
            valuation_score=valuation_score,
            profitability_score=profitability_score,
            growth_score=growth_score,
            health_score=health_score,
            details=stock
        )
    
    def _score_valuation(self, stock: Dict) -> float:
        """估值评分 (0-100)"""
        score = 0
        
        # PE 评分 (10-25 为优)
        pe = stock.get('pe_ttm', 0)
        if 10 <= pe <= 25:
            score += 40
        elif 0 < pe < 10:
            score += 20  # 可能低估或有风险
        elif 25 < pe <= 40:
            score += 20
        elif pe > 40:
            score += 0
        
        # PEG 评分 (0.5-1.2 为优)
        peg = stock.get('peg', 0)
        if 0.5 <= peg <= 1.2:
            score += 30
        elif 0 < peg < 0.5:
            score += 20
        elif 1.2 < peg <= 1.5:
            score += 15
        elif peg > 1.5:
            score += 0
        
        # PB 评分 (1-4 为优)
        pb = stock.get('pb', 0)
        if 1 <= pb <= 4:
            score += 30
        elif 0 < pb < 1:
            score += 10
        elif 4 < pb <= 6:
            score += 15
        elif pb > 6:
            score += 0
        
        return min(score, 100)
    
    def _score_profitability(self, stock: Dict) -> float:
        """盈利评分 (0-100)"""
        score = 0
        
        # ROE 评分 (>15% 为优)
        roe = stock.get('roe', 0)
        if roe >= 20:
            score += 40
        elif roe >= 15:
            score += 30
        elif roe >= 10:
            score += 20
        elif roe >= 5:
            score += 10
        
        # 毛利率评分 (>30% 为优)
        gross_margin = stock.get('gross_margin', 0)
        if gross_margin >= 50:
            score += 30
        elif gross_margin >= 30:
            score += 25
        elif gross_margin >= 20:
            score += 15
        elif gross_margin >= 10:
            score += 5
        
        # 净利率评分 (>10% 为优)
        net_margin = stock.get('net_margin', 0)
        if net_margin >= 20:
            score += 30
        elif net_margin >= 10:
            score += 25
        elif net_margin >= 5:
            score += 15
        
        return min(score, 100)
    
    def _score_growth(self, stock: Dict) -> float:
        """成长评分 (0-100)"""
        score = 0
        
        # 营收增速评分 (>20% 为优)
        revenue_growth = stock.get('revenue_growth', 0)
        if revenue_growth >= 30:
            score += 50
        elif revenue_growth >= 20:
            score += 40
        elif revenue_growth >= 10:
            score += 25
        elif revenue_growth >= 0:
            score += 10
        
        # 净利润增速评分 (>25% 为优)
        profit_growth = stock.get('profit_growth', 0)
        if profit_growth >= 40:
            score += 50
        elif profit_growth >= 25:
            score += 40
        elif profit_growth >= 15:
            score += 25
        elif profit_growth >= 0:
            score += 10
        
        return min(score, 100)
    
    def _score_health(self, stock: Dict) -> float:
        """财务健康评分 (0-100)"""
        score = 0
        
        # 资产负债率评分 (<50% 为优)
        debt_ratio = stock.get('debt_ratio', 100)
        if debt_ratio <= 30:
            score += 40
        elif debt_ratio <= 50:
            score += 30
        elif debt_ratio <= 70:
            score += 15
        
        # 流动比率评分 (>2 为优)
        current_ratio = stock.get('current_ratio', 0)
        if current_ratio >= 2:
            score += 30
        elif current_ratio >= 1.5:
            score += 20
        elif current_ratio >= 1:
            score += 10
        
        # 速动比率评分 (>1 为优)
        quick_ratio = stock.get('quick_ratio', 0)
        if quick_ratio >= 1:
            score += 30
        elif quick_ratio >= 0.5:
            score += 15
        
        return min(score, 100)


# 长线价值策略筛选器
def get_long_value_filter() -> StockFilter:
    """长线价值策略筛选条件"""
    return StockFilter(
        pe_min=10,
        pe_max=25,
        pb_min=1,
        pb_max=4,
        peg_min=0.5,
        peg_max=1.2,
        roe_min=15,
        gross_margin_min=30,
        net_margin_min=10,
        revenue_growth_min=20,
        profit_growth_min=25,
        debt_ratio_max=50,
        current_ratio_min=2
    )


# 短线趋势策略筛选器
def get_short_trend_filter() -> StockFilter:
    """短线趋势策略筛选条件"""
    return StockFilter(
        pe_min=0,
        pe_max=40,
        roe_min=10,
        revenue_growth_min=15,
        profit_growth_min=20
    )
