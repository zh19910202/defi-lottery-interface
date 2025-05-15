import React, { useContext, useState, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { WalletContext } from './WalletContext'
import { ethers } from 'ethers'
import { toast } from 'react-toastify'

// 中奖历史组件
const HistoryList = () => {
  const { 
    formatAddress, 
    isNetworkSupported, 
    getLotteryHistory, 
    contracts, 
    walletStatus, 
    switchNetwork, 
    TARGET_NETWORK_ID 
  } = useContext(WalletContext)

  // 状态管理
  const [winnerHistory, setWinnerHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [claimingRounds, setClaimingRounds] = useState({}) // 跟踪正在领取的轮次

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
    setIsLoading(true)
    setError(null)

    try {
      const history = await getLotteryHistory(1, 5) // 获取第 1 页，5 条记录
      if (history) {
        const winners = history
          .filter((round) => round.winner)
          .map((round) => ({
            winner: round.winner,
            timestamp: round.endTime,
            amount: round.prizeAmount,
            isClaimed: round.isClaimed,
            roundId: round.roundId, // 假设历史记录包含轮次ID
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

  // 领取奖金
  const handleClaim = async (roundId) => {
    if (walletStatus !== 'connected') {
      toast.error('请先连接钱包')
      return
    }
    if (!isNetworkSupported()) {
      toast.error('请切换到支持的网络')
      await switchNetwork(TARGET_NETWORK_ID)
      return
    }
    if (!contracts.lotteryRouter) {
      toast.error('彩票合约不可用')
      return
    }

    setClaimingRounds((prev) => ({ ...prev, [roundId]: true }))

    try {
      const tx = await contracts.lotteryRouter.claimPrize(roundId)
      toast.info('正在领取奖金，请在钱包中确认...')
      const receipt = await tx.wait(2) // 等待 2 个确认

      if (receipt.status === 1) {
        toast.success('奖金领取成功！')
        // 更新该轮次的领取状态
        setWinnerHistory((prev) =>
          prev.map((item) =>
            item.roundId === roundId ? { ...item, isClaimed: true } : item
          )
        )
      } else {
        throw new Error('交易失败')
      }
    } catch (err) {
      console.error('领取奖金失败:', err)
      let errorMsg = '领取奖金失败'
      if (err.code === 4001) {
        errorMsg = '您取消了交易'
      } else if (err.reason) {
        errorMsg = err.reason
      } else if (err.message) {
        errorMsg = err.message
      }
      toast.error(`领取奖金失败: ${errorMsg}`)
    } finally {
      setClaimingRounds((prev) => ({ ...prev, [roundId]: false }))
    }
  }

  // 组件挂载时获取数据
  useEffect(() => {
    fetchWinnerHistory()
  }, [getLotteryHistory])

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
              <WinInfo>
                <WinAmount>
                  {parseFloat(item.amount).toFixed(4)} <span>ETH</span>
                </WinAmount>
                {item.isClaimed ? (
                  <ClaimedStatus>已领奖</ClaimedStatus>
                ) : (
                  <ClaimButton
                    onClick={() => handleClaim(item.roundId)}
                    disabled={claimingRounds[item.roundId]}
                  >
                    {claimingRounds[item.roundId] ? '处理中...' : '领取奖金'}
                  </ClaimButton>
                )}
              </WinInfo>
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
            每当合约条件满足时，系统将自动随机选择一名参与者作为获胜者。获胜者将获得奖池中的全部金额！请及时领取您的奖金。
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

const WinInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
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

const ClaimButton = styled.button`
  background: var(--primary-gradient);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  padding: 0.5rem 1rem;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    animation: ${shimmer} 3s infinite;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: linear-gradient(90deg, #3a6ae6, #6780ff);
  }
`

const ClaimedStatus = styled.div`
  color: #2ed573;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius-md);
  background: rgba(46, 213, 115, 0.1);
  border: 1px solid rgba(46, 213, 115, 0.3);
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
  animation: ${pulse} 24s infinite ease-in-out;
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