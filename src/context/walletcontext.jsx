import React, { createContext, useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { toast } from 'react-toastify'
import {
  LOTTERY_ABI,
  LOTTERY_CONTRACT_ADDRESS,
  getNetworkName,
  isSupportedNetwork,
  getRecommendedNetworkId,
} from '../utils/contract'

// 创建钱包上下文
export const WalletContext = createContext(null)

// 网络配置
const NETWORKS = {
  1: 'Ethereum Mainnet',
  5: 'Goerli Testnet',
  11155111: 'Sepolia Testnet',
  137: 'Polygon Mainnet',
  80001: 'Mumbai Testnet',
  42161: 'Arbitrum One',
  421613: 'Arbitrum Goerli',
}

// 目标网络ID和名称
const TARGET_NETWORK_ID = 11155111
const TARGET_NETWORK_NAME = NETWORKS[TARGET_NETWORK_ID]

// 钱包状态常量
export const WALLET_STATUS = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
}

export const WalletProvider = ({ children }) => {
  // 状态管理
  const [status, setStatus] = useState(WALLET_STATUS.DISCONNECTED)
  const [account, setAccount] = useState('')
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [contract, setContract] = useState(null)
  const [networkId, setNetworkId] = useState(null)
  const [networkName, setNetworkName] = useState(null)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [balance, setBalance] = useState('0')
  const [connectionError, setConnectionError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 格式化地址显示
  const formatAddress = useCallback((address) => {
    if (!address) return ''
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`
  }, [])

  // 检查是否有钱包
  const checkIfWalletIsAvailable = useCallback(() => {
    return typeof window !== 'undefined' && Boolean(window.ethereum)
  }, [])

  // 初始化合约
  const initializeContract = useCallback(async (signerOrProvider) => {
    if (!signerOrProvider) return null

    try {
      return new ethers.Contract(
        LOTTERY_CONTRACT_ADDRESS,
        LOTTERY_ABI,
        signerOrProvider
      )
    } catch (error) {
      console.error('初始化合约失败:', error)
      return null
    }
  }, [])

  // 初始化提供者
  const initializeProvider = useCallback(() => {
    if (checkIfWalletIsAvailable()) {
      const ethersProvider = new ethers.BrowserProvider(window.ethereum)
      setProvider(ethersProvider)
      return ethersProvider
    }
    return null
  }, [checkIfWalletIsAvailable])

  // 获取网络名称
  const getNetworkName = useCallback((id) => {
    return NETWORKS[id] || '未知网络'
  }, [])

  // 连接钱包
  const connectWallet = useCallback(async () => {
    setIsLoading(true)
    setConnectionError('')

    try {
      if (!checkIfWalletIsAvailable()) {
        throw new Error('未检测到MetaMask，请安装后重试')
      }

      const ethersProvider = initializeProvider()

      // 请求连接
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (accounts.length === 0) {
        throw new Error('无法获取账户，请在MetaMask中授权')
      }

      const account = accounts[0]
      setAccount(account)

      // 获取网络ID
      const networkId = await window.ethereum.request({
        method: 'eth_chainId',
      })
      const chainId = parseInt(networkId, 16)
      setNetworkId(chainId)

      // 获取余额
      const balance = await ethersProvider.getBalance(account)
      setBalance(ethers.formatEther(balance))

      // 设置签名者
      const signer = ethersProvider.getSigner()
      setSigner(signer)

      // 初始化合约
      const contractInstance = await initializeContract(signer)
      setContract(contractInstance)

      setStatus(WALLET_STATUS.CONNECTED)
      setConnectionError('')

      return {
        success: true,
        account,
        chainId,
        signer,
      }
    } catch (error) {
      console.error('连接钱包出错:', error)
      setConnectionError(error.message || '连接钱包失败，请重试')
      setStatus(WALLET_STATUS.ERROR)
      return {
        success: false,
        error: error.message,
      }
    } finally {
      setIsLoading(false)
    }
  }, [checkIfWalletIsAvailable, initializeProvider, initializeContract])

  // 断开钱包连接
  const disconnectWallet = useCallback(() => {
    // 设置断开连接标志，防止事件监听器重复触发
    setIsDisconnecting(true)

    // 清除状态
    setStatus(WALLET_STATUS.DISCONNECTED)
    setAccount('')
    setProvider(null)
    setSigner(null)
    setContract(null)
    setNetworkId(null)
    setNetworkName(null)
    setBalance('0')

    toast.info('已断开钱包连接')

    // 短暂延迟后重置断开标志
    setTimeout(() => {
      setIsDisconnecting(false)
    }, 1000)
  }, [])

  // 刷新余额
  const refreshBalance = useCallback(async () => {
    if (status === WALLET_STATUS.CONNECTED && provider && account) {
      try {
        const balance = await provider.getBalance(account)
        setBalance(ethers.formatEther(balance))
      } catch (error) {
        console.error('获取余额失败:', error)
      }
    }
  }, [status, provider, account])

  // 切换网络
  const switchNetwork = useCallback(async () => {
    if (!checkIfWalletIsAvailable()) {
      return { success: false, error: '钱包不可用' }
    }

    try {
      // 尝试切换网络
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${TARGET_NETWORK_ID.toString(16)}` }],
      })

      return { success: true }
    } catch (error) {
      console.error('切换网络失败:', error)

      // 如果网络不存在
      if (error.code === 4902) {
        try {
          // 添加网络
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${TARGET_NETWORK_ID.toString(16)}`,
                chainName: TARGET_NETWORK_NAME,
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          })

          return { success: true }
        } catch (addError) {
          console.error('添加网络失败:', addError)
          return {
            success: false,
            error: addError.message || '添加网络失败',
          }
        }
      }

      return {
        success: false,
        error: error.message || '切换网络失败',
      }
    }
  }, [checkIfWalletIsAvailable])

  // 检查网络
  const checkNetwork = useCallback(() => {
    return networkId === TARGET_NETWORK_ID
  }, [networkId])

  // 监听钱包事件
  useEffect(() => {
    if (!window.ethereum) return

    // 账户变化监听
    const handleAccountsChanged = (accounts) => {
      // 如果正在主动断开连接，则不处理账户变化事件
      if (isDisconnecting) return

      if (accounts.length === 0) {
        // 用户断开了钱包，但不显示重复通知
        if (status !== WALLET_STATUS.DISCONNECTED) {
          disconnectWallet()
        }
      } else if (accounts[0] !== account && account !== null) {
        // 仅在账户实际变化且不是首次连接时通知
        setAccount(accounts[0])
        toast.info(`账户已切换: ${formatAddress(accounts[0])}`)
        refreshBalance()
      } else if (accounts[0] !== account) {
        // 首次连接或恢复连接，只更新状态不显示通知
        setAccount(accounts[0])
        refreshBalance()
      }
    }

    // 链变化监听
    const handleChainChanged = async (chainIdHex) => {
      // 如果正在主动断开连接，则不处理链变化事件
      if (isDisconnecting) return

      const newChainId = parseInt(chainIdHex, 16)
      const newNetworkName = getNetworkName(newChainId)

      // 只在网络确实发生变化时更新和通知
      if (newChainId !== networkId) {
        setNetworkId(newChainId)
        setNetworkName(newNetworkName)

        if (networkName !== null) {
          // 只有在已知上一个网络的情况下才通知切换
          toast.info(`网络已切换: ${newNetworkName}`)
        }

        // 检查是否为支持的网络
        if (!isSupportedNetwork(newChainId)) {
          toast.warning(`${newNetworkName}不受支持，某些功能可能无法使用`)
        }

        // 重新初始化提供者
        if (account) {
          try {
            const ethersProvider = new ethers.BrowserProvider(window.ethereum)
            setProvider(ethersProvider)
            const signerInstance = await ethersProvider.getSigner()
            setSigner(signerInstance)

            const contractInstance = await initializeContract(signerInstance)
            setContract(contractInstance)
          } catch (err) {
            console.error('网络切换后初始化失败:', err)
          }
        }
      }
    }

    // 检查是否已连接
    const checkInitialConnection = async () => {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        })

        if (accounts.length > 0 && status === WALLET_STATUS.DISCONNECTED) {
          // 静默连接，不显示通知
          await connectWallet()
        }
      } catch (error) {
        console.error('检查初始连接状态失败:', error)
      }
    }

    // 添加事件监听器
    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    // 初始检查
    checkInitialConnection()

    // 清理事件监听器
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [
    account,
    networkId,
    networkName,
    status,
    isDisconnecting,
    disconnectWallet,
    formatAddress,
    connectWallet,
    initializeContract,
    refreshBalance,
  ])

  // 尝试自动连接
  useEffect(() => {
    const autoConnect = async () => {
      if (checkIfWalletIsAvailable() && window.ethereum.selectedAddress) {
        await connectWallet()
      }
    }

    autoConnect()
  }, [checkIfWalletIsAvailable, connectWallet])

  // 上下文值
  const value = {
    status,
    account,
    provider,
    signer,
    contract,
    networkId,
    networkName,
    balance,
    connectionError,
    isLoading,
    TARGET_NETWORK_ID,
    TARGET_NETWORK_NAME,
    getNetworkName,
    formatAddress,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    switchNetwork,
    checkNetwork,
    checkIfWalletIsAvailable,
    isConnected: status === WALLET_STATUS.CONNECTED,
    isConnecting: status === WALLET_STATUS.CONNECTING,
    hasError: status === WALLET_STATUS.ERROR,
    isOnSupportedNetwork: isSupportedNetwork(networkId),
  }

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  )
}

export default WalletProvider
