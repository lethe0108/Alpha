"""
数据库模型
"""
from datetime import datetime
from sqlmodel import SQLModel, Field
from typing import Optional
from enum import Enum


class StrategyType(str, Enum):
    """策略类型"""
    LONG_VALUE = "long_value"  # 长线价值
    SHORT_TREND = "short_trend"  # 短线趋势
    SHORT_REBOUND = "short_rebound"  # 短线反弹


class Stock(SQLModel, table=True):
    """股票基本信息"""
    __tablename__ = "stocks"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(index=True, unique=True)  # 股票代码
    name: str  # 股票名称
    market: str  # 市场 (SH/SZ)
    industry: Optional[str] = None  # 行业
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class StockMetrics(SQLModel, table=True):
    """股票指标数据"""
    __tablename__ = "stock_metrics"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    stock_code: str = Field(index=True)  # 股票代码
    date: datetime = Field(index=True)  # 日期
    
    # 估值指标
    pe_ttm: Optional[float] = None  # PE(TTM)
    pb: Optional[float] = None  # PB
    peg: Optional[float] = None  # PEG
    ps: Optional[float] = None  # PS
    
    # 盈利指标
    roe: Optional[float] = None  # ROE
    roa: Optional[float] = None  # ROA
    gross_margin: Optional[float] = None  # 毛利率
    net_margin: Optional[float] = None  # 净利率
    
    # 成长指标
    revenue_growth: Optional[float] = None  # 营收增速
    profit_growth: Optional[float] = None  # 净利润增速
    cashflow_growth: Optional[float] = None  # 现金流增速
    
    # 财务健康
    debt_ratio: Optional[float] = None  # 资产负债率
    current_ratio: Optional[float] = None  # 流动比率
    quick_ratio: Optional[float] = None  # 速动比率
    
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Transaction(SQLModel, table=True):
    """交易记录"""
    __tablename__ = "transactions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    stock_code: str = Field(index=True)  # 股票代码
    stock_name: str  # 股票名称
    
    # 交易信息
    direction: str  # 买入/卖出
    price: float  # 价格
    quantity: int  # 数量
    amount: float  # 金额
    commission: float = 0  # 佣金
    
    # 策略
    strategy: str  # 策略类型
    reason: Optional[str] = None  # 买入理由
    
    # 止损止盈
    stop_loss: Optional[float] = None  # 止损位
    target_price: Optional[float] = None  # 目标位
    
    # 时间
    trade_time: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Position(SQLModel, table=True):
    """持仓"""
    __tablename__ = "positions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    stock_code: str = Field(index=True, unique=True)  # 股票代码
    stock_name: str  # 股票名称
    
    # 持仓信息
    quantity: int  # 持仓数量
    avg_cost: float  # 平均成本
    current_price: Optional[float] = None  # 当前价
    market_value: Optional[float] = None  # 市值
    
    # 盈亏
    profit_loss: Optional[float] = None  # 盈亏金额
    profit_loss_rate: Optional[float] = None  # 盈亏率
    
    # 策略
    strategy: str  # 策略类型
    
    # 止损止盈
    stop_loss: Optional[float] = None  # 止损位
    target_price: Optional[float] = None  # 目标位
    
    # 时间
    open_date: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class Strategy(SQLModel, table=True):
    """策略配置"""
    __tablename__ = "strategies"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str  # 策略名称
    type: str  # 策略类型
    description: Optional[str] = None  # 描述
    
    # 策略参数 (JSON)
    params: dict = Field(default_factory=dict)
    
    # 状态
    enabled: bool = True  # 是否启用
    
    # 表现
    total_trades: int = 0  # 总交易数
    win_rate: Optional[float] = None  # 胜率
    avg_profit: Optional[float] = None  # 平均收益
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
