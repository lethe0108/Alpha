<template>
  <div id="app" :data-theme="theme.isDark ? 'dark' : 'light'">
    <el-config-provider :locale="zhCn">
      <router-view />
    </el-config-provider>
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { lightTheme, darkTheme, type ThemeConfig } from './styles/theme'

// 主题状态
const theme = ref<ThemeConfig>(lightTheme)

// 切换主题
const toggleTheme = () => {
  theme.value = theme.value.isDark ? lightTheme : darkTheme
  document.documentElement.setAttribute('data-theme', theme.value.isDark ? 'dark' : 'light')
  localStorage.setItem('theme', theme.value.isDark ? 'dark' : 'light')
}

// 提供给子组件
provide('theme', {
  theme,
  toggleTheme
})

// 初始化主题
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    theme.value = darkTheme
    document.documentElement.setAttribute('data-theme', 'dark')
  }
}

initTheme()
</script>

<style>
#app {
  width: 100%;
  height: 100%;
}
</style>
