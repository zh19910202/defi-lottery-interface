import React, { useContext, useState, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { WalletContext } from './WalletContext'
import { toast } from 'react-toastify'

const PrizePool = () => {
  const {
    contracts,
    networkName,
    provider,
    getPrizePoolAmount,
    networkId,
    isNetworkSupported,
  } = useContext(WalletContext)

  const [winRate, setWinRate] = useState(0)
  const [totalParticipants, setTotalParticipants] = useState(0)
  const [prizeHistory, setPrizeHistory] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isPrizeLoading, setIsPrizeLoading] = useState(false) // 奖池加载状态
  const [prizePoolAmount, setPrizePoolAmount] = useState(null) // 奖池金额
  const [prizeError, setPrizeError] = useState(null) // 奖池错误

  // 查询奖池余额
  const fetchPrizePoolAmount = async () => {
    setIsPrizeLoading(true)
    setPrizeError(null)
    const amount = await getPrizePoolAmount()
    console.log('获取到的奖池金额:', amount)
    setPrizePoolAmount(amount)
    if (!amount) {
      setPrizeError('无法获取奖池余额')
    }
    setIsPrizeLoading(false)
  }
  useEffect(() => {
    if (provider && contracts.prizePool && isNetworkSupported()) {
      fetchPrizePoolAmount()
    }
  }, [provider, contracts.prizePool, networkId])

  const networkStatus = isLoading ? 'loading' : provider ? 'online' : 'offline'
  return (
    <Container>
      <PrizeSection>
        <PrizeHeader>
          <PrizeIcon>💰</PrizeIcon>
          <PrizeTitle>当前奖池</PrizeTitle>
          {(isLoading || isPrizeLoading) && <LoadingDot />}
          {networkStatus === 'offline' && (
            <NetworkStatus offline>网络已断开</NetworkStatus>
          )}
          {networkStatus === 'error' && (
            <NetworkStatus error>连接错误</NetworkStatus>
          )}
          {networkStatus === 'online' && !error && (
            <NetworkStatus>已连接</NetworkStatus>
          )}
        </PrizeHeader>

        <PrizeAmount>
          <EthIcon>Ξ</EthIcon>
          <Amount>{prizePoolAmount}</Amount>
          <EthLabel>ETH</EthLabel>
        </PrizeAmount>

        <UsdValue></UsdValue>
      </PrizeSection>

      <StatsSection>
        <StatItem>
          <StatValue>{winRate}%</StatValue>
          <StatLabel>中奖率</StatLabel>
        </StatItem>

        <StatItem>
          <StatValue>{totalParticipants.toLocaleString()}</StatValue>
          <StatLabel>总参与人次</StatLabel>
        </StatItem>

        <StatItem>
          <StatValue>Ξ {prizeHistory}</StatValue>
          <StatLabel>历史奖金</StatLabel>
        </StatItem>
      </StatsSection>
    </Container>
  )
}

// 网络状态指示器
const NetworkStatus = styled.span`
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: 10px;
  background-color: ${(props) =>
    props.offline ? '#f5a623' : props.error ? '#e74c3c' : '#2ecc71'};
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`

// 刷新按钮
const RefreshButton = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 0.8rem;
  margin-left: 10px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2980b9;
  }
`

// 错误信息
const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 5px;
  text-align: center;
`

// 动画
const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.5; }
`

const shimmer = keyframes`
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
`

// 样式组件
const Container = styled.div`
  width: 100%;
  background: rgba(13, 21, 44, 0.7);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(10px);
  overflow: hidden;
`

const PrizeSection = styled.div`
  padding: 1.5rem;
  background: linear-gradient(
    135deg,
    rgba(74, 124, 255, 0.2) 0%,
    rgba(94, 231, 223, 0.1) 100%
  );
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 15%;
    width: 70%;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      rgba(94, 231, 223, 0.5),
      transparent
    );
  }
`

const PrizeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  width: 100%;
  position: relative;
`

const PrizeIcon = styled.span`
  font-size: 1.5rem;
  margin-right: 0.5rem;
  animation: ${pulse} 3s infinite ease-in-out;
`

const PrizeTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
`

const LoadingDot = styled.span`
  position: absolute;
  right: 0;
  width: 10px;
  height: 10px;
  background-color: var(--accent-color);
  border-radius: 50%;
  animation: ${shimmer} 1s infinite;
`

const PrizeAmount = styled.div`
  display: flex;
  align-items: center;
  margin: 0.5rem 0;
  position: relative;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.5rem 1.5rem;
  border-radius: var(--border-radius-xl);
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const EthIcon = styled.span`
  font-size: 1.8rem;
  font-weight: 300;
  margin-right: 0.5rem;
  color: #6c8be4;
`

const Amount = styled.div`
  font-size: 2.2rem;
  font-weight: 700;
  color: white;
  letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
`

const EthLabel = styled.div`
  font-size: 1rem;
  font-weight: 400;
  margin-left: 0.5rem;
  color: #7f8fa6;
  align-self: flex-end;
  margin-bottom: 0.4rem;
`

const UsdValue = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
  opacity: 0.8;
`

const StatsSection = styled.div`
  display: flex;
  padding: 1rem;
  justify-content: space-around;
`

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  padding: 0.5rem;
  text-align: center;
  border-right: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-right: none;
  }
`

const StatValue = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--accent-color);
  margin-bottom: 0.2rem;
`

const StatLabel = styled.div`
  font-size: 0.7rem;
  color: var(--text-secondary);
  white-space: nowrap;
`

export default PrizePool
