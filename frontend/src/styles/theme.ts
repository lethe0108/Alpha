/**
 * 主题配置
 * 支持深色/浅色主题切换
 */
export interface ThemeConfig {
  isDark: boolean
  primaryColor: string
  backgroundColor: string
  textColor: string
  borderColor: string
}

// 浅色主题
export const lightTheme: ThemeConfig = {
  isDark: false,
  primaryColor: '#409EFF',
  backgroundColor: '#F5F7FA',
  textColor: '#303133',
  borderColor: '#DCDFE6'
}

// 深色主题 (炒股用户常用)
export const darkTheme: ThemeConfig = {
  isDark: true,
  primaryColor: '#409EFF',
  backgroundColor: '#1A1A2E',
  textColor: '#EAEAEA',
  borderColor: '#2D2D44'
}

// 股票颜色 (红涨绿跌)
export const stockColors = {
  up: '#F56C6C',      // 红色 - 涨
  down: '#67C23A',    // 绿色 - 跌
  flat: '#909399',    // 灰色 - 平
  primary: '#409EFF'  // 蓝色 - 主色
}

// 深色模式股票颜色
export const stockColorsDark = {
  up: '#FF4D4F',      // 亮红
  down: '#52C41A',    // 亮绿
  flat: '#8C8C8C',
  primary: '#409EFF'
}
