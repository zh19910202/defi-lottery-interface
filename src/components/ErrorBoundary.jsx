import React, { Component } from 'react'
import styled from 'styled-components'

/**
 * 错误边界组件
 * 捕获子组件树中的JavaScript错误，并显示备用UI，防止整个应用崩溃
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  // 捕获错误并更新状态
  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  // 记录错误信息
  componentDidCatch(error, errorInfo) {
    console.error('应用错误:', error, errorInfo)
    this.setState({
      error: error,
      errorInfo: errorInfo,
    })
  }

  // 重置错误状态
  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    // 尝试刷新页面
    window.location.reload()
  }

  render() {
    // 如果发生错误，显示错误UI
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorCard>
            <ErrorIcon>⚠️</ErrorIcon>
            <ErrorTitle>应用发生错误</ErrorTitle>
            <ErrorDescription>很抱歉，应用运行中出现了问题。</ErrorDescription>

            {this.state.error && (
              <ErrorMessage>{this.state.error.toString()}</ErrorMessage>
            )}

            <ResetButton onClick={this.handleReset}>刷新页面</ResetButton>

            <ErrorTip>
              如果问题持续存在，请尝试清除浏览器缓存或联系技术支持。
            </ErrorTip>
          </ErrorCard>
        </ErrorContainer>
      )
    }

    // 正常情况下渲染子组件
    return this.props.children
  }
}

// 样式组件
const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background: var(--background-main);
  background-image: radial-gradient(
    circle at 50% 50%,
    rgba(26, 42, 99, 0.4) 0%,
    rgba(4, 12, 31, 1) 75%
  );
`

const ErrorCard = styled.div`
  background: rgba(13, 21, 44, 0.8);
  border-radius: var(--border-radius-lg);
  padding: 2.5rem;
  max-width: 500px;
  width: 100%;
  text-align: center;
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
`

const ErrorIcon = styled.div`
  font-size: 3.5rem;
  margin-bottom: 1rem;
`

const ErrorTitle = styled.h2`
  font-size: 1.8rem;
  color: var(--danger);
  margin: 0;
`

const ErrorDescription = styled.p`
  font-size: 1.1rem;
  color: var(--text-primary);
  margin: 0;
`

const ErrorMessage = styled.div`
  background: rgba(255, 71, 87, 0.1);
  border-left: 3px solid var(--danger);
  padding: 1rem;
  color: var(--text-secondary);
  font-family: monospace;
  text-align: left;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  border-radius: var(--border-radius-md);
`

const ResetButton = styled.button`
  background: var(--primary-gradient);
  border: none;
  border-radius: var(--border-radius-md);
  color: white;
  padding: 0.8rem 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-md);

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-lg);
  }

  &:active {
    transform: translateY(-1px);
  }
`

const ErrorTip = styled.p`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
  font-style: italic;
`

export default ErrorBoundary
