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
  })

  // 查询奖池余额
  const getPrizePoolAmount = async () => {
    if (!provider || !contracts.prizePool) {
      return null
    }
    if (!isSupportedNetwork(networkId)) {
      return null
    }

    try {
      const amount = await contracts.prizePool.getPrizePoolAmount()
      // 确保amount不是undefined，并使用正确的formatEther方法
      if (!amount) {
        console.error('奖池余额为空')
        return '0'
      }
      console.log('奖池余额:', ethers.formatEther(amount))
      return parseFloat(ethers.formatEther(amount)).toFixed(8)
    } catch (err) {
      console.error('获取奖池余额失败:', err)
      const errorMsg = err.reason || err.message || '获取奖池余额失败'
      toast.error(`获取奖池余额失败: ${errorMsg}`)
      return null
    }
  }

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

  const getParticipantsCount = async (roundId) => {
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

  const connectWallet = async (silent = false) => {
    if (!window.ethereum || typeof window.ethereum.request !== 'function') {
      if (!silent) {
        toast.error('未检测到MetaMask或其他钱包! 请安装MetaMask插件')
      }
      setHasWallet(false)
      return
    }
    try {
      localStorage.removeItem('userDisconnectedWallet')
      setUserDisconnected(false)
      setIsLoading(true)
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })
      if (accounts.length > 0) {
        setWalletStatus('connected')
        setConnectedAccount(accounts[0])
        setHasWallet(true)
        const chainIdHex = await window.ethereum.request({
          method: 'eth_chainId',
        })
        const chainId = parseInt(chainIdHex, 16)
        setNetworkId(chainId)
        setNetworkName(getNetworkName(chainId))
        const web3Provider = new ethers.BrowserProvider(window.ethereum)
        setProvider(web3Provider)
        const signerInstance = await web3Provider.getSigner()
        setSigner(signerInstance)
        await initializeContracts(signerInstance, web3Provider, chainId)
        if (!isSupportedNetwork(chainId)) {
          await switchNetwork(TARGET_NETWORK_ID)
        }
        if (!silent) {
          toast.success(`钱包连接成功! 账户: ${formatAddress(accounts[0])}`)
        }
      }
    } catch (error) {
      console.error('连接钱包失败:', error)
      let errorMsg = '连接钱包失败'
      if (error.code === 4001) {
        errorMsg = '您拒绝了连接请求'
      } else if (error.code === -32002) {
        errorMsg = '连接请求已在处理中'
      } else if (error.message) {
        errorMsg = error.message
      }
      if (!silent) {
        toast.error(errorMsg)
      }
      setHasWallet(false)
    } finally {
      setIsLoading(false)
    }
  }

  const initializeContracts = async (
    signerInstance,
    providerInstance,
    chainId
  ) => {
    try {
      const addresses = getContractAddresses(chainId)
      if (
        !addresses ||
        !addresses.LOTTERY ||
        !addresses.LOTTERY_ROUTER ||
        !addresses.PRIZE_POOL
      ) {
        throw new Error(`无效的合约地址: Chain ID ${chainId}`)
      }
      const lotteryInstance = new ethers.Contract(
        addresses.LOTTERY,
        LOTTERY_ABI,
        signerInstance
      )
      const lotteryRouterInstance = new ethers.Contract(
        addresses.LOTTERY_ROUTER,
        LOTTERY_ROUTER_ABI,
        signerInstance
      )
      const prizePoolInstance = new ethers.Contract(
        addresses.PRIZE_POOL,
        PRIZE_POOL_ABI,
        providerInstance // 使用 provider 以优化读操作
      )
      // const vaultInstance = new ethers.Contract(
      //   addresses.VAULT,
      //   VAULT_ABI,
      //   providerInstance // 使用 provider 以优化读操作
      // )

      setContracts({
        lottery: lotteryInstance,
        lotteryRouter: lotteryRouterInstance,
        prizePool: prizePoolInstance,
        // vault: vaultInstance,
      })
    } catch (error) {
      console.error('初始化合约实例失败:', error)
      toast.error('无法初始化合约实例')
    }
  }

  const disconnectWallet = () => {
    localStorage.setItem('userDisconnectedWallet', 'true')
    setUserDisconnected(true)
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
    })
    toast.info('已断开钱包连接')
  }

  const switchNetwork = async (targetChainId = TARGET_NETWORK_ID) => {
    if (!window.ethereum) return false
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      })
      return true
    } catch (error) {
      console.error('切换网络失败:', error)
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${targetChainId.toString(16)}`,
                chainName: getNetworkName(targetChainId),
                rpcUrls: ['https://rpc.sepolia.org'],
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              },
            ],
          })
          return true
        } catch (addError) {
          toast.error('添加网络失败')
          return false
        }
      }
      toast.error('切换网络失败')
      return false
    }
  }

  const formatAddress = (address) => {
    return address
      ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
      : ''
  }

  const checkCurrentChain = async () => {
    if (window.ethereum) {
      try {
        const chainIdHex = await window.ethereum.request({
          method: 'eth_chainId',
        })
        return parseInt(chainIdHex, 16)
      } catch (error) {
        console.error('获取链ID失败:', error)
        return null
      }
    }
    return null
  }

  const isNetworkSupported = useCallback(() => {
    return isSupportedNetwork(networkId)
  }, [networkId])

  useEffect(() => {
    if (!window.ethereum) return
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        if (walletStatus !== 'disconnected') {
          disconnectWallet()
        }
      } else if (
        accounts[0] !== connectedAccount &&
        connectedAccount !== null
      ) {
        setConnectedAccount(accounts[0])
        toast.info(`账户已切换: ${formatAddress(accounts[0])}`)
      } else if (accounts[0] !== connectedAccount) {
        setConnectedAccount(accounts[0])
      }
    }
    const handleChainChanged = async (chainIdHex) => {
      const newChainId = parseInt(chainIdHex, 16)
      const newNetworkName = getNetworkName(newChainId)
      if (newNetworkName !== networkName) {
        setNetworkId(newChainId)
        setNetworkName(newNetworkName)
        if (networkName !== null) {
          toast.info(`网络已切换: ${newNetworkName}`)
        }
        if (connectedAccount) {
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
    }
    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)
    const checkInitialConnection = async () => {
      if (userDisconnected) return
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        })
        if (accounts.length > 0 && walletStatus === 'disconnected') {
          connectWallet(true)
        }
      } catch (error) {
        console.error('检查初始连接状态失败:', error)
        toast.error('无法检查钱包连接状态')
      }
    }
    checkInitialConnection()
    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [userDisconnected])

  const contextValue = useMemo(
    () => ({
      provider,
      signer,
      isLoading,
      walletStatus,
      hasWallet,
      connectedAccount,
      networkId,
      networkName,
      contracts,
      connectWallet,
      disconnectWallet,
      switchNetwork,
      formatAddress,
      checkCurrentChain,
      isNetworkSupported,
      TARGET_NETWORK_ID,
      SUPPORTED_NETWORKS,
      getPrizePoolAmount, // 新增查询方法
      getCurrentRoundId,
      getLotteryHistory,
      getNextDrawTimestamp,
    }),
    [
      provider,
      signer,
      isLoading,
      walletStatus,
      hasWallet,
      connectedAccount,
      networkId,
      networkName,
      contracts,
    ]
  )

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  )
}
