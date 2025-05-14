import React, { useContext } from 'react'
import styled from 'styled-components'
import { WalletContext } from '../context/WalletContext'
import { getRecommendedNetworkId } from '../utils/contract'

// 钱包连接按钮组件
const WalletButton = () => {
  const {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    account,
    formatAddress,
    networkName,
    switchNetwork,
    isOnSupportedNetwork,
  } = useContext(WalletContext)

  // 处理连接钱包
  const handleConnect = () => {
    connect()
  }

  // 处理断开连接
  const handleDisconnect = () => {
    disconnect()
  }

  // 处理切换网络
  const handleSwitchNetwork = () => {
    switchNetwork(getRecommendedNetworkId())
  }

  // 根据连接状态显示不同的UI
  if (isConnected) {
    return (
      <AccountInfo>
        <NetworkDisplay
          onClick={handleSwitchNetwork}
          isSupported={isOnSupportedNetwork}>
          {networkName || '未知网络'}
        </NetworkDisplay>
        <AddressDisplay>{formatAddress(account)}</AddressDisplay>
        <DisconnectButton onClick={handleDisconnect}>断开</DisconnectButton>
      </AccountInfo>
    )
  }

  return (
    <ConnectButton onClick={handleConnect} disabled={isConnecting}>
      {isConnecting ? '连接中...' : '连接钱包'}
    </ConnectButton>
  )
}

// 样式组件
const ConnectButton = styled.button`
  background: linear-gradient(45deg, var(--primary-light), var(--primary-dark));
  border: none;
  border-radius: var(--border-radius-md);
  color: white;
  padding: 0.6rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease, transform 0.15s ease;
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
    transition: all 0.6s ease;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);

    &:before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: var(--shadow-sm);
    background: linear-gradient(45deg, #8a97b7, #a5b4e5);
  }
`

const AccountInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
  background: var(--background-card);
  padding: 0.8rem;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(8px);
`

const NetworkDisplay = styled.button`
  background: rgba(13, 21, 44, 0.6);
  border: 1px solid
    ${(props) =>
      props.isSupported
        ? 'rgba(103, 128, 255, 0.3)'
        : 'rgba(255, 87, 87, 0.3)'};
  border-radius: var(--border-radius-sm);
  color: ${(props) =>
    props.isSupported ? 'var(--accent-color)' : 'var(--error-color)'};
  padding: 0.4rem 0.8rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 5px;

  &:before {
    content: '⚡';
    font-size: 0.8rem;
  }

  &:hover {
    background: rgba(20, 30, 65, 0.8);
    border-color: ${(props) =>
      props.isSupported
        ? 'rgba(103, 128, 255, 0.5)'
        : 'rgba(255, 87, 87, 0.5)'};
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
  }
`

const AddressDisplay = styled.div`
  background: rgba(13, 21, 44, 0.6);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  color: white;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-family: monospace;
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(20, 30, 65, 0.8);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
  }

  &:after {
    content: '📋';
    position: absolute;
    right: 10px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover:after {
    opacity: 0.7;
  }
`

const DisconnectButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 118, 117, 0.3);
  border-radius: var(--border-radius-sm);
  color: var(--error-color);
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  align-self: flex-end;

  &:hover {
    background: rgba(255, 118, 117, 0.1);
    border-color: var(--error-color);
    transform: translateY(-2px);
    box-shadow: 0 3px 8px rgba(255, 118, 117, 0.15);
  }
`

export default WalletButton
