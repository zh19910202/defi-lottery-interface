/**
 * 彩票合约配置
 */

// 彩票合约ABI，实际使用时需替换为真实合约ABI
export const LOTTERY_ABI = [
  'function enterLottery() payable',
  'function getBalance() view returns (uint256)',
  'function getPrizePoolAmount() view returns (uint256)',
  'function getWinnerHistory() view returns (address[])',
  'function getWinAmountHistory() view returns (uint256[])',
  'function getLastWinTime() view returns (uint256)',
  'event WinnerSelected(address winner, uint256 amount, uint256 timestamp)',
]

// 彩票合约地址，已替换为PrizePool智能合约地址
export const PRIZE_POOL_CONTRACT_ADDRESS = '0x7E5F70b1F978980D8a346522D771293c6d6C05F1'

// 支持的网络配置
export const SUPPORTED_NETWORKS = {
  1: {
    name: '以太坊主网',
    currency: 'ETH',
    supported: true,
  },
  11155111: {
    name: 'Sepolia测试网',
    currency: 'ETH',
    supported: true,
  },
  5: {
    name: 'Goerli测试网',
    currency: 'ETH',
    supported: true,
  },
  137: {
    name: 'Polygon',
    currency: 'MATIC',
    supported: false,
  },
  56: {
    name: 'BSC',
    currency: 'BNB',
    supported: false,
  },
  43114: {
    name: 'Avalanche',
    currency: 'AVAX',
    supported: false,
  },
  42161: {
    name: 'Arbitrum',
    currency: 'ETH',
    supported: false,
  },
  10: {
    name: 'Optimism',
    currency: 'ETH',
    supported: false,
  },
}

// 获取网络名称
export const getNetworkName = (chainId) => {
  if (!chainId) return '未知网络'
  return SUPPORTED_NETWORKS[chainId]?.name || `Chain ID: ${chainId}`
}

// 检查是否为受支持的网络
export const isSupportedNetwork = (chainId) => {
  return !!SUPPORTED_NETWORKS[chainId]?.supported
}

// 获取推荐的网络ID (首选 Sepolia 测试网)
export const getRecommendedNetworkId = () => 11155111