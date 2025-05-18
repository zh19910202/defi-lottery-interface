import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import ErrorBoundary from './components/ErrorBoundary'
import { WalletProvider } from './context/walletcontext'

// 获取根元素
const root = document.getElementById('root')

// 移除加载动画
const removeLoader = () => {
  const loader = document.querySelector('.app-loader')
  if (loader) {
    loader.style.opacity = '0'
    loader.style.transition = 'opacity 0.5s ease'
    setTimeout(() => loader.remove(), 500)
  }
}

// 渲染应用
const renderApp = () => {
  if (root) {
    const reactRoot = createRoot(root)
    reactRoot.render(
      <React.StrictMode>
        <ErrorBoundary>
          <WalletProvider>
            <App />
          </WalletProvider>
        </ErrorBoundary>
      </React.StrictMode>
    )

    // 应用加载完成后移除加载动画
    removeLoader()
  } else {
    console.error('找不到根元素，无法渲染应用')
  }
}

// 启动应用
renderApp()

// 开发环境热模块替换支持
if (import.meta.hot) {
  import.meta.hot.accept()
}
