import React, { useState, useContext, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { toast } from 'react-toastify'
import { WalletContext } from './WalletContext'

import { ethers } from 'ethers'

// 彩票购买表单组件
const LotteryForm = () => {
  const {
    walletStatus,
    contracts,
    isNetworkSupported,
    switchNetwork,
    TARGET_NETWORK_ID,
    getPrizePoolAmount,
    provider,
    networkId,
  } = useContext(WalletContext)

  // 本地状态
  const [betAmount, setBetAmount] = useState('0.1') // 默认投注金额
  const [isValid, setIsValid] = useState(true) // 输入有效性
  const [errorMessage, setErrorMessage] = useState('') // 输入错误信息
  const [isBuying, setIsBuying] = useState(false) // 购买加载状态
  const [txHash, setTxHash] = useState(null) // 交易哈希
  const [isPurchaseSuccessful, setIsPurchaseSuccessful] = useState(false) // 购买成功状态
  const [prizePoolAmount, setPrizePoolAmount] = useState(null) // 奖池金额
  const [isPrizeLoading, setIsPrizeLoading] = useState(false) // 奖池加载状态
  const [prizeError, setPrizeError] = useState(null) // 奖池错误

  const minBetAmount = '0.1' // 最小投注金额
  const maxBetAmount = '1' // 最大投注金额

  // 验证投注金额
  const validateAmount = (value) => {
    setIsValid(false)
    setErrorMessage('')

    // 检查输入是否有效
    if (
      value === null ||
      value === undefined ||
      value.toString().trim() === ''
    ) {
      setErrorMessage('请输入投注金额')
      return false
    }

    const valueStr = value.toString().trim()

    // 验证数字格式
    if (!/^\d*\.?\d*$/.test(valueStr) || valueStr === '.') {
      setErrorMessage('请输入有效的数字')
      return false
    }

    try {
      // 解析金额
      console.log('valueStr:', valueStr)
      console.log('minBetAmount:', minBetAmount)
      console.log('maxBetAmount:', maxBetAmount)
      const amount = ethers.parseEther(valueStr)

      // 解析最小和最大投注金额
      let min, max
      try {
        min = ethers.parseEther(minBetAmount.toString())
        max = ethers.parseEther(maxBetAmount.toString())
      } catch (error) {
        console.error('最小或最大投注金额格式错误:', {
          minBetAmount,
          maxBetAmount,
          error,
        })
        setErrorMessage('系统配置错误，请联系支持')
        return false
      }

      // 检查最小投注金额
      if (amount < min) {
        setErrorMessage(`最小投注金额为 ${ethers.formatEther(min)} ETH`)
        return false
      }

      // 检查最大投注金额
      if (amount > max) {
        setErrorMessage(`最大投注金额为 ${ethers.formatEther(max)} ETH`)
        return false
      }

      // 验证通过
      setIsValid(true)
      setErrorMessage('')
      return true
    } catch (error) {
      console.error('金额解析错误:', { valueStr, error })
      setErrorMessage('请输入有效的数字')
      return false
    }
  }

  // 处理金额输入变化
  const handleAmountChange = (e) => {
    const value = e.target.value
    setBetAmount(value)
    validateAmount(value)
  }

  // 查询奖池余额
  const fetchPrizePoolAmount = async () => {
    setIsPrizeLoading(true)
    setPrizeError(null)
    const amount = await getPrizePoolAmount()
    setPrizePoolAmount(amount)
    if (!amount) {
      setPrizeError('无法获取奖池余额')
    }
    setIsPrizeLoading(false)
  }

  // 购买彩票
  const handleBuy = async () => {
    if (!validateAmount(betAmount)) return
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

    setIsBuying(true)
    setTxHash(null)
    setIsPurchaseSuccessful(false)

    try {
      const amountWei = ethers.parseEther(betAmount)
      console.log('amountWei:', amountWei)
      const tx = await contracts.lotteryRouter.deposit(amountWei)
      setTxHash(tx.hash)

      const receipt = await tx.wait(2) // 等待 2 个确认
      if (receipt.status === 1) {
        setIsPurchaseSuccessful(true)
        toast.success('彩票购买成功！')
        await fetchPrizePoolAmount() // 购买后刷新奖池
        setTimeout(() => {
          setIsPurchaseSuccessful(false)
        }, 5000) // 5 秒后隐藏成功消息
      } else {
        throw new Error('交易失败')
      }
    } catch (err) {
      console.error('购买彩票失败:', err)
      let errorMsg = '购买彩票失败'
      if (err.code === 4001) {
        errorMsg = '您取消了交易'
      } else if (err.code === 'INSUFFICIENT_FUNDS') {
        errorMsg = '余额不足'
      } else if (err.reason) {
        errorMsg = err.reason
      } else if (err.message) {
        errorMsg = err.message
      }
      toast.error(`购买彩票失败: ${errorMsg}`)
    } finally {
      setIsBuying(false)
    }
  }

  // 组件挂载时获取奖池余额
  useEffect(() => {
    if (provider && contracts.prizePool && isNetworkSupported()) {
      fetchPrizePoolAmount()
    }
  }, [provider, contracts.prizePool, networkId])

  return (
    <Container className="float">
      <Title>购买彩票</Title>
      <BalanceCard>
        <BalanceValue>
          {isPrizeLoading || prizePoolAmount === null
            ? '加载中...'
            : `${prizePoolAmount} ETH`}
        </BalanceValue>
        {prizeError && <ErrorMessage>{prizeError}</ErrorMessage>}
      </BalanceCard>

      <InputGroup>
        <InputLabel>投注金额 (ETH)</InputLabel>
        <AmountInput
          type="number"
          min={minBetAmount}
          max={maxBetAmount}
          step="0.1"
          value={betAmount}
          onChange={handleAmountChange}
          className={!isValid ? 'invalid' : ''}
        />
        {!isValid && <ErrorMessage>{errorMessage}</ErrorMessage>}
      </InputGroup>

      <BuyButton
        onClick={handleBuy}
        disabled={isBuying || !isValid}
        aria-label={isBuying ? '处理中' : '购买彩票'}>
        {isBuying ? '处理中...' : '购买彩票'}
      </BuyButton>

      {isPurchaseSuccessful && (
        <SuccessMessage>
          <span>🎉</span> 您的彩票已成功购买！等待开奖结果...
          {txHash && (
            <TransactionLink
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer">
              查看交易详情
            </TransactionLink>
          )}
        </SuccessMessage>
      )}
    </Container>
  )
}

// 动画定义
const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const shine = keyframes`
  0% {
    background-position: -100% 0;
  }
  100% {
    background-position: 200% 0;
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

  &:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
  }
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

const BalanceCard = styled.div`
  background: linear-gradient(
    135deg,
    rgba(20, 30, 65, 0.8),
    rgba(13, 21, 44, 0.8)
  );
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-sm);
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;

  &:after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(103, 128, 255, 0.1),
      transparent
    );
    animation: ${shine} 5s infinite linear;
    transform: rotate(25deg);
  }
`

const BalanceContent = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  width: 100%;
  z-index: 1;
`

const BalanceIcon = styled.div`
  font-size: 1.5rem;
  margin-right: 0.3rem;
`

const BalanceInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`

const BalanceLabel = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0.3rem;
`

const BalanceValue = styled.div`
  font-size: 1.8rem;
  font-weight: bold;
  background: linear-gradient(90deg, #ffe259, #ffa751);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 1px;
`

const BalanceGlow = styled.div`
  position: absolute;
  width: 120px;
  height: 120px;
  right: -20px;
  top: -30px;
  background: radial-gradient(
    circle,
    rgba(255, 215, 0, 0.1) 0%,
    rgba(255, 215, 0, 0) 70%
  );
  z-index: 0;
`

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: var(--spacing-sm);
`

const InputLabel = styled.label`
  font-size: 0.95rem;
  margin-bottom: var(--spacing-xs);
  color: var(--text-primary);
  font-weight: 500;
`

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`

const AmountInput = styled.input`
  width: 100%;
  padding: 0.8rem;
  background: rgba(20, 30, 65, 0.6);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 1.1rem;
  border-radius: var(--border-radius-md);
  transition: all 0.3s ease;
  outline: none;
  box-shadow: var(--shadow-sm);

  &:focus {
    border-color: var(--primary-light);
    background: rgba(20, 30, 65, 0.8);
    box-shadow: 0 0 0 2px rgba(103, 128, 255, 0.1);
  }

  &.invalid {
    border-color: var(--danger);
    box-shadow: 0 0 0 2px rgba(255, 71, 87, 0.2);
  }

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`

const InputCurrency = styled.div`
  position: absolute;
  right: 12px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  pointer-events: none;
`

const ErrorMessage = styled.div`
  color: var(--danger);
  font-size: 0.85rem;
  margin-top: var(--spacing-xs);
  display: flex;
  align-items: center;

  &:before {
    content: '⚠️';
    margin-right: 5px;
    font-size: 0.9rem;
  }
`

const BetLimits = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: var(--spacing-xs);
  text-align: right;
`

const ButtonContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`

const BuyButton = styled.button`
  background: var(--primary-gradient);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  padding: 1rem;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: var(--spacing-sm);
  box-shadow: var(--shadow-md);
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
    animation: ${shine} 3s infinite;
  }

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: var(--shadow-lg);
  }

  &:active:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: linear-gradient(90deg, #3a6ae6, #6780ff);
  }
`

const Spinner = styled.div`
  width: ${(props) => (props.size === 'small' ? '16px' : '20px')};
  height: ${(props) => (props.size === 'small' ? '16px' : '20px')};
  border-radius: 50%;
  border: ${(props) => (props.size === 'small' ? '2px' : '3px')} solid
    rgba(255, 255, 255, 0.3);
  border-top-color: white;
  animation: ${rotate} 1s infinite linear;
`

const RefreshButton = styled.button`
  background: rgba(103, 128, 255, 0.1);
  border: 1px solid rgba(103, 128, 255, 0.3);
  color: var(--text-primary);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: auto;

  &:hover:not(:disabled) {
    background: rgba(103, 128, 255, 0.2);
    transform: rotate(15deg);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const ButtonIcon = styled.span`
  font-size: 1.2rem;
`

const InfoText = styled.div`
  background: rgba(20, 30, 65, 0.5);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-size: 0.9rem;
  color: var(--text-secondary);
  border-left: 3px solid var(--primary);
  margin-top: var(--spacing-sm);
  display: flex;
  align-items: flex-start;
  gap: 8px;
  line-height: 1.5;
`

const InfoIcon = styled.span`
  font-size: 1rem;
  margin-top: 1px;
`

const SuccessMessage = styled.div`
  background: rgba(46, 213, 115, 0.1);
  border: 1px solid rgba(46, 213, 115, 0.3);
  color: #2ed573;
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  margin-top: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;

  span {
    font-size: 1.2rem;
  }
`

export default LotteryForm
