/**
 * 合约配置文件
 * 集中管理所有智能合约的ABI和地址
 */

// 网络配置
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

// 合约地址配置
export const CONTRACT_ADDRESSES = {
  // 主网地址
  1: {
    LOTTERY: '0xC8aBb2452110b62d5A63dCa247fc2607bc1Ab088',
    LOTTERY_ROUTER: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    PRIZE_POOL: '0x7E5F70b1F978980D8a346522D771293c6d6C05F1',
  },
  // Sepolia测试网地址
  11155111: {
    LOTTERY: '0x431F7a770D8274781e02AcDd858eEDE39bac0Beb',
    LOTTERY_ROUTER: '0xfd1FFe0074aed0B9891F92584cC35FdF98eb7A32',
    PRIZE_POOL: '0xb641F8b8Da2f92Da45e795FbCce04266226FA056',
    VAULT: '0x5b1DEd0A8C017c0772F608225deCA4741622816f',
    WETH: '0x2D5ee574e710219a521449679A4A7f2B43f046ad'
  },
  // Goerli测试网地址
  5: {
    LOTTERY: '0xC8aBb2452110b62d5A63dCa247fc2607bc1Ab088',
    LOTTERY_ROUTER: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    PRIZE_POOL: '0x7E5F70b1F978980D8a346522D771293c6d6C05F1',
  },
}

// 获取当前网络的合约地址
export const getContractAddresses = (chainId) => {
  return CONTRACT_ADDRESSES[chainId] || CONTRACT_ADDRESSES[11155111] // 默认返回Sepolia测试网地址
}