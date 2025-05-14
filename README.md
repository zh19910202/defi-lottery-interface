# DeFi 彩票系统

一个基于以太坊区块链的去中心化彩票应用，用户可以购买彩票，参与抽奖活动。

![DeFi彩票系统](./screenshots/app-preview.png)

## 功能特点

- 连接以太坊钱包 (MetaMask 等)
- 使用 ETH 购买彩票
- 实时显示奖池余额
- 查看历史中奖记录
- 自动网络检测和切换
- 响应式设计，适配各种设备

## 技术栈

- React 18
- Ethers.js 5
- Styled Components
- React Toastify
- Vite

## 快速开始

### 前提条件

- Node.js 16+
- 现代浏览器
- MetaMask 或其他以太坊钱包

### 安装

1. 克隆此仓库

```bash
git clone https://github.com/yourusername/defi-lottery-interface.git
cd defi-lottery-interface
```

2. 安装依赖

```bash
npm install
```

3. 启动开发服务器

```bash
npm run dev
```

4. 打开浏览器访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

生成的文件将位于 `dist` 目录中。

## 使用指南

### 连接钱包

1. 点击页面右上角的"连接钱包"按钮
2. 授权 MetaMask 连接到应用
3. 如果未在 Sepolia 测试网络上，点击网络名称切换到 Sepolia 测试网

### 购买彩票

1. 在中间面板的"投注金额"输入框中输入 ETH 数量
2. 点击"购买彩票"按钮
3. 确认 MetaMask 交易

### 查看奖池和历史

- 当前奖池金额显示在购买表单的顶部
- 右侧面板显示最新的中奖历史记录

## 合约信息

该应用连接到 Sepolia 测试网络上的智能合约：

- 合约地址: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- 网络 ID: `11155111` (Sepolia 测试网)

## 开发者指南

### 项目结构

```
/src
  /components       # React组件
  /context          # React上下文
  /hooks            # 自定义钩子
  App.jsx           # 主应用组件
  main.jsx          # 入口文件
```

### 自定义合约地址

要更改连接的合约地址，请编辑 `src/hooks/useLottery.js` 文件中的 `LOTTERY_CONTRACT_ADDRESS` 常量。

### 修改目标网络

如需更改目标网络，请编辑 `src/context/WalletContext.jsx` 文件中的 `TARGET_NETWORK_ID` 常量。

## 许可证

MIT
