import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, sepolia } from 'wagmi/chains'
import { http, createConfig } from 'wagmi'
import { QueryClient } from '@tanstack/react-query'
import { injected, walletConnect } from 'wagmi/connectors'

// 配置支持的链
const chains = [mainnet, sepolia]

// WalletConnect projectId，从 https://cloud.walletconnect.com 获取
const projectId = 'd20062f0065b7c85019c0c995a61f910'

// 创建QueryClient - 设置staleTime以减少不必要的重新获取
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟
      retry: 2,
    },
  },
})

// 判断是否为开发环境
const isDevelopment = process.env.NODE_ENV === 'development'

// 多个RPC节点选项，部分节点可能支持CORS
const RPC_ENDPOINTS = {
  mainnet: {
    primary: isDevelopment ? '/ethereum-api' : 'https://ethereum.publicnode.com',
    // 备用节点，这些节点可能已配置CORS
    backups: [
      'https://eth.llamarpc.com',
      'https://rpc.ankr.com/eth',
      'https://rpc.builder0x69.io'
    ]
  },
  sepolia: {
    primary: isDevelopment ? '/sepolia-api' : 'https://sepolia.publicnode.com',
    // 备用节点，这些节点可能已配置CORS
    backups: [
      'https://rpc.sepolia.org',
      'https://rpc.ankr.com/eth_sepolia',
      'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161' // 公共Infura密钥
    ]
  }
}

// 创建连接器配置
const connectors = [
  injected(),
  walletConnect({ projectId }),
]

// 使用 getDefaultConfig 创建配置
const wagmiConfig = getDefaultConfig({
  appName: 'DeFi彩票应用',
  projectId: projectId,
  chains: chains,
  transports: {
    [mainnet.id]: http(RPC_ENDPOINTS.mainnet.primary),
    [sepolia.id]: http(RPC_ENDPOINTS.sepolia.primary),
  },
  connectors,
  // 启用自动连接，保持钱包连接状态
  ssr: false,
  // 同步多个窗口的状态
  syncConnectedWallets: true,
})

// 导出额外的RPC节点，以便在主节点失败时使用
export { wagmiConfig, chains, queryClient, RPC_ENDPOINTS }