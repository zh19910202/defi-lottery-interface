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

export const WalletContext = createContext({})

const TARGET_NETWORK_ID = getRecommendedNetworkId()

export const WalletProvider = ({ children }) => {
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [walletStatus, setWalletStatus] = useState('disconnected')
  const [hasWallet, setHasWallet] = useState(false)
  const [connectedAccount, setConnectedAccount] = useState(null)
  const [networkId, setNetworkId] = useState(null)
  const [networkName, setNetworkName] = useState(null)
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
    return address
      ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
      : ''
  }, [])

  // 初始化检查
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          })
          if (accounts.length > 0 && !userDisconnected) {
            setIsConnecting(true)
            await connectWallet(true) // 静默连接
            setIsConnected(true)
          }
        } catch (error) {
          console.error('自动连接失败:', error)
        } finally {
          setIsConnecting(false)
        }
      }
    }

    checkConnection()
  }, [])

  // 合约初始化
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

        setContracts({
          lottery: initContract(addresses.LOTTERY, LOTTERY_ABI, signerInstance),
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

  // 处理账户变化
  const handleAccountsChanged = useCallback(
    async (accounts) => {
      if (!accounts || accounts.length === 0) {
        disconnectWallet()
        return
      }

      const newAccount = accounts[0]
      if (newAccount === connectedAccount) return

      try {
        const web3Provider = new ethers.BrowserProvider(window.ethereum)
        const signerInstance = await web3Provider.getSigner()
        const chainIdHex = await window.ethereum.request({
          method: 'eth_chainId',
        })
        const currentChainId = parseInt(chainIdHex, 16)

        // 批量更新状态
        setConnectedAccount(newAccount)
        setProvider(web3Provider)
        setSigner(signerInstance)
        setNetworkId(currentChainId)
        setNetworkName(getNetworkName(currentChainId))

        await initializeContracts(signerInstance, web3Provider, currentChainId)

        //toast.success(`账户已切换至: ${formatAddress(newAccount)}`)
      } catch (error) {
        console.error('账户切换处理失败:', error)
        toast.error('账户状态更新失败')
      }
    },
    [connectedAccount, initializeContracts, formatAddress]
  )

  // 处理网络变化
  const handleChainChanged = useCallback(
    async (chainIdHex) => {
      const newChainId = parseInt(chainIdHex, 16)
      if (newChainId === networkId) return

      try {
        const web3Provider = new ethers.BrowserProvider(window.ethereum)
        const signerInstance = await web3Provider.getSigner()

        // 更新网络相关状态
        setNetworkId(newChainId)
        setNetworkName(getNetworkName(newChainId))

        if (connectedAccount) {
          await initializeContracts(signerInstance, web3Provider, newChainId)
          toast.info(`网络已切换至: ${getNetworkName(newChainId)}`)
        }
      } catch (error) {
        console.error('网络切换处理失败:', error)
        toast.error('网络状态更新失败')
      }
    },
    [connectedAccount, networkId, initializeContracts]
  )

  // 连接钱包
  const connectWallet = useCallback(
    async (silent = false) => {
      if (!window.ethereum?.request) {
        if (!silent) toast.error('请安装MetaMask插件')
        setHasWallet(false)
        return
      }

      try {
        localStorage.removeItem('userDisconnectedWallet')
        setUserDisconnected(false)
        setIsConnecting(true)
        setIsLoading(true)

        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        })
        if (accounts.length > 0) {
          const web3Provider = new ethers.BrowserProvider(window.ethereum)
          const signerInstance = await web3Provider.getSigner()
          const chainIdHex = await window.ethereum.request({
            method: 'eth_chainId',
          })
          const chainId = parseInt(chainIdHex, 16)

          // 更新所有相关状态
          setIsConnected(true)
          setWalletStatus('connected')
          setConnectedAccount(accounts[0])
          setHasWallet(true)
          setNetworkId(chainId)
          setNetworkName(getNetworkName(chainId))
          setProvider(web3Provider)
          setSigner(signerInstance)

          await initializeContracts(signerInstance, web3Provider, chainId)

          if (!isSupportedNetwork(chainId)) {
            await switchNetwork(TARGET_NETWORK_ID)
          }

          if (!silent) {
            toast.success(`连接成功: ${formatAddress(accounts[0])}`)
          }
        }
      } catch (error) {
        setIsConnected(false)
        console.error('连接失败:', error)
        if (!silent) {
          const errorMsg =
            error.code === 4001 ? '已取消连接' : error.message || '连接失败'
          toast.error(errorMsg)
        }
        setHasWallet(false)
      } finally {
        setIsLoading(false)
        setIsConnecting(false)
      }
    },
    [initializeContracts, formatAddress]
  )

  // 断开连接
  const disconnectWallet = useCallback(() => {
    localStorage.setItem('userDisconnectedWallet', 'true')
    setUserDisconnected(true)
    setIsConnected(false)
    setWalletStatus('disconnected')
    setConnectedAccount(null)
    setProvider(null)
    setSigner(null)
    setNetworkId(null)
    setNetworkName(null)
    setContracts({
      lottery: null,
      lotteryRouter: null,
      prizePool: null,
      vault: null,
      weth: null,
    })
    toast.info('钱包已断开')
  }, [])

  // 切换网络
  const switchNetwork = useCallback(
    async (targetChainId = TARGET_NETWORK_ID) => {
      if (!window.ethereum) return false

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        })
        return true
      } catch (error) {
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [SUPPORTED_NETWORKS[targetChainId]],
            })
            return true
          } catch (addError) {
            toast.error('添加网络失败')
            return false
          }
        }
        toast.error('网络切换取消')
        return false
      }
    },
    []
  )

  // 自动连接处理
  useEffect(() => {
    const checkAutoConnect = async () => {
      if (userDisconnected || !window.ethereum) return

      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        })
        if (accounts.length > 0) {
          await handleAccountsChanged(accounts)
        }
      } catch (error) {
        console.error('自动连接失败:', error)
      }
    }

    checkAutoConnect()
  }, [userDisconnected, handleAccountsChanged])

  // 事件监听设置
  useEffect(() => {
    if (!window.ethereum?.on) return

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum?.removeListener('chainChanged', handleChainChanged)
    }
  }, [handleAccountsChanged, handleChainChanged])

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

  //查询当前轮次
  const getCurrentRoundId = async () => {
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
      const errorMsg = err.reason || err.message || '获取当前轮次失败'

      return null
    }
  }

  //查询历史中奖记录
  const getLotteryHistory = async (page = 1, pageSize = 5) => {
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
        console.log('winner:', i)
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
      const errorMsg = err.reason || err.message || '获取彩票历史失败'

      return null
    }
  }

  // 查询下次开奖时间
  const getNextDrawTimestamp = async () => {
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
      const errorMsg = err.reason || err.message || '获取下次开奖时间失败'

      return null
    }
  }

  // 查询当前轮次参与人数

  const getParticipantsCount = async () => {
    if (!provider || !contracts.lottery) {
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
      const errorMsg = err.reason || err.message || '获取参与人数失败'

      return null
    }
  }

  const contextValue = useMemo(
    () => ({
      provider,
      signer,
      isLoading,
      walletStatus,
      isConnected,
      setIsConnected,
      isConnecting,
      setIsConnecting,
      hasWallet,
      connectedAccount,
      networkId,
      networkName,
      contracts,
      formatAddress,
      isNetworkSupported,
      TARGET_NETWORK_ID,
      SUPPORTED_NETWORKS,

      connectWallet,
      disconnectWallet,
      switchNetwork,
      getPrizePoolAmount,
      getCurrentRoundId,
      getParticipantsCount,
      getNextDrawTimestamp,
      getLotteryHistory,

      // 添加状态刷新方法
      refreshWalletState: async () => {
        if (window.ethereum && connectedAccount) {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts',
          })
          await handleAccountsChanged(accounts)
        }
      },
    }),
    [
      provider,
      signer,
      isLoading,
      walletStatus,
      hasWallet,
      connectedAccount,
      isConnected,
      isConnecting,
      getNextDrawTimestamp,
      getLotteryHistory,
      networkId,
      isNetworkSupported,
      getParticipantsCount,
      networkName,
      contracts,
      formatAddress,
      connectWallet,
      disconnectWallet,
      switchNetwork,
      getPrizePoolAmount,
      getCurrentRoundId,
    ]
  )

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  )
}
