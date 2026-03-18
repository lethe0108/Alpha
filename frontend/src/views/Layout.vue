<template>
  <div class="layout">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="header-left">
        <h1 class="logo">📊 股票选股与跟踪系统</h1>
      </div>
      <div class="header-right">
        <!-- 主题切换 -->
        <el-button @click="toggleTheme" circle>
          <el-icon v-if="theme.isDark"><Sunny /></el-icon>
          <el-icon v-else><Moon /></el-icon>
        </el-button>
        
        <!-- 用户信息 -->
        <el-dropdown>
          <span class="user-info">
            <el-avatar :size="32" icon="User" />
            <span class="username">南哥</span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>个人中心</el-dropdown-item>
              <el-dropdown-item divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container class="main-container">
      <!-- 左侧导航 -->
      <el-aside width="200px" class="sidebar">
        <el-menu
          :default-active="activeMenu"
          router
          background-color="transparent"
          :text-color="theme.isDark ? '#EAEAEA' : '#303133'"
        >
          <el-menu-item index="/">
            <el-icon><HomeFilled /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/screener">
            <el-icon><Search /></el-icon>
            <span>智能选股</span>
          </el-menu-item>
          <el-menu-item index="/transactions">
            <el-icon><Document /></el-icon>
            <span>交易记录</span>
          </el-menu-item>
          <el-menu-item index="/holdings">
            <el-icon><Wallet /></el-icon>
            <span>我的持仓</span>
          </el-menu-item>
          <el-menu-item index="/analysis">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据分析</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="content">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { inject, computed } from 'vue'
import { useRoute } from 'vue-router'
import { HomeFilled, Search, Document, Wallet, DataAnalysis, Sunny, Moon } from '@element-plus/icons-vue'
import type { ThemeConfig } from '@/styles/theme'

const route = useRoute()
const activeMenu = computed(() => route.path)

// 注入主题
const { theme, toggleTheme }: any = inject('theme')
</script>

<style scoped>
.layout {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: var(--bg-color-page);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  color: var(--primary-color);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  color: var(--text-color);
}

.main-container {
  flex: 1;
  overflow: hidden;
}

.sidebar {
  background: var(--bg-color-page);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
}

.content {
  background: var(--bg-color);
  padding: 20px;
  overflow-y: auto;
}

:deep(.el-menu) {
  border-right: none;
}

:deep(.el-menu-item.is-active) {
  background-color: var(--primary-color) !important;
  color: #fff !important;
}
</style>
