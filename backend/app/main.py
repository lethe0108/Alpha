"""
股票选股与跟踪系统 - 后端服务

FastAPI + SQLAlchemy + SQLite
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="股票选股与跟踪系统 API",
    description="提供选股、交易记录、持仓管理等功能",
    version="0.1.0"
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 开发环境，生产环境需限制
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "message": "股票选股与跟踪系统 API",
        "version": "0.1.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# TODO: 导入路由
# from app.api import stocks, transactions, holdings
# app.include_router(stocks.router, prefix="/api/stocks", tags=["stocks"])
# app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
# app.include_router(holdings.router, prefix="/api/holdings", tags=["holdings"])
