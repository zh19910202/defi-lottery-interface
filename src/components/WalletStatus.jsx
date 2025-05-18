import React, { useContext, useState, useRef, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { WalletContext } from '../context/walletcontext'

const WalletStatus = () => {
  const {
    connectedAccount: account,
    walletStatus,
    isLoading,
    networkName,
    formatAddress,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  } = useContext(WalletContext)

  // 添加本地状态追踪断开连接操作
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  // 添加网络菜单状态
  const [networkMenuOpen, setNetworkMenuOpen] = useState(false)

  // 添加网络列表
  const networks = [
    { id: 1, name: '以太坊主网', color: '#627EEA' },
    { id: 11155111, name: 'Sepolia测试网', color: '#CFB5F0' },
    { id: 5, name: 'Goerli测试网', color: '#3099f2' },
    { id: 137, name: 'Polygon', color: '#8247E5' },
    { id: 56, name: 'BSC', color: '#F3BA2F' },
    { id: 43114, name: 'Avalanche', color: '#E84142' },
    { id: 42161, name: 'Arbitrum', color: '#28A0F0' },
    { id: 10, name: 'Optimism', color: '#FF0420' },
  ]

  const isConnected = walletStatus === 'connected'
  const isOnCorrectNetwork =
    networkName === '以太坊主网' || networkName === 'Sepolia测试网'

  // 处理断开连接
  const handleDisconnect = () => {
    setIsDisconnecting(true)
    disconnectWallet()

    // 500ms后重置断开状态，提供短暂的视觉反馈
    setTimeout(() => {
      setIsDisconnecting(false)
    }, 500)
  }

  // 处理网络切换
  const handleNetworkSwitch = (chainId) => {
    switchNetwork(chainId)
    setNetworkMenuOpen(false)
  }

  // 处理菜单点击外部关闭
  const networkMenuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        networkMenuRef.current &&
        !networkMenuRef.current.contains(event.target)
      ) {
        setNetworkMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <Container>
      {!isConnected ? (
        <ConnectButton onClick={connectWallet} disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner /> 连接中...
            </>
          ) : (
            <>
              <ButtonIcon>🔌</ButtonIcon> 连接钱包
            </>
          )}
        </ConnectButton>
      ) : (
        <AccountInfo>
          <NetworkSection ref={networkMenuRef}>
            <NetworkBadge
              onClick={() => setNetworkMenuOpen(!networkMenuOpen)}
              $iscorrect={isOnCorrectNetwork}>
              {networkName}
              <NetworkIcon>
                {!isOnCorrectNetwork ? (
                  <SwitchIcon>🔄</SwitchIcon>
                ) : (
                  <ChevronIcon>{networkMenuOpen ? '▲' : '▼'}</ChevronIcon>
                )}
              </NetworkIcon>
            </NetworkBadge>

            {networkMenuOpen && (
              <NetworkMenu>
                {networks.map((network) => (
                  <NetworkMenuItem
                    key={network.id}
                    onClick={() => handleNetworkSwitch(network.id)}
                    isActive={networkName === network.name}
                    color={network.color}>
                    {network.name}
                    {networkName === network.name && <CheckIcon>✓</CheckIcon>}
                  </NetworkMenuItem>
                ))}
              </NetworkMenu>
            )}
          </NetworkSection>

          <AddressSection>
            <AddressDisplay title={account}>
              {formatAddress(account)}
            </AddressDisplay>
          </AddressSection>

          <DisconnectButton
            onClick={handleDisconnect}
            disabled={isDisconnecting}>
            {isDisconnecting ? (
              <>
                <SmallSpinner /> 断开中...
              </>
            ) : (
              '断开连接'
            )}
          </DisconnectButton>
        </AccountInfo>
      )}
    </Container>
  )
}

// 动画
const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`

const shimmer = keyframes`
  0% { background-position: -100% 0; }
  100% { background-position: 200% 0; }
`

// 样式组件
const Container = styled.div`
  display: flex;
  align-items: center;
`

const ConnectButton = styled.button`
  background: var(--primary-gradient);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  padding: 0.6rem 1.2rem;
  font-weight: 600;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-lg);
  }

  &:active {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  &::before {
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
`

const ButtonIcon = styled.span`
  font-size: 1.1rem;
`

const Spinner = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  animation: ${rotate} 1s linear infinite;
  margin-right: 8px;
`

const AccountInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(13, 21, 44, 0.6);
  border-radius: var(--border-radius-md);
  padding: 0.4rem 0.8rem;
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-end;
  }
`

const NetworkSection = styled.div`
  position: relative;
`

const NetworkBadge = styled.div`
  background: ${(props) =>
    props.isCorrect
      ? 'linear-gradient(45deg, #2ed573, #7bed9f)'
      : 'linear-gradient(45deg, #ffa502, #ff6b6b)'};
  color: ${(props) => (props.isCorrect ? '#1e272e' : 'white')};
  padding: 0.4rem 0.8rem;
  border-radius: var(--border-radius-xl);
  font-size: 0.85rem;
  font-weight: 600;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
  white-space: nowrap;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }

  &::before {
    content: '⚡';
    font-size: 0.8rem;
  }
`

const NetworkIcon = styled.span`
  display: flex;
  align-items: center;
  margin-left: 2px;
`

const ChevronIcon = styled.span`
  font-size: 0.7rem;
  transition: transform 0.3s ease;
`

const SwitchIcon = styled.span`
  font-size: 0.9rem;
  animation: ${rotate} 2s linear infinite;
`

const NetworkMenu = styled.div`
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  background: rgba(15, 23, 42, 0.95);
  border-radius: var(--border-radius-md);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-color);
  z-index: 100;
  min-width: 170px;
  max-height: 300px;
  overflow-y: auto;
  backdrop-filter: blur(10px);
`

const NetworkMenuItem = styled.div`
  padding: 0.6rem 1rem;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid
    ${(props) => (props.isActive ? props.color : 'transparent')};
  background: ${(props) =>
    props.isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent'};

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${(props) => props.color};
    margin-right: 8px;
  }
`

const CheckIcon = styled.span`
  color: var(--accent-color);
  font-weight: bold;
`

const AddressSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const AddressDisplay = styled.div`
  background: rgba(20, 30, 65, 0.7);
  padding: 0.4rem 0.8rem;
  border-radius: var(--border-radius-md);
  font-size: 0.9rem;
  font-family: monospace;
  color: var(--accent-color);
  letter-spacing: 0.5px;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;

  &:hover {
    background: rgba(20, 30, 65, 0.9);
    transform: translateY(-2px);

    &::after {
      content: '复制';
      position: absolute;
      right: 8px;
      font-size: 0.7rem;
      opacity: 0.7;
      color: var(--text-secondary);
    }
  }

  &::before {
    content: '👤';
    margin-right: 5px;
    font-size: 0.8rem;
  }
`

const DisconnectButton = styled.button`
  background: rgba(255, 118, 117, 0.1);
  color: #ff7675;
  border: 1px solid rgba(255, 118, 117, 0.2);
  border-radius: var(--border-radius-md);
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background: rgba(255, 118, 117, 0.15);
    border-color: rgba(255, 118, 117, 0.3);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(-1px);
  }
`

const SmallSpinner = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  animation: ${rotate} 1s linear infinite;
  margin-right: 8px;
`

export default WalletStatus
