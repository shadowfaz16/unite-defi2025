import { LimitOrder } from "@1inch/limit-order-sdk";
import { ethers } from "ethers";
import { BaseStrategy } from './base-strategy';
import type { Token, TradingStrategy, LimitOrder as CustomLimitOrder } from '../types';

export interface GridTradingConfig {
  baseToken: Token; // Token being traded (e.g., WETH)
  quoteToken: Token; // Quote token (e.g., USDT)
  lowerPrice: number; // Lower bound of grid
  upperPrice: number; // Upper bound of grid
  gridLevels: number; // Number of grid levels (5-20 recommended)
  totalCapital: string; // Total capital to deploy
  maker: string;
  autoRebalance: boolean; // Automatically adjust grid when price moves out of range
  profitPercentage: number; // Minimum profit percentage per trade (e.g., 0.5%)
}

export interface GridOrder {
  id: string;
  level: number;
  type: 'BUY' | 'SELL';
  price: number;
  amount: string;
  status: 'pending' | 'filled' | 'cancelled';
  pairOrderId?: string; // ID of the opposite order that gets created when this fills
  profit?: number;
}

export interface GridTradingMetrics {
  totalTrades: number;
  successfulTrades: number;
  totalProfit: number;
  totalProfitPercent: number;
  avgProfitPerTrade: number;
  winRate: number;
  currentPrice: number;
  priceRange: { lower: number; upper: number };
  activeOrders: number;
  gridUtilization: number; // Percentage of grid levels with active orders
}

export class GridTradingStrategy extends BaseStrategy {
  constructor(signer: ethers.Wallet, networkId: number = 1) {
    super(signer, networkId);
  }

  /**
   * Creates a Grid Trading strategy
   * This places buy and sell orders in a grid pattern to profit from volatility
   */
  async createGridTradingStrategy(config: GridTradingConfig): Promise<TradingStrategy> {
    const {
      baseToken,
      quoteToken,
      lowerPrice,
      upperPrice,
      gridLevels,
      totalCapital,
      maker,
      autoRebalance,
      profitPercentage
    } = config;

    // Validate parameters
    if (lowerPrice >= upperPrice) {
      throw new Error('Lower price must be less than upper price');
    }
    if (gridLevels < 3 || gridLevels > 50) {
      throw new Error('Grid levels must be between 3 and 50');
    }

    const strategy: TradingStrategy = {
      id: `grid_${Date.now()}`,
      type: 'GRID_TRADING',
      name: `Grid: ${baseToken.symbol}/${quoteToken.symbol} [${lowerPrice}-${upperPrice}]`,
      description: `Grid trading with ${gridLevels} levels. Auto-rebalance: ${autoRebalance ? 'ON' : 'OFF'}`,
      isActive: true,
      parameters: {
        ...config,
        gridOrders: [],
        totalTrades: 0,
        successfulTrades: 0,
        totalProfit: 0,
        currentGridCenter: (lowerPrice + upperPrice) / 2,
        lastRebalanceTime: Date.now(),
        filledOrders: [],
        pendingOrders: []
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Create initial grid
    await this.createInitialGrid(strategy);

    return strategy;
  }

  /**
   * Creates the initial grid of buy and sell orders
   */
  private async createInitialGrid(strategy: TradingStrategy): Promise<void> {
    const params = strategy.parameters;
    const { baseToken, quoteToken, lowerPrice, upperPrice, gridLevels, totalCapital, profitPercentage } = params;
    
    // Get current price to determine grid positioning
    const currentPrice = await this.getCurrentPrice(baseToken, quoteToken);
    console.log(`📊 Current ${baseToken.symbol}/${quoteToken.symbol} price: ${currentPrice}`);
    
    const priceStep = (upperPrice - lowerPrice) / (gridLevels - 1);
    const capitalPerLevel = BigInt(totalCapital) / BigInt(gridLevels);
    
    const gridOrders: GridOrder[] = [];
    
    // Create grid levels
    for (let i = 0; i < gridLevels; i++) {
      const levelPrice = lowerPrice + (priceStep * i);
      
      // Determine if this level should have a buy or sell order based on current price
      if (levelPrice < currentPrice) {
        // Price is below current - place buy order
        const buyOrder = await this.createGridBuyOrder(
          strategy,
          i,
          levelPrice,
          capitalPerLevel,
          profitPercentage
        );
        if (buyOrder) gridOrders.push(buyOrder);
      } else if (levelPrice > currentPrice) {
        // Price is above current - place sell order  
        const sellOrder = await this.createGridSellOrder(
          strategy,
          i,
          levelPrice,
          capitalPerLevel,
          profitPercentage
        );
        if (sellOrder) gridOrders.push(sellOrder);
      }
      // Skip levels too close to current price to avoid immediate execution
    }
    
    params.gridOrders = gridOrders;
    params.pendingOrders = gridOrders.filter(o => o.status === 'pending');
    
    console.log(`✅ Created grid with ${gridOrders.length} orders`);
  }

  /**
   * Creates a buy order at a specific grid level
   */
  private async createGridBuyOrder(
    strategy: TradingStrategy,
    level: number,
    price: number,
    capitalAmount: bigint,
    profitPercentage: number
  ): Promise<GridOrder | null> {
    const { baseToken, quoteToken, maker } = strategy.parameters;
    
    try {
      // For buy order: spend quoteToken (USDT) to get baseToken (WETH)
      const makingAmount = capitalAmount; // Amount of USDT to spend
      const takingAmount = BigInt(Math.floor(Number(capitalAmount) / price)); // Amount of WETH to get
      
      // Create the limit order
      const { order, signature, customOrder } = await this.createLimitOrder({
        makerAsset: quoteToken,
        takerAsset: baseToken,
        makingAmount,
        takingAmount,
        maker,
        expiration: BigInt(Math.floor(Date.now() / 1000)) + BigInt(86400), // 24 hours
      });

      const gridOrder: GridOrder = {
        id: customOrder.id,
        level,
        type: 'BUY',
        price,
        amount: makingAmount.toString(),
        status: 'pending'
      };

      // Submit to custom orderbook
      await this.submitToCustomOrderbook(order, signature, customOrder, 'GRID_BUY');
      
      return gridOrder;
    } catch (error) {
      console.error(`Error creating grid buy order at level ${level}:`, error);
      return null;
    }
  }

  /**
   * Creates a sell order at a specific grid level
   */
  private async createGridSellOrder(
    strategy: TradingStrategy,
    level: number,
    price: number,
    capitalAmount: bigint,
    profitPercentage: number
  ): Promise<GridOrder | null> {
    const { baseToken, quoteToken, maker } = strategy.parameters;
    
    try {
      // For sell order: spend baseToken (WETH) to get quoteToken (USDT)
      const baseAmount = capitalAmount / BigInt(Math.floor(price)); // Amount of WETH to sell
      const makingAmount = baseAmount;
      const takingAmount = BigInt(Math.floor(Number(baseAmount) * price * (1 + profitPercentage / 100))); // USDT to receive with profit
      
      // Create the limit order
      const { order, signature, customOrder } = await this.createLimitOrder({
        makerAsset: baseToken,
        takerAsset: quoteToken,
        makingAmount,
        takingAmount,
        maker,
        expiration: BigInt(Math.floor(Date.now() / 1000)) + BigInt(86400), // 24 hours
      });

      const gridOrder: GridOrder = {
        id: customOrder.id,
        level,
        type: 'SELL',
        price,
        amount: makingAmount.toString(),
        status: 'pending'
      };

      // Submit to custom orderbook
      await this.submitToCustomOrderbook(order, signature, customOrder, 'GRID_SELL');
      
      return gridOrder;
    } catch (error) {
      console.error(`Error creating grid sell order at level ${level}:`, error);
      return null;
    }
  }

  /**
   * Simulates order execution and creates opposite orders
   * In real implementation, this would be triggered by order fill events
   */
  async simulateOrderFill(strategy: TradingStrategy, orderId: string): Promise<void> {
    const params = strategy.parameters;
    const orderIndex = params.gridOrders.findIndex((o: GridOrder) => o.id === orderId);
    
    if (orderIndex === -1) return;
    
    const filledOrder = params.gridOrders[orderIndex];
    filledOrder.status = 'filled';
    
    // Move to filled orders
    params.filledOrders.push(filledOrder);
    params.pendingOrders = params.pendingOrders.filter((o: GridOrder) => o.id !== orderId);
    
    // Calculate profit and update metrics
    const profit = this.calculateOrderProfit(filledOrder, strategy);
    filledOrder.profit = profit;
    params.totalProfit += profit;
    params.totalTrades += 1;
    
    if (profit > 0) {
      params.successfulTrades += 1;
    }
    
    // Create opposite order at profitable level
    await this.createOppositeOrder(strategy, filledOrder);
    
    console.log(`📈 Grid order filled: ${filledOrder.type} at ${filledOrder.price}, profit: ${profit}`);
  }

  /**
   * Creates an opposite order when one is filled
   */
  private async createOppositeOrder(strategy: TradingStrategy, filledOrder: GridOrder): Promise<void> {
    const { profitPercentage } = strategy.parameters;
    const capitalAmount = BigInt(filledOrder.amount);
    
    if (filledOrder.type === 'BUY') {
      // Create a sell order at higher price
      const sellPrice = filledOrder.price * (1 + profitPercentage / 100);
      const sellOrder = await this.createGridSellOrder(
        strategy,
        filledOrder.level + 1,
        sellPrice,
        capitalAmount,
        profitPercentage
      );
      
      if (sellOrder) {
        sellOrder.pairOrderId = filledOrder.id;
        strategy.parameters.gridOrders.push(sellOrder);
        strategy.parameters.pendingOrders.push(sellOrder);
      }
    } else {
      // Create a buy order at lower price
      const buyPrice = filledOrder.price * (1 - profitPercentage / 100);
      const buyOrder = await this.createGridBuyOrder(
        strategy,
        filledOrder.level - 1,
        buyPrice,
        capitalAmount,
        profitPercentage
      );
      
      if (buyOrder) {
        buyOrder.pairOrderId = filledOrder.id;
        strategy.parameters.gridOrders.push(buyOrder);
        strategy.parameters.pendingOrders.push(buyOrder);
      }
    }
  }

  /**
   * Calculates profit from a filled order
   */
  private calculateOrderProfit(order: GridOrder, strategy: TradingStrategy): number {
    // Find the paired order that created this one
    const pairedOrder = strategy.parameters.filledOrders.find(
      (o: GridOrder) => o.id === order.pairOrderId
    );
    
    if (!pairedOrder) return 0;
    
    // Calculate profit based on price difference
    const priceDifference = Math.abs(order.price - pairedOrder.price);
    const orderAmount = parseFloat(order.amount);
    
    return (priceDifference / pairedOrder.price) * orderAmount;
  }

  /**
   * Rebalances the grid when price moves outside the range
   */
  async rebalanceGrid(strategy: TradingStrategy): Promise<void> {
    if (!strategy.parameters.autoRebalance) return;
    
    const params = strategy.parameters;
    const currentPrice = await this.getCurrentPrice(params.baseToken, params.quoteToken);
    
    // Check if price is outside the current grid range
    if (currentPrice < params.lowerPrice || currentPrice > params.upperPrice) {
      console.log(`🔄 Rebalancing grid: price ${currentPrice} outside range [${params.lowerPrice}-${params.upperPrice}]`);
      
      // Cancel all pending orders
      await this.cancelAllGridOrders(strategy);
      
      // Adjust grid range around current price
      const range = params.upperPrice - params.lowerPrice;
      params.lowerPrice = currentPrice - range * 0.6;
      params.upperPrice = currentPrice + range * 0.4;
      params.lastRebalanceTime = Date.now();
      
      // Create new grid
      await this.createInitialGrid(strategy);
      
      strategy.updatedAt = Date.now();
    }
  }

  /**
   * Cancels all active grid orders
   */
  private async cancelAllGridOrders(strategy: TradingStrategy): Promise<void> {
    const pendingOrders = strategy.parameters.pendingOrders;
    
    for (const order of pendingOrders) {
      order.status = 'cancelled';
      await this.cancelOrder(order.id, 'GRID');
    }
    
    strategy.parameters.pendingOrders = [];
    console.log(`✅ Cancelled ${pendingOrders.length} pending grid orders`);
  }

  /**
   * Gets comprehensive grid trading metrics
   */
  getGridTradingMetrics(strategy: TradingStrategy): GridTradingMetrics {
    const params = strategy.parameters;
    const totalTrades = params.totalTrades || 0;
    const successfulTrades = params.successfulTrades || 0;
    const totalProfit = params.totalProfit || 0;
    const totalCapital = parseFloat(params.totalCapital);
    
    const winRate = totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0;
    const avgProfitPerTrade = totalTrades > 0 ? totalProfit / totalTrades : 0;
    const totalProfitPercent = totalCapital > 0 ? (totalProfit / totalCapital) * 100 : 0;
    
    const activeOrders = params.pendingOrders?.length || 0;
    const gridUtilization = (activeOrders / params.gridLevels) * 100;
    
    return {
      totalTrades,
      successfulTrades,
      totalProfit,
      totalProfitPercent,
      avgProfitPerTrade,
      winRate,
      currentPrice: params.currentGridCenter || 0,
      priceRange: {
        lower: params.lowerPrice,
        upper: params.upperPrice
      },
      activeOrders,
      gridUtilization
    };
  }

  /**
   * Get all grid trading orders
   */
  getCustomGridOrders(): any[] {
    return [
      ...this.getCustomOrders('GRID_BUY'),
      ...this.getCustomOrders('GRID_SELL')
    ];
  }

  /**
   * Stops the grid trading strategy
   */
  async stopGridTrading(strategy: TradingStrategy): Promise<void> {
    await this.cancelAllGridOrders(strategy);
    strategy.isActive = false;
    strategy.updatedAt = Date.now();
    console.log(`🛑 Grid trading strategy ${strategy.id} stopped`);
  }
}