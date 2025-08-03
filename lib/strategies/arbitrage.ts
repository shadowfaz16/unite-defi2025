import { LimitOrder } from "@1inch/limit-order-sdk";
import { ethers } from "ethers";
import { BaseStrategy } from './base-strategy';
import { OneInchAPI } from '../api/oneinch';
import type { Token, TradingStrategy, LimitOrder as CustomLimitOrder } from '../types';

export interface ArbitrageConfig {
  baseToken: Token; // Token to arbitrage (e.g., WETH)
  quoteToken: Token; // Quote token (e.g., USDT)
  maker: string;
  minProfitPercent: number; // Minimum profit percentage to execute (e.g., 0.5%)
  maxSlippage: number; // Maximum acceptable slippage
  maxPositionSize: string; // Maximum amount to trade per arbitrage
  autoExecute: boolean; // Automatically execute when opportunities found
  markets: ArbitrageMarket[]; // Different markets to monitor
}

export interface ArbitrageMarket {
  id: string;
  name: string;
  type: 'DEX' | 'CEX' | 'LIMIT_ORDER';
  endpoint?: string;
  fee: number; // Trading fee percentage
  minSize: string; // Minimum order size
  enabled: boolean;
}

export interface ArbitrageOpportunity {
  id: string;
  buyMarket: ArbitrageMarket;
  sellMarket: ArbitrageMarket;
  buyPrice: number;
  sellPrice: number;
  profitPercent: number;
  profitAbsolute: number;
  size: string;
  timestamp: number;
  status: 'detected' | 'executing' | 'executed' | 'failed' | 'expired';
  orders?: {
    buyOrder?: CustomLimitOrder;
    sellOrder?: CustomLimitOrder;
  };
}

export interface ArbitrageMetrics {
  totalOpportunities: number;
  executedTrades: number;
  totalProfit: number;
  totalProfitPercent: number;
  successRate: number;
  avgProfitPerTrade: number;
  largestProfit: number;
  currentOpportunities: ArbitrageOpportunity[];
  marketEfficiency: number; // How often profitable opportunities appear
}

export class ArbitrageStrategy extends BaseStrategy {
  private monitoringInterval?: NodeJS.Timeout;
  private readonly SCAN_INTERVAL_MS = 10000; // Scan every 10 seconds

  constructor(signer: ethers.Wallet, networkId: number = 1) {
    super(signer, networkId);
  }

  /**
   * Creates an Arbitrage strategy that monitors price differences across markets
   */
  async createArbitrageStrategy(config: ArbitrageConfig): Promise<TradingStrategy> {
    const {
      baseToken,
      quoteToken,
      maker,
      minProfitPercent,
      maxSlippage,
      maxPositionSize,
      autoExecute,
      markets
    } = config;

    const strategy: TradingStrategy = {
      id: `arbitrage_${Date.now()}`,
      type: 'ARBITRAGE',
      name: `Arbitrage: ${baseToken.symbol}/${quoteToken.symbol}`,
      description: `Multi-market arbitrage with min ${minProfitPercent}% profit. Auto-execute: ${autoExecute ? 'ON' : 'OFF'}`,
      isActive: true,
      parameters: {
        ...config,
        opportunities: [],
        executedTrades: 0,
        totalProfit: 0,
        failedTrades: 0,
        lastScanTime: Date.now(),
        scanCount: 0,
        avgScanTime: 0
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Start monitoring if auto-execute is enabled
    if (autoExecute) {
      await this.startMonitoring(strategy);
    }

    return strategy;
  }

  /**
   * Starts monitoring for arbitrage opportunities
   */
  async startMonitoring(strategy: TradingStrategy): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    console.log(`🔍 Starting arbitrage monitoring for ${strategy.name}`);
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.scanForOpportunities(strategy);
      } catch (error) {
        console.error('Error during arbitrage scan:', error);
      }
    }, this.SCAN_INTERVAL_MS);

    // Initial scan
    await this.scanForOpportunities(strategy);
  }

  /**
   * Stops monitoring for arbitrage opportunities
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
      console.log('🛑 Stopped arbitrage monitoring');
    }
  }

  /**
   * Scans for arbitrage opportunities across configured markets
   */
  async scanForOpportunities(strategy: TradingStrategy): Promise<ArbitrageOpportunity[]> {
    const scanStartTime = Date.now();
    const params = strategy.parameters;
    const { baseToken, quoteToken, markets, minProfitPercent } = params;

    try {
      // Get prices from all markets
      const marketPrices = await this.getMarketPrices(baseToken, quoteToken, markets);
      
      // Find arbitrage opportunities
      const opportunities: ArbitrageOpportunity[] = [];
      
      for (let i = 0; i < marketPrices.length; i++) {
        for (let j = i + 1; j < marketPrices.length; j++) {
          const market1 = marketPrices[i];
          const market2 = marketPrices[j];
          
          // Check both directions
          const opp1 = this.calculateArbitrageOpportunity(market1, market2, params);
          const opp2 = this.calculateArbitrageOpportunity(market2, market1, params);
          
          if (opp1 && opp1.profitPercent >= minProfitPercent) {
            opportunities.push(opp1);
          }
          if (opp2 && opp2.profitPercent >= minProfitPercent) {
            opportunities.push(opp2);
          }
        }
      }

      // Sort by profit percentage
      opportunities.sort((a, b) => b.profitPercent - a.profitPercent);

      // Update strategy data
      params.opportunities = opportunities;
      params.lastScanTime = Date.now();
      params.scanCount++;
      
      const scanTime = Date.now() - scanStartTime;
      params.avgScanTime = ((params.avgScanTime * (params.scanCount - 1)) + scanTime) / params.scanCount;

      if (opportunities.length > 0) {
        console.log(`🎯 Found ${opportunities.length} arbitrage opportunities`);
        console.log(`💰 Best opportunity: ${opportunities[0].profitPercent.toFixed(3)}% profit`);
        
        // Auto-execute best opportunity if enabled
        if (params.autoExecute && opportunities.length > 0) {
          await this.executeArbitrageOpportunity(strategy, opportunities[0]);
        }
      }

      strategy.updatedAt = Date.now();
      return opportunities;
    } catch (error) {
      console.error('Error scanning for arbitrage opportunities:', error);
      return [];
    }
  }

  /**
   * Gets prices from all configured markets
   */
  private async getMarketPrices(
    baseToken: Token,
    quoteToken: Token,
    markets: ArbitrageMarket[]
  ): Promise<Array<{ market: ArbitrageMarket; buyPrice: number; sellPrice: number; liquidity: number }>> {
    const pricePromises = markets
      .filter(m => m.enabled)
      .map(async (market) => {
        try {
          const price = await this.getMarketPrice(baseToken, quoteToken, market);
          return {
            market,
            buyPrice: price * (1 + market.fee / 100), // Add fee for buying
            sellPrice: price * (1 - market.fee / 100), // Subtract fee for selling
            liquidity: await this.estimateMarketLiquidity(baseToken, quoteToken, market)
          };
        } catch (error) {
          console.error(`Error getting price from ${market.name}:`, error);
          return null;
        }
      });

    const results = await Promise.all(pricePromises);
    return results.filter(Boolean) as Array<{ market: ArbitrageMarket; buyPrice: number; sellPrice: number; liquidity: number }>;
  }

  /**
   * Gets price from a specific market
   */
  private async getMarketPrice(
    baseToken: Token,
    quoteToken: Token,
    market: ArbitrageMarket
  ): Promise<number> {
    switch (market.type) {
      case 'LIMIT_ORDER':
        // Use 1inch Orderbook to get best price
        const orderbook = await OneInchAPI.getOrderBook(this.chainId, baseToken.address, quoteToken.address, 5);
        if (orderbook.success && orderbook.data.buy.length > 0) {
          const bestBuy = orderbook.data.buy[0];
          return parseFloat(bestBuy.data.takingAmount) / parseFloat(bestBuy.data.makingAmount);
        }
        break;
        
      case 'DEX':
        // Use 1inch Swap API to get DEX price
        const quote = await OneInchAPI.getSwapQuote(
          this.chainId,
          baseToken.address,
          quoteToken.address,
          (BigInt(10) ** BigInt(baseToken.decimals)).toString(),
          this.signer.address
        );
        if (quote.success) {
          return parseFloat(quote.data.toAmount) / parseFloat(quote.data.fromAmount);
        }
        break;
        
      default:
        // Fallback to current price method
        return await this.getCurrentPrice(baseToken, quoteToken);
    }

    // Fallback to base class price
    return await this.getCurrentPrice(baseToken, quoteToken);
  }

  /**
   * Estimates liquidity available in a market
   */
  private async estimateMarketLiquidity(
    baseToken: Token,
    quoteToken: Token,
    market: ArbitrageMarket
  ): Promise<number> {
    // Simplified liquidity estimation
    // In production, this would check order book depth, DEX reserves, etc.
    switch (market.type) {
      case 'LIMIT_ORDER':
        return 100000; // Mock liquidity for limit orders
      case 'DEX':
        return 500000; // Mock liquidity for DEX
      default:
        return 50000;
    }
  }

  /**
   * Calculates arbitrage opportunity between two markets
   */
  private calculateArbitrageOpportunity(
    buyMarket: { market: ArbitrageMarket; buyPrice: number; sellPrice: number; liquidity: number },
    sellMarket: { market: ArbitrageMarket; buyPrice: number; sellPrice: number; liquidity: number },
    params: any
  ): ArbitrageOpportunity | null {
    const buyPrice = buyMarket.buyPrice;
    const sellPrice = sellMarket.sellPrice;
    
    // No opportunity if sell price is not higher than buy price
    if (sellPrice <= buyPrice) return null;
    
    const profitAbsolute = sellPrice - buyPrice;
    const profitPercent = (profitAbsolute / buyPrice) * 100;
    
    // Check if profit meets minimum threshold
    if (profitPercent < params.minProfitPercent) return null;
    
    // Calculate optimal size based on available liquidity
    const maxSizeFromLiquidity = Math.min(buyMarket.liquidity, sellMarket.liquidity);
    const maxSizeFromConfig = parseFloat(params.maxPositionSize);
    const optimalSize = Math.min(maxSizeFromLiquidity, maxSizeFromConfig);
    
    return {
      id: `arb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      buyMarket: buyMarket.market,
      sellMarket: sellMarket.market,
      buyPrice,
      sellPrice,
      profitPercent,
      profitAbsolute: profitAbsolute * optimalSize,
      size: optimalSize.toString(),
      timestamp: Date.now(),
      status: 'detected'
    };
  }

  /**
   * Executes an arbitrage opportunity by creating limit orders
   */
  async executeArbitrageOpportunity(
    strategy: TradingStrategy,
    opportunity: ArbitrageOpportunity
  ): Promise<boolean> {
    const params = strategy.parameters;
    
    try {
      opportunity.status = 'executing';
      console.log(`⚡ Executing arbitrage: Buy at ${opportunity.buyPrice}, Sell at ${opportunity.sellPrice}`);
      
      const amount = BigInt(opportunity.size);
      const { baseToken, quoteToken, maker } = params;
      
      // Create buy order on the cheaper market
      const buyOrderData = await this.createLimitOrder({
        makerAsset: quoteToken,
        takerAsset: baseToken,
        makingAmount: BigInt(Math.floor(opportunity.buyPrice * Number(amount))),
        takingAmount: amount,
        maker,
        expiration: BigInt(Math.floor(Date.now() / 1000)) + BigInt(300), // 5 minutes for arbitrage
      });
      
      // Create sell order on the more expensive market
      const sellOrderData = await this.createLimitOrder({
        makerAsset: baseToken,
        takerAsset: quoteToken,
        makingAmount: amount,
        takingAmount: BigInt(Math.floor(opportunity.sellPrice * Number(amount))),
        maker,
        expiration: BigInt(Math.floor(Date.now() / 1000)) + BigInt(300), // 5 minutes for arbitrage
      });
      
      // Submit both orders
      await Promise.all([
        this.submitToCustomOrderbook(buyOrderData.order, buyOrderData.signature, buyOrderData.customOrder, 'ARBITRAGE_BUY'),
        this.submitToCustomOrderbook(sellOrderData.order, sellOrderData.signature, sellOrderData.customOrder, 'ARBITRAGE_SELL')
      ]);
      
      // Update opportunity status
      opportunity.status = 'executed';
      opportunity.orders = {
        buyOrder: buyOrderData.customOrder,
        sellOrder: sellOrderData.customOrder
      };
      
      // Update strategy metrics
      params.executedTrades++;
      params.totalProfit += opportunity.profitAbsolute;
      
      console.log(`✅ Arbitrage executed: ${opportunity.profitPercent.toFixed(3)}% profit, $${opportunity.profitAbsolute.toFixed(2)}`);
      
      return true;
    } catch (error) {
      console.error('Error executing arbitrage opportunity:', error);
      opportunity.status = 'failed';
      params.failedTrades++;
      return false;
    }
  }

  /**
   * Gets comprehensive arbitrage metrics
   */
  getArbitrageMetrics(strategy: TradingStrategy): ArbitrageMetrics {
    const params = strategy.parameters;
    const totalTrades = params.executedTrades + params.failedTrades;
    
    const opportunities = params.opportunities || [];
    const currentOpportunities = opportunities.filter(
      (opp: ArbitrageOpportunity) => opp.status === 'detected' && 
      (Date.now() - opp.timestamp) < 60000 // Opportunities valid for 1 minute
    );
    
    return {
      totalOpportunities: opportunities.length,
      executedTrades: params.executedTrades || 0,
      totalProfit: params.totalProfit || 0,
      totalProfitPercent: parseFloat(params.maxPositionSize) > 0 ? 
        (params.totalProfit / parseFloat(params.maxPositionSize)) * 100 : 0,
      successRate: totalTrades > 0 ? (params.executedTrades / totalTrades) * 100 : 0,
      avgProfitPerTrade: params.executedTrades > 0 ? params.totalProfit / params.executedTrades : 0,
      largestProfit: opportunities.reduce((max: number, opp: ArbitrageOpportunity) => 
        Math.max(max, opp.profitAbsolute), 0),
      currentOpportunities,
      marketEfficiency: params.scanCount > 0 ? (opportunities.length / params.scanCount) * 100 : 0
    };
  }

  /**
   * Gets default arbitrage markets configuration
   */
  static getDefaultMarkets(): ArbitrageMarket[] {
    return [
      {
        id: 'uniswap_v3',
        name: 'Uniswap V3',
        type: 'DEX',
        fee: 0.3,
        minSize: '0.01',
        enabled: true
      },
      {
        id: 'sushiswap',
        name: 'SushiSwap',
        type: 'DEX',
        fee: 0.25,
        minSize: '0.01',
        enabled: true
      },
      {
        id: 'oneinch_limit',
        name: '1inch Limit Orders',
        type: 'LIMIT_ORDER',
        fee: 0.1,
        minSize: '0.005',
        enabled: true
      },
      {
        id: 'curve',
        name: 'Curve Finance',
        type: 'DEX',
        fee: 0.04,
        minSize: '0.01',
        enabled: true
      }
    ];
  }

  /**
   * Stops the arbitrage strategy
   */
  async stopArbitrageStrategy(strategy: TradingStrategy): Promise<void> {
    this.stopMonitoring();
    strategy.isActive = false;
    strategy.updatedAt = Date.now();
    console.log(`🛑 Arbitrage strategy ${strategy.id} stopped`);
  }

  /**
   * Get all arbitrage orders
   */
  getCustomArbitrageOrders(): any[] {
    return [
      ...this.getCustomOrders('ARBITRAGE_BUY'),
      ...this.getCustomOrders('ARBITRAGE_SELL')
    ];
  }
}