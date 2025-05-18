import React, { useState, useEffect, useContext } from 'react'
import styled, { keyframes } from 'styled-components'
import { WalletContext } from '../context/walletcontext'

const LotteryInfo = () => {
  const {
    walletStatus,
    contracts,
    isNetworkSupported,
    switchNetwork,
    TARGET_NETWORK_ID,
    getPrizePoolAmount,
    provider,
    networkId,
    getCurrentRoundId,
    getNextDrawTimestamp,
    getParticipantsCount,
  } = useContext(WalletContext)

  // 状态定义
  const [currentRound, setCurrentRound] = useState(0)
  const [participants, setParticipants] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [nextDrawTime, setNextDrawDate] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let timer

    const startCountdown = async () => {
      try {
        // 获取时间戳（单位：毫秒）
        const timestamp = await getNextDrawTimestamp()
        console.log('获取到的开奖时间戳:', timestamp)

        if (!timestamp || timestamp <= 0) {
          setError('无效的开奖时间')
          setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 })
          return
        }

        timer = setInterval(() => {
          const now = new Date().getTime() // 当前时间（毫秒）
          const nextDrawDate = new Date(timestamp) // 时间戳转换为 Date
          setNextDrawDate(nextDrawDate)
          const diff = nextDrawDate - now // 时间差（毫秒）

          if (diff <= 0) {
            // 开奖时间已到
            clearInterval(timer)
            setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 })
            setError('开奖时间已到')
            return
          }

          // 计算剩余时间
          const days = Math.floor(diff / (1000 * 60 * 60 * 24))
          const hours = Math.floor(
            (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          )
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((diff % (1000 * 60)) / 1000)

          setTimeRemaining({ days, hours, minutes, seconds })
        }, 1000)
      } catch (err) {
        console.error('获取开奖时间失败:', err)
        setError('无法获取开奖时间')
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    startCountdown()

    return () => {
      if (timer) clearInterval(timer) // 清理定时器
    }
  }, [getNextDrawTimestamp])

  // 模拟获取彩票数据
  useEffect(() => {
    const fetchRoundId = async () => {
      try {
        const id = await getCurrentRoundId()
        setCurrentRound(id.toString()) // 防止 BigInt 渲染错误
      } catch (err) {
        console.error('获取当前轮次失败:', err)
        setCurrentRound(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (provider && contracts.lotteryRouter && isNetworkSupported()) {
      fetchRoundId()
    }
  }, [provider, contracts.lotteryRouter, networkId])

  //  获取本轮参与人数
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const participantsCount = await getParticipantsCount()
        console.log('获取到的参与人数:', participantsCount)
        setParticipants(participantsCount) // 防止 BigInt 渲染错误
      } catch (err) {
        console.error('获取参与人数失败:', err)
        setParticipants(null)
      } finally {
        setIsLoading(false)
      }
    }
    if ((provider && getParticipantsCount, networkId)) {
      fetchParticipants()
    }
  }, [provider, getParticipantsCount, networkId])
  // 处理开奖逻辑
  const handleDraw = async () => {
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

    try {
      const tx = await contracts.lotteryRouter.drawWinner()
      toast.info('正在开奖，请在钱包中确认...')
      const receipt = await tx.wait(2)

      if (receipt.status === 1) {
        toast.success('开奖成功！')
        // 刷新数据
        const id = await getCurrentRoundId()
        setCurrentRound(id.toString())
      } else {
        throw new Error('交易失败')
      }
    } catch (err) {
      console.error('开奖失败:', err)
      let errorMsg = '开奖失败'
      if (err.code === 4001) {
        errorMsg = '您取消了交易'
      } else if (err.reason) {
        errorMsg = err.reason
      } else if (err.message) {
        errorMsg = err.message
      }
      toast.error(`开奖失败: ${errorMsg}`)
    }
  }

  return (
    <Container>
      <CardHeader>
        <LotteryIcon>🎰</LotteryIcon>
        <Title>彩票信息</Title>
        {isLoading && <LoadingIndicator />}
      </CardHeader>

      <InfoGrid>
        <InfoItem>
          <InfoLabel>当前期数</InfoLabel>
          <InfoValue>
            <RoundBadge>{currentRound}</RoundBadge>
          </InfoValue>
        </InfoItem>

        <InfoItem>
          <InfoLabel>参与人数</InfoLabel>
          <InfoValue>
            <ParticipantCount>{participants}</ParticipantCount>
            <ParticipantIcon>👥</ParticipantIcon>
          </InfoValue>
        </InfoItem>

        <InfoItem fullWidth>
          <InfoLabel>距离下次开奖</InfoLabel>
          <TimerContainer>
            <TimeUnit>
              <TimeValue>{timeRemaining.days}</TimeValue>
              <TimeLabel>天</TimeLabel>
            </TimeUnit>
            <TimeSeparator>:</TimeSeparator>
            <TimeUnit>
              <TimeValue>
                {String(timeRemaining.hours).padStart(2, '0')}
              </TimeValue>
              <TimeLabel>时</TimeLabel>
            </TimeUnit>
            <TimeSeparator>:</TimeSeparator>
            <TimeUnit>
              <TimeValue>
                {String(timeRemaining.minutes).padStart(2, '0')}
              </TimeValue>
              <TimeLabel>分</TimeLabel>
            </TimeUnit>
            <TimeSeparator>:</TimeSeparator>
            <TimeUnit>
              <TimeValue>
                {String(timeRemaining.seconds).padStart(2, '0')}
              </TimeValue>
              <TimeLabel>秒</TimeLabel>
            </TimeUnit>
          </TimerContainer>
        </InfoItem>
      </InfoGrid>

      <NextDrawInfo>
        <CalendarIcon>📅</CalendarIcon>
        下次开奖: {nextDrawTime ? nextDrawTime.toLocaleString() : '未知'}
      </NextDrawInfo>

      <DrawButtonContainer>
        <DrawButton
          onClick={handleDraw}
          disabled={
            isLoading ||
            (nextDrawTime && new Date().getTime() < nextDrawTime.getTime())
          }>
          {isLoading ? '处理中...' : '立即开奖'}
        </DrawButton>
      </DrawButtonContainer>
    </Container>
  )
}

// 动画
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`

// 样式组件
const Container = styled.div`
  background: rgba(13, 21, 44, 0.7);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--border-color);
  padding: 1.2rem;
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(10px);
  width: 100%;
`

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  position: relative;
`

const LotteryIcon = styled.div`
  font-size: 1.5rem;
  margin-right: 0.5rem;
  animation: ${pulse} 2s ease-in-out infinite;
`

const Title = styled.h3`
  color: var(--text-primary);
  font-size: 1.2rem;
  margin: 0;
  font-weight: 600;
`

const LoadingIndicator = styled.div`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--accent-color);
  animation: ${rotate} 1s linear infinite;
  position: absolute;
  right: 0;
`

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
`

const InfoItem = styled.div`
  background: rgba(20, 30, 65, 0.5);
  border-radius: var(--border-radius-md);
  padding: 0.8rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  grid-column: ${(props) => (props.fullWidth ? '1 / span 2' : 'auto')};
`

const InfoLabel = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.3rem;
`

const InfoValue = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
`

const RoundBadge = styled.div`
  background: linear-gradient(45deg, #4b7bec, #3867d6);
  color: white;
  padding: 0.1rem 0.5rem;
  border-radius: var(--border-radius-md);
  font-size: 1.1rem;
  box-shadow: 0 2px 8px rgba(59, 103, 214, 0.3);
`

const ParticipantCount = styled.span`
  color: #ff9f43;
  font-size: 1.3rem;
  font-weight: 700;
`

const ParticipantIcon = styled.span`
  font-size: 1.1rem;
`

const TimerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  margin-top: 0.3rem;
`

const TimeUnit = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const TimeValue = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius-sm);
  padding: 0.3rem 0.5rem;
  min-width: 2.5rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  color: var(--accent-color);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
`

const TimeLabel = styled.div`
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-top: 0.2rem;
`

const TimeSeparator = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  margin-top: -0.8rem;
`

const NextDrawInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: rgba(20, 30, 65, 0.3);
  border-radius: var(--border-radius-md);
  padding: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`

const CalendarIcon = styled.span`
  font-size: 1rem;
`

const DrawButtonContainer = styled.div`
  margin-top: 1rem;
  display: flex;
  justify-content: center;
`

const DrawButton = styled.button`
  background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: var(--border-radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
  width: 100%;
  max-width: 200px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`

export default LotteryInfo
