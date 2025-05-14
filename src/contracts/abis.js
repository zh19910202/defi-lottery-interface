/**
 * 合约ABI定义文件
 * 集中管理所有智能合约的ABI
 */

// 彩票合约ABI
export const LOTTERY_ABI = [
  'function nextDrawTimestamp() view returns (uint256)',
  'function getCurrentRoundId() external view returns (uint256)',
  'function lotteryRound(uint256 roundId) external view returns (tuple(uint256 requestedId, address winner, uint256 prizeValue, uint256 timestamp, uint256 randomNumber, bool isClaimed, uint256 drawTimestamp))'
]

// 彩票路由合约ABI
export const LOTTERY_ROUTER_ABI = [
  'function deposit(uint256 amount) external',
  'function withdraw() external',
  'function withdrawFromRound(uint256 roundId) external',
  'event Deposit(address indexed user, uint256 amount, uint256 timestamp)',
  'event Withdraw(address indexed user, uint256 amount, uint256 timestamp)'
]

// 奖池合约ABI
export const PRIZE_POOL_ABI = [
  'function getPrizePoolAmount() view returns (uint256)',
  'event PrizePoolUpdated(uint256 newAmount, uint256 timestamp)'
]

// Vault合约ABI
export const VAULT_ABI = [
  'function getCurrentTotalParticipantCount(uint256 roundId) external view returns (uint256)'
]
