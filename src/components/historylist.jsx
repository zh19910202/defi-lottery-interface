import React, { useContext, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { WalletContext } from './WalletContext'
import { useEffect } from 'react'
import { ethers } from 'ethers'
import { toast } from 'react-toastify'

// 中奖历史组件
const HistoryList = () => {
  const { formatAddress, isNetworkSupported, getLotteryHistory } =
    useContext(WalletContext)

  // 状态管理
  const [winnerHistory, setWinnerHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
 

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return '未知时间'

    try {
      const date = new Date(timestamp)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch (e) {
      console.error('时间格式化错误:', e)
      return '未知时间'
    }
  }

  // 获取中奖历史
  const fetchWinnerHistory = async () => {
    if (!isNetworkSupported()) {
      setError('当前网络不支持')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const history = await getLotteryHistory(1, 5) // 获取第 1 页，10 条记录
      console.log('获取到的中奖历史:', history)
      if (history) {
        // 过滤已结束且有中奖者的轮次
        const winners = history
          .filter((round) => round.winner)
          .map((round) => ({
            winner: round.winner,
            timestamp: round.endTime,
            amount: round.prizeAmount,
          }))
        setWinnerHistory(winners)
      } else {
        setError('无法获取中奖历史')
      }
    } catch (err) {
      console.error('获取中奖历史失败:', err)
      setError('获取中奖历史失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 组件挂载时获取数据
  useEffect(() => {
    fetchWinnerHistory()
  }, [isNetworkSupported])

  return (
    <Container className="float">
      <Title>中奖历史</Title>

      {isLoading ? (
        <EmptyState>
          <EmptyIcon>⏳</EmptyIcon>
          <EmptyText>加载中...</EmptyText>
        </EmptyState>
      ) : error ? (
        <EmptyState>
          <EmptyIcon>❌</EmptyIcon>
          <EmptyText>{error}</EmptyText>
        </EmptyState>
      ) : winnerHistory && winnerHistory.length > 0 ? (
        <List>
          {winnerHistory.map((item, index) => (
            <HistoryItem key={index}>
              <WinnerDetails>
                <WinnerAddress>
                  <span>🏆</span>
                  {formatAddress(item.winner)}
                </WinnerAddress>
                <WinTime>{formatTime(item.timestamp)}</WinTime>
              </WinnerDetails>
              <WinAmount>
                {parseFloat(item.amount).toFixed(4)} <span>ETH</span>
              </WinAmount>
            </HistoryItem>
          ))}
        </List>
      ) : (
        <EmptyState>
          <EmptyIcon>📊</EmptyIcon>
          <EmptyText>
            暂无中奖记录
            <EmptySubText>成为第一个中奖者！</EmptySubText>
          </EmptyText>
        </EmptyState>
      )}

      <InfoCard>
        <InfoIcon>💡</InfoIcon>
        <InfoContent>
          <InfoTitle>中奖规则</InfoTitle>
          <InfoDesc>
            每当合约条件满足时，系统将自动随机选择一名参与者作为获胜者。获胜者将获得奖池中的全部金额！
          </InfoDesc>
        </InfoContent>
      </InfoCard>
    </Container>
  )
}

// 动画
const shimmer = keyframes`
  0% {
    background-position: -100% 0;
  }
  100% {
    background-position: 200% 0;
  }
`

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`

// 样式组件
const Container = styled.section`
  background: var(--background-card);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(8px);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  width: 100%;
  min-height: 400px;
`

const Title = styled.h2`
  font-size: 1.5rem;
  margin: 0 0 1.2rem 0;
  color: var(--accent-color);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.8rem;
  letter-spacing: 0.5px;
  position: relative;

  &:after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 60px;
    height: 3px;
    background: var(--primary-gradient);
    border-radius: 3px;
  }
`

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
`

const HistoryItem = styled.li`
  background: rgba(20, 30, 65, 0.5);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid var(--border-color);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px) scale(1.01);
    background: rgba(20, 30, 65, 0.7);
    box-shadow: var(--shadow-md);
  }
`

const WinnerDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`

const WinnerAddress = styled.div`
  font-family: monospace;
  color: var(--accent-color);
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;

  span {
    font-size: 1.1rem;
  }
`

const WinTime = styled.div`
  color: var(--text-secondary);
  font-size: 0.8rem;
`

const WinAmount = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--primary-light);
  background: linear-gradient(90deg, var(--primary-light), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  span {
    font-size: 0.9rem;
    opacity: 0.9;
  }
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl) 0;
  color: var(--text-secondary);
  gap: var(--spacing-md);
  flex: 1;
`

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
  animation: ${pulse} 2s infinite ease-in-out;
`

const EmptyText = styled.div`
  font-size: 1.2rem;
  color: var(--text-secondary);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const EmptySubText = styled.span`
  font-size: 0.9rem;
  color: var(--primary-light);
`

const InfoCard = styled.div`
  background: linear-gradient(
    135deg,
    rgba(74, 124, 255, 0.1),
    rgba(94, 231, 223, 0.05)
  );
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-top: auto;
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
  border: 1px solid rgba(74, 124, 255, 0.2);
`

const InfoIcon = styled.div`
  font-size: 1.5rem;
`

const InfoContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`

const InfoTitle = styled.div`
  color: var(--primary-light);
  font-weight: 600;
  font-size: 1rem;
`

const InfoDesc = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
`

export default HistoryList
