import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import { ethers } from 'ethers'
import { toast } from 'react-toastify'
import {
  LOTTERY_ABI,
  LOTTERY_ROUTER_ABI,
  PRIZE_POOL_ABI,
  VAULT_ABI,
  WETH_ABI,
} from '../contracts/abis'
import {
  getNetworkName,
  isSupportedNetwork,
  getRecommendedNetworkId,
  getContractAddresses,
  SUPPORTED_NETWORKS,
} from '../contracts/index'

// 创建钱包上下文
export const WalletContext = createContext({})

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
const TARGET_NETWORK_ID = getRecommendedNetworkId()
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
  const [contract, setContract] = useState(null) // 保留单合约兼容性
  const [networkId, setNetworkId] = useState(null)
  const [networkName, setNetworkName] = useState(null)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [balance, setBalance] = useState('0')
  const [connectionError, setConnectionError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 多合约支持
  const [walletStatus, setWalletStatus] = useState('disconnected')
  const [hasWallet, setHasWallet] = useState(false)
  const [connectedAccount, setConnectedAccount] = useState(null)
  const [userDisconnected, setUserDisconnected] = useState(() => {
    return localStorage.getItem('userDisconnectedWallet') === 'true'
  })
  const [contracts, setContracts] = useState({
    lottery: null,
    lotteryRouter: null,
    prizePool: null,
    vault: null,
    weth: null,
  })
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

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
  const initializeContract = useCallback(
    async (signerOrProvider) => {
      if (!signerOrProvider) return null

      try {
        const addresses = getContractAddresses(networkId)
        if (!addresses || !addresses.LOTTERY) return null

        return new ethers.Contract(
          addresses.LOTTERY,
          LOTTERY_ABI,
          signerOrProvider
        )
      } catch (error) {
        console.error('初始化合约失败:', error)
        return null
      }
    },
    [networkId]
  )

  // 初始化多合约
  const initializeContracts = useCallback(
    async (signerInstance, providerInstance, chainId) => {
      try {
        const addresses = getContractAddresses(chainId)
        if (
          !addresses ||
          !addresses.LOTTERY ||
          !addresses.LOTTERY_ROUTER ||
          !addresses.PRIZE_POOL ||
          !addresses.VAULT ||
          !addresses.WETH
        ) {
          throw new Error(`无效的合约地址: Chain ID ${chainId}`)
        }

        const initContract = (address, abi, provider) =>
          address ? new ethers.Contract(address, abi, provider) : null

        const lotteryContract = initContract(
          addresses.LOTTERY,
          LOTTERY_ABI,
          signerInstance
        )

        // 设置单合约兼容性
        setContract(lotteryContract)

        // 设置多合约
        setContracts({
          lottery: lotteryContract,
          lotteryRouter: initContract(
            addresses.LOTTERY_ROUTER,
            LOTTERY_ROUTER_ABI,
            signerInstance
          ),
          prizePool: initContract(
            addresses.PRIZE_POOL,
            PRIZE_POOL_ABI,
            providerInstance
          ),
          vault: initContract(addresses.VAULT, VAULT_ABI, providerInstance),
          weth: initContract(addresses.WETH, WETH_ABI, signerInstance),
        })
      } catch (error) {
        console.error('合约初始化失败:', error)
        toast.error('无法初始化合约实例')
      }
    },
    []
  )

  // 初始化提供者
  const initializeProvider = useCallback(() => {
    if (checkIfWalletIsAvailable()) {
      const ethersProvider = new ethers.BrowserProvider(window.ethereum)
      setProvider(ethersProvider)
      return ethersProvider
    }
    return null
  }, [checkIfWalletIsAvailable])

  // 获取网络名称 (保留兼容性)
  const getNetworkNameLocal = useCallback((id) => {
    return NETWORKS[id] || '未知网络'
  }, [])

  // 处理账户变化
  const handleAccountsChanged = useCallback(
    async (accounts) => {
      // 如果正在主动断开连接，则不处理账户变化事件
      if (isDisconnecting) return

      if (!accounts || accounts.length === 0) {
        disconnectWallet()
        return
      }

      const newAccount = accounts[0]
      if (newAccount === account && newAccount === connectedAccount) return

      try {
        const web3Provider = new ethers.BrowserProvider(window.ethereum)
        const signerInstance = await web3Provider.getSigner()
        const chainIdHex = await window.ethereum.request({
          method: 'eth_chainId',
        })
        const currentChainId = parseInt(chainIdHex, 16)

        // 批量更新状态
        setAccount(newAccount)
        setConnectedAccount(newAccount)
        setProvider(web3Provider)
        setSigner(signerInstance)
        setNetworkId(currentChainId)
        setNetworkName(getNetworkName(currentChainId))

        // 获取余额
        const balance = await web3Provider.getBalance(newAccount)
        setBalance(ethers.formatEther(balance))

        await initializeContracts(signerInstance, web3Provider, currentChainId)

        if (account !== null && account !== newAccount) {
          toast.info(`账户已切换: ${formatAddress(newAccount)}`)
        }

        refreshBalance()
      } catch (error) {
        console.error('账户切换处理失败:', error)
        toast.error('账户状态更新失败')
      }
    },
    [
      account,
      connectedAccount,
      initializeContracts,
      formatAddress,
      isDisconnecting,
    ]
  )

  // 处理网络变化
  const handleChainChanged = useCallback(
    async (chainIdHex) => {
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

        // 重新初始化提供者和合约
        if (account) {
          try {
            const web3Provider = new ethers.BrowserProvider(window.ethereum)
            setProvider(web3Provider)
            const signerInstance = await web3Provider.getSigner()
            setSigner(signerInstance)

            await initializeContracts(signerInstance, web3Provider, newChainId)
          } catch (err) {
            console.error('网络切换后初始化失败:', err)
          }
        }
      }
    },
    [account, networkId, networkName, initializeContracts, isDisconnecting]
  )

  // 连接钱包
  const connectWallet = useCallback(
    async (silent = false) => {
      setIsLoading(true)
      setConnectionError('')
      setIsConnecting(true)

      try {
        if (!checkIfWalletIsAvailable()) {
          throw new Error('未检测到MetaMask，请安装后重试')
        }

        localStorage.removeItem('userDisconnectedWallet')
        setUserDisconnected(false)

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
        setConnectedAccount(account)

        // 获取网络ID
        const networkId = await window.ethereum.request({
          method: 'eth_chainId',
        })
        const chainId = parseInt(networkId, 16)
        setNetworkId(chainId)
        setNetworkName(getNetworkName(chainId))

        // 获取余额
        const balance = await ethersProvider.getBalance(account)
        setBalance(ethers.formatEther(balance))

        // 设置签名者
        const signer = await ethersProvider.getSigner()
        setSigner(signer)

        // 初始化合约
        await initializeContracts(signer, ethersProvider, chainId)

        // 更新状态
        setStatus(WALLET_STATUS.CONNECTED)
        setWalletStatus('connected')
        setIsConnected(true)
        setHasWallet(true)
        setConnectionError('')

        if (!silent) {
          toast.success(`连接成功: ${formatAddress(account)}`)
        }

        if (!isSupportedNetwork(chainId)) {
          await switchNetwork(TARGET_NETWORK_ID)
        }

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
        setWalletStatus('error')
        setIsConnected(false)

        if (!silent) {
          const errorMsg =
            error.code === 4001 ? '已取消连接' : error.message || '连接失败'
          toast.error(errorMsg)
        }

        return {
          success: false,
          error: error.message,
        }
      } finally {
        setIsLoading(false)
        setIsConnecting(false)
      }
    },
    [
      checkIfWalletIsAvailable,
      initializeProvider,
      initializeContracts,
      formatAddress,
    ]
  )

  // 断开钱包连接
  const disconnectWallet = useCallback(() => {
    // 设置断开连接标志，防止事件监听器重复触发
    setIsDisconnecting(true)

    // 保存用户断开连接的状态
    localStorage.setItem('userDisconnectedWallet', 'true')
    setUserDisconnected(true)

    // 清除状态
    setStatus(WALLET_STATUS.DISCONNECTED)
    setWalletStatus('disconnected')
    setAccount('')
    setConnectedAccount(null)
    setProvider(null)
    setSigner(null)
    setContract(null)
    setNetworkId(null)
    setNetworkName(null)
    setBalance('0')
    setIsConnected(false)

    // 清除合约
    setContracts({
      lottery: null,
      lotteryRouter: null,
      prizePool: null,
      vault: null,
      weth: null,
    })

    toast.info('已断开钱包连接')

    // 短暂延迟后重置断开标志
    setTimeout(() => {
      setIsDisconnecting(false)
    }, 1000)
  }, [])

  // 刷新余额
  const refreshBalance = useCallback(async () => {
    if (
      (status === WALLET_STATUS.CONNECTED || isConnected) &&
      provider &&
      account
    ) {
      try {
        const balance = await provider.getBalance(account)
        setBalance(ethers.formatEther(balance))
      } catch (error) {
        console.error('获取余额失败:', error)
      }
    }
  }, [status, isConnected, provider, account])

  // 切换网络
  const switchNetwork = useCallback(
    async (targetChainId = TARGET_NETWORK_ID) => {
      if (!checkIfWalletIsAvailable()) {
        return { success: false, error: '钱包不可用' }
      }

      try {
        // 尝试切换网络
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        })

        return { success: true }
      } catch (error) {
        console.error('切换网络失败:', error)

        // 如果网络不存在
        if (error.code === 4902) {
          try {
            // 添加网络
            const networkConfig = SUPPORTED_NETWORKS[targetChainId] || {
              chainId: `0x${targetChainId.toString(16)}`,
              chainName: NETWORKS[targetChainId] || '未知网络',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            }

            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [networkConfig],
            })

            return { success: true }
          } catch (addError) {
            console.error('添加网络失败:', addError)
            toast.error('添加网络失败')
            return {
              success: false,
              error: addError.message || '添加网络失败',
            }
          }
        }

        toast.error('网络切换取消')
        return {
          success: false,
          error: error.message || '切换网络失败',
        }
      }
    },
    [checkIfWalletIsAvailable]
  )

  // 检查网络
  const checkNetwork = useCallback(() => {
    return networkId === TARGET_NETWORK_ID
  }, [networkId])

  // 检查网络是否支持
  const isNetworkSupported = useCallback(() => {
    return isSupportedNetwork(networkId)
  }, [networkId])

  // 查询奖池余额
  const getPrizePoolAmount = useCallback(async () => {
    if (!contracts.prizePool || !isSupportedNetwork(networkId)) return null

    try {
      const amount = await contracts.prizePool.getPrizePoolAmount()
      return amount ? parseFloat(ethers.formatEther(amount)).toFixed(8) : '0'
    } catch (err) {
      console.error('获取奖池失败:', err)
      toast.error(err.reason || '获取奖池信息失败')
      return null
    }
  }, [contracts.prizePool, networkId])

  // 查询当前轮次
  const getCurrentRoundId = useCallback(async () => {
    if (!provider || !contracts.lottery) {
      return null
    }
    if (!isSupportedNetwork(networkId)) {
      return null
    }
    try {
      const currentId = await contracts.lottery.getCurrentRoundId()
      return currentId
    } catch (err) {
      console.error('获取当前轮次失败:', err)
      return null
    }
  }, [provider, contracts.lottery, networkId])

  // 查询历史中奖记录
  const getLotteryHistory = useCallback(
    async (page = 1, pageSize = 5) => {
      if (!provider || !contracts.lottery) {
        return null
      }
      if (!isSupportedNetwork(networkId)) {
        return null
      }

      try {
        // 获取当前轮次 ID
        const currentId = await contracts.lottery.getCurrentRoundId()
        const currentIdNum = currentId.toString()
        if (currentIdNum < 0) {
          return []
        }

        // 计算分页范围
        const totalRounds = currentIdNum + 1 // 轮次从 0 开始
        const startIndex = Math.max(0, (page - 1) * pageSize)
        const endIndex = Math.min(page * pageSize, totalRounds)
        if (startIndex >= totalRounds) {
          return []
        }

        // 按轮次降序查询（最新轮次优先）
        const history = []
        for (let i = endIndex - 1; i >= startIndex && i >= 0; i--) {
          const round = await contracts.lottery.lotteryRound(i)
          history.push({
            roundId: Number(i),
            prizeAmount: round.prizeAmount
              ? Number(ethers.formatEther(round.prizeAmount)).toFixed(8)
              : '0',
            winner: round.winner,
            endTime: Number(round.drawTimestamp) * 1000, // 转换为毫秒
            isClaimed: round.isClaimed,
          })
        }
        return history
      } catch (err) {
        console.error('获取彩票历史失败:', err)
        return null
      }
    },
    [provider, contracts.lottery, networkId]
  )

  // 查询下次开奖时间
  const getNextDrawTimestamp = useCallback(async () => {
    if (!provider || !contracts.lottery) {
      return null
    }
    if (!isSupportedNetwork(networkId)) {
      return null
    }

    try {
      const timestamp = await contracts.lottery.nextDrawTimestamp()
      return Number(timestamp) * 1000 // 转换为毫秒
    } catch (err) {
      console.error('获取下次开奖时间失败:', err)
      return null
    }
  }, [provider, contracts.lottery, networkId])

  // 查询当前轮次参与人数
  const getParticipantsCount = useCallback(async () => {
    if (!provider || !contracts.lottery || !contracts.vault) {
      return null
    }
    if (!isSupportedNetwork(networkId)) {
      return null
    }
    try {
      const amount = await contracts.vault.getCurrentTotalParticipantCount()
      return Number(amount)
    } catch (err) {
      console.error('获取参与人数失败:', err)
      return null
    }
  }, [provider, contracts.lottery, contracts.vault, networkId])

  // 监听钱包事件
  useEffect(() => {
    if (!window.ethereum) return

    // 添加事件监听器
    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    // 初始检查
    const checkInitialConnection = async () => {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        })

        if (accounts.length > 0 && !userDisconnected) {
          // 静默连接，不显示通知
          await connectWallet(true)
        }
      } catch (error) {
        console.error('检查初始连接状态失败:', error)
      }
    }

    checkInitialConnection()

    // 清理事件监听器
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [
    userDisconnected,
    handleAccountsChanged,
    handleChainChanged,
    connectWallet,
  ])

  // 上下文值 - 使用useMemo优化性能
  const contextValue = useMemo(
    () => ({
      // 状态
      status,
      walletStatus,
      account,
      connectedAccount,
      provider,
      signer,
      contract,
      contracts,
      networkId,
      networkName,
      balance,
      connectionError,
      isLoading,
      isConnected,
      isConnecting,
      hasWallet,

      // 常量
      TARGET_NETWORK_ID,
      TARGET_NETWORK_NAME,
      SUPPORTED_NETWORKS,

      // 工具方法
      getNetworkName,
      formatAddress,
      isNetworkSupported,
      checkNetwork,
      checkIfWalletIsAvailable,

      // 操作方法
      connect: connectWallet,
      disconnect: disconnectWallet,
      connectWallet,
      disconnectWallet,
      refreshBalance,
      switchNetwork,

      // 合约交互方法
      getPrizePoolAmount,
      getCurrentRoundId,
      getParticipantsCount,
      getNextDrawTimestamp,
      getLotteryHistory,

      // 状态快捷访问
      isConnectedStatus: status === WALLET_STATUS.CONNECTED,
      isConnectingStatus: status === WALLET_STATUS.CONNECTING,
      hasError: status === WALLET_STATUS.ERROR,
      isOnSupportedNetwork: isSupportedNetwork(networkId),

      // 状态管理方法
      setIsConnected,
      setIsConnecting,

      // 状态刷新方法
      refreshWalletState: async () => {
        if (window.ethereum && (account || connectedAccount)) {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          })
          await handleAccountsChanged(accounts)
        }
      },
    }),
    [
      status,
      walletStatus,
      account,
      connectedAccount,
      provider,
      signer,
      contract,
      contracts,
      networkId,
      networkName,
      balance,
      connectionError,
      isLoading,
      isConnected,
      isConnecting,
      hasWallet,
      formatAddress,
      checkNetwork,
      checkIfWalletIsAvailable,
      connectWallet,
      disconnectWallet,
      refreshBalance,
      switchNetwork,
      getPrizePoolAmount,
      getCurrentRoundId,
      getParticipantsCount,
      getNextDrawTimestamp,
      getLotteryHistory,
      handleAccountsChanged,
      isNetworkSupported,
    ]
  )

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  )
}

export default WalletProvider
