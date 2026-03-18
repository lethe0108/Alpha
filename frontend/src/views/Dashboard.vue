<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <!-- 总资金卡片 -->
      <el-col :span="6">
        <div class="card capital-card">
          <div class="card-title">总资金</div>
          <div class="card-value">¥ 1,000,000</div>
          <div class="card-footer">
            <span class="label">可用资金</span>
            <span class="value">¥ 500,000</span>
          </div>
        </div>
      </el-col>

      <!-- 今日盈亏 -->
      <el-col :span="6">
        <div class="card profit-card">
          <div class="card-title">今日盈亏</div>
          <div class="card-value text-up">+¥ 12,580</div>
          <div class="card-footer">
            <span class="label">收益率</span>
            <span class="value text-up">+1.26%</span>
          </div>
        </div>
      </el-col>

      <!-- 本月收益 -->
      <el-col :span="6">
        <div class="card month-card">
          <div class="card-title">本月收益</div>
          <div class="card-value text-up">+¥ 85,000</div>
          <div class="card-footer">
            <span class="label">收益率</span>
            <span class="value text-up">+8.5%</span>
          </div>
        </div>
      </el-col>

      <!-- 本年收益 -->
      <el-col :span="6">
        <div class="card year-card">
          <div class="card-title">本年收益</div>
          <div class="card-value text-up">+¥ 325,000</div>
          <div class="card-footer">
            <span class="label">收益率</span>
            <span class="value text-up">+32.5%</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 持仓分布和收益曲线 -->
    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <div class="card">
          <div class="card-header">
            <h3>持仓分布</h3>
          </div>
          <div class="chart-placeholder">
            <p>持仓分布图表 (ECharts)</p>
            <p class="hint">长线 60% | 短线 40%</p>
          </div>
        </div>
      </el-col>

      <el-col :span="12">
        <div class="card">
          <div class="card-header">
            <h3>收益曲线</h3>
          </div>
          <div class="chart-placeholder">
            <p>收益趋势图表 (ECharts)</p>
            <p class="hint">近 3 个月收益走势</p>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 持仓概览 -->
    <el-row class="mt-20">
      <el-col :span="24">
        <div class="card">
          <div class="card-header flex-between">
            <h3>持仓概览</h3>
            <el-button type="primary" size="small">查看全部</el-button>
          </div>
          <el-table :data="holdings" style="width: 100%">
            <el-table-column prop="code" label="代码" width="100" />
            <el-table-column prop="name" label="名称" width="120" />
            <el-table-column prop="quantity" label="持仓数量" width="120" />
            <el-table-column prop="cost" label="成本价" width="100" />
            <el-table-column prop="price" label="当前价" width="100" />
            <el-table-column prop="profit" label="盈亏" width="100">
              <template #default="{ row }">
                <span :class="row.profit >= 0 ? 'text-up' : 'text-down'">
                  {{ row.profit >= 0 ? '+' : '' }}{{ row.profit }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="profitRate" label="盈亏率" width="100">
              <template #default="{ row }">
                <span :class="row.profitRate >= 0 ? 'text-up' : 'text-down'">
                  {{ row.profitRate >= 0 ? '+' : '' }}{{ row.profitRate }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default>
                <el-button type="primary" size="small">详情</el-button>
                <el-button type="danger" size="small">卖出</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const holdings = ref([
  { code: '000858', name: '五粮液', quantity: 100, cost: 168.5, price: 175.3, profit: 680, profitRate: 4.0 },
  { code: '600519', name: '贵州茅台', quantity: 50, cost: 1850, price: 1820, profit: -1500, profitRate: -1.6 },
  { code: '300760', name: '迈瑞医疗', quantity: 100, cost: 280, price: 295, profit: 1500, profitRate: 5.4 },
  { code: '002415', name: '海康威视', quantity: 200, cost: 35, price: 38, profit: 600, profitRate: 8.6 }
])
</script>

<style scoped>
.dashboard {
  width: 100%;
}

.card {
  background: var(--bg-color-page);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px var(--shadow-color);
  border: 1px solid var(--border-color);
}

.card-header {
  margin-bottom: 15px;
}

.card-header h3 {
  font-size: 16px;
  color: var(--text-color);
}

.card-title {
  font-size: 14px;
  color: var(--text-color-secondary);
  margin-bottom: 10px;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 15px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
}

.card-footer .label {
  font-size: 13px;
  color: var(--text-color-secondary);
}

.card-footer .value {
  font-size: 14px;
  font-weight: bold;
}

.chart-placeholder {
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-color-secondary);
}

.chart-placeholder .hint {
  font-size: 13px;
  margin-top: 10px;
}

:deep(.el-table) {
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: var(--bg-color);
}
</style>
