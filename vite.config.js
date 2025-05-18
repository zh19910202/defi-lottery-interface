import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      // 设置代理，解决CORS问题
      '/ethereum-api': {
        target: 'https://ethereum.publicnode.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ethereum-api/, ''),
      },
      '/sepolia-api': {
        target: 'https://sepolia.publicnode.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sepolia-api/, ''),
      }
    }
  },
  // 动态导入配置
  build: {
    rollupOptions: {
      output: {
        manualChunks (id) {
          if (id.includes('node_modules')) {
            return 'vendor'  // 将所有库打包为 vendor.js
          }
        },
      },
    },
  },
})