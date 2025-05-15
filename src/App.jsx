import React from 'react'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import styled, { createGlobalStyle } from 'styled-components'
import './App.css'
import ErrorBoundary from './components/ErrorBoundary'
import WalletStatus from './components/WalletStatus'
import LotteryForm from './components/LotteryForm'
import HistoryList from './components/Historylist'
import LotteryInfo from './components/LotteryInfo'
import PrizePool from './components/PrizePool'

// 全局样式
const GlobalStyle = createGlobalStyle`
  :root {
    /* 颜色 */
    --primary-light: #6780ff;
    --primary: #4a7cff;
    --primary-dark: #3a6ae6;
    --accent-color: #5ee7df;
    --text-primary: #e9eeff;
    --text-secondary: #b3c0e6;
    --background-main: #040c1f;
    --background-card: rgba(13, 21, 44, 0.7);
    --border-color: rgba(103, 128, 255, 0.2);
    --danger: #ff4757;
    --success: #2ed573;
    --warning: #ffa502;
    
    /* 梯度 */
    --primary-gradient: linear-gradient(45deg, var(--primary), var(--accent-color));
    --header-gradient: linear-gradient(135deg, #1c2954, #040c1f);
    --card-gradient: linear-gradient(180deg, rgba(13, 21, 44, 0.8), rgba(13, 21, 44, 0.6));
    
    /* 间距 */
    --spacing-xs: 0.5rem;
    --spacing-sm: 0.75rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;
    --spacing-xl: 2rem;
    
    /* 圆角 */
    --border-radius-sm: 4px;
    --border-radius-md: 8px;
    --border-radius-lg: 12px;
    --border-radius-xl: 20px;
    
    /* 阴影 */
    --shadow-sm: 0 2px 10px rgba(0, 0, 0, 0.15);
    --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.2);
    --shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.25);
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    height: 100%;
    width: 100%;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-size: 16px;
    line-height: 1.5;
    background-color: var(--background-main);
    color: var(--text-primary);
    overflow-x: hidden;
  }

  #root {
    min-height: 100%;
    display: flex;
    flex-direction: column;
  }

  a {
    color: var(--primary-light);
    text-decoration: none;
    transition: color 0.2s ease;
  }

  a:hover {
    color: var(--accent-color);
  }

  button {
    cursor: pointer;
    font-family: inherit;
  }

  input, button {
    font-size: 1rem;
  }

  /* 卡片动效类 */
  .float {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .float:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
  }
`

function LotteryApp() {
  return (
    <AppContainer>
      <GlobalStyle />

      <Header>
        <Title>
          <span>DeFi</span> 彩票系统
        </Title>
        <WalletStatus />
      </Header>

      <MainContent>
        <GridItem area="form">
          <LotteryForm />
        </GridItem>
        <GridItem area="info-lottery">
          <LotteryInfo />
        </GridItem>
        <GridItem area="info-prize">
          <PrizePool />
        </GridItem>
        <GridItem area="history">
          <HistoryList />
        </GridItem>
      </MainContent>

      <Footer>
        &copy; {new Date().getFullYear()} DeFi彩票系统 —
        基于以太坊的去中心化彩票应用
      </Footer>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </AppContainer>
  )
}

// 样式组件
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-image: radial-gradient(
    circle at 50% 50%,
    rgba(26, 42, 99, 0.4) 0%,
    rgba(4, 12, 31, 1) 75%
  );
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100vh;
    background: linear-gradient(
        135deg,
        rgba(74, 124, 255, 0.05),
        transparent 40%
      ),
      linear-gradient(45deg, rgba(94, 231, 223, 0.05), transparent 40%);
    z-index: -1;
  }
`

// 头部
const Header = styled.header`
  background: var(--header-gradient);
  padding: var(--spacing-lg) var(--spacing-xl);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
`

// 标题
const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
  text-shadow: 0 2px 10px rgba(74, 124, 255, 0.3);

  span {
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`

// 主要内容
const MainContent = styled.main`
  flex: 1;
  padding: var(--spacing-xl);
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-areas:
    'form'
    'info-lottery'
    'info-prize'
    'history';
  gap: var(--spacing-xl);

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      'form info-lottery'
      'info-prize history';
  }
`

const InfoSection = styled.section`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
  width: 100%;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
    grid-column: 1 / span 2;
  }
`

// 页脚
const Footer = styled.footer`
  background: rgba(13, 21, 44, 0.9);
  padding: var(--spacing-lg);
  text-align: center;
  border-top: 1px solid var(--border-color);
  font-size: 0.9rem;
  color: var(--text-secondary);
`

const GridItem = styled.div`
  grid-area: ${(props) => props.area};
  width: 100%;
  margin-top: 0;
  height: 100%;
  display: flex;

  /* 确保子组件占满整个区域，并且不会添加额外间距 */
  & > * {
    width: 100%;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }
`

// 主应用组件
const App = () => {
  return (
    <ErrorBoundary>
      <LotteryApp />
    </ErrorBoundary>
  )
}

export default App
