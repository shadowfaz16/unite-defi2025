# 🎬 Demo Guide - 1inch Advanced Trading Hub

## 🎯 Demo Overview (5 minutes)

This guide provides a structured walkthrough for demonstrating the 1inch Advanced Trading Hub during the hackathon presentation.

## 📋 Pre-Demo Checklist

### Technical Setup
- [ ] Development server running (`bun run dev`)
- [ ] Browser with MetaMask/wallet extension installed
- [ ] Test wallet with some ETH for gas (can be minimal)
- [ ] Screen recording software ready (optional)
- [ ] Demo environment variables configured

### Demo Wallet Setup
```bash
# Use one of these test private keys (DO NOT USE IN PRODUCTION)
Test Wallet 1: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Test Wallet 2: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

## 🎬 Demo Script

### Opening (30 seconds)
```
"Welcome to the 1inch Advanced Trading Hub - a comprehensive platform 
that addresses both hackathon tracks by expanding the Limit Order Protocol 
with advanced strategies while demonstrating extensive 1inch API integration."
```

**Actions:**
1. Open `http://localhost:3000`
2. Highlight the modern, professional interface
3. Show the "Connect Wallet" button prominently displayed

### Track 2 Demo: 1inch API Integration (1 minute)
```
"Let me first demonstrate our comprehensive 1inch API integration, 
covering Track 2 requirements."
```

**Actions:**
1. **Connect Wallet**
   - Click "Connect Wallet"
   - Choose MetaMask/Browser Wallet
   - Show successful connection with address and balance

2. **Portfolio Overview**
   - Navigate to "Portfolio" tab
   - Show multi-chain portfolio tracking
   - Highlight real-time balance updates from Balance API
   - Point out cross-chain aggregation (Ethereum, Polygon, BSC, Avalanche)

3. **Live Price Feeds**
   - Show the price chart with real-time WETH/USDC data
   - Highlight Spot Price API integration
   - Show 24h volume, market cap from Token API

### Track 1 Demo: Advanced Strategies (3 minutes)

#### TWAP Strategy (45 seconds)
```
"Now let's create our first advanced strategy - TWAP orders that split 
large trades over time to reduce market impact."
```

**Actions:**
1. Navigate to "Advanced Strategies" tab
2. Click on "TWAP Orders" card
3. **Fill out TWAP form:**
   - From Token: USDT (pre-filled)
   - To Token: 1INCH (pre-filled)
   - Total Amount: 1000000000 (1000 USDT)
   - Number of Orders: 10
   - Interval: 30 minutes
   - Slippage: 1%
4. Click "Create TWAP Strategy"
5. Show strategy appearing in "Active Strategies" section
6. **Key Points to Mention:**
   - "Orders are placed in our custom orderbook, not the official 1inch API"
   - "Each order executes automatically based on the schedule"
   - "This achieves better average pricing for large orders"

#### DCA with Smart Conditions (45 seconds)
```
"Next, let's create a Dollar Cost Averaging strategy with smart entry conditions."
```

**Actions:**
1. Click "← Back" then select "DCA Strategy"
2. **Configure DCA:**
   - From Token: USDC
   - To Token: WETH
   - Amount per Order: 100000000 (100 USDC)
   - Interval: 24 hours
   - Total Orders: 30
   - Enable Smart Conditions: ✓
   - Max Price Threshold: 2500
   - Min Price Drop: 5%
3. Click "Create DCA Strategy"
4. **Key Points:**
   - "Smart conditions ensure we only buy during favorable market conditions"
   - "This is 'buy the dip' automation built on limit orders"

#### Synthetic Options (45 seconds)
```
"Now let's explore synthetic options using conditional limit orders."
```

**Actions:**
1. Select "Synthetic Options"
2. **Configure Option:**
   - Option Type: Call Option
   - Underlying: WETH
   - Settlement: USDC
   - Strike Price: 2500
   - Premium: 50
   - Option Size: 1000000000000000000 (1 WETH)
   - Expiration: 30 days
3. Show the Greeks calculation preview
4. Click "Create Options Strategy"
5. **Key Points:**
   - "Synthetic options provide leverage without liquidation risk"
   - "Greeks are calculated in real-time for risk management"
   - "Automatic exercise when option goes in-the-money"

#### Concentrated Liquidity (45 seconds)
```
"Finally, let's set up concentrated liquidity provision similar to Uniswap V3."
```

**Actions:**
1. Select "Concentrated Liquidity"
2. **Configure Liquidity:**
   - Token A: WETH
   - Token B: USDC
   - Center Price: 2500
   - Range Width: 10%
   - Total Liquidity: 10000000000000000000 (10 WETH)
   - Grid Levels: 5
   - Auto-Rebalance: ✓
   - Rebalance Threshold: 15%
3. Show price range calculation (2250-2750)
4. Click "Create Liquidity Strategy"
5. **Key Points:**
   - "Grid of limit orders provides liquidity around current price"
   - "Auto-rebalancing keeps liquidity in the optimal range"
   - "Earns fees from trading activity"

### Order Management Demo (30 seconds)
```
"Let's examine the order management system that tracks all our strategies."
```

**Actions:**
1. Navigate to "Order Management" tab
2. Show the custom orderbook with all created orders
3. Point out order types, status, and timestamps
4. **Key Points:**
   - "All orders stored in our custom orderbook implementation"
   - "Real-time status tracking and execution monitoring"
   - "Complies with hackathon requirement: not using official 1inch Limit Order API"

### Analytics Dashboard (30 seconds)
```
"Our analytics dashboard provides comprehensive performance tracking."
```

**Actions:**
1. Navigate to "Analytics" tab
2. Show portfolio performance metrics
3. Highlight P&L calculations
4. Point out risk management features
5. **Key Points:**
   - "Real-time portfolio analytics across all strategies"
   - "Risk metrics help optimize strategy performance"
   - "Integration with Portfolio API for historical data"

## 🏆 Closing Statement (30 seconds)
```
"This demonstrates our comprehensive solution addressing both hackathon tracks:

Track 1: Advanced limit order strategies with custom orderbook implementation
- TWAP, DCA, Options, and Concentrated Liquidity
- All using 1inch Limit Order Protocol as the foundation

Track 2: Extensive 1inch API integration
- Fusion, Balance, Portfolio, Price, Token, and Gateway APIs
- Real-time multi-chain portfolio management

The platform is production-ready with professional UI, comprehensive testing,
and full compliance with hackathon requirements."
```

## 🎯 Key Messages to Emphasize

### Innovation Points
1. **Custom Orderbook**: "We've built our own orderbook to comply with hackathon rules while extending 1inch capabilities"
2. **Advanced Strategies**: "These strategies would typically require multiple manual transactions - we've automated them"
3. **Multi-API Integration**: "We use more 1inch APIs than any other hackathon project"
4. **Production Ready**: "This isn't just a proof of concept - it's a fully functional trading platform"

### Technical Highlights
1. **MEV Protection**: "All swaps use Fusion mode for sandwich attack protection"
2. **Cross-Chain**: "Portfolio tracking across 4+ major networks"
3. **Real-Time**: "Live price feeds and instant order updates"
4. **Risk Management**: "Built-in slippage protection and expiration handling"

## 🛠️ Troubleshooting

### Common Issues
1. **Wallet Connection Issues**
   - Ensure MetaMask is unlocked
   - Try refreshing the page
   - Switch to a supported network

2. **API Rate Limits**
   - Demo mode uses mock data when APIs are limited
   - Refresh page if data doesn't load

3. **Transaction Failures**
   - Ensure sufficient ETH for gas
   - Use lower amounts for demo purposes

### Backup Plans
1. **Screen Recording**: Have a pre-recorded demo as backup
2. **Static Screenshots**: Key screenshots of each feature
3. **Demo Mode**: Enable NEXT_PUBLIC_DEMO_MODE=true for offline demo

## 📊 Success Metrics

### Judging Criteria Coverage
- **Innovation**: ✅ Novel strategy automation
- **Technical Excellence**: ✅ Professional implementation
- **1inch Integration**: ✅ Comprehensive API usage
- **User Experience**: ✅ Intuitive interface
- **Practical Value**: ✅ Real-world applicable

### Demo Effectiveness Checklist
- [ ] All features demonstrated within time limit
- [ ] Clear explanation of both tracks addressed
- [ ] Technical innovation highlighted
- [ ] User benefits communicated
- [ ] Questions prepared for Q&A

---

**Good luck with your demo! 🚀**