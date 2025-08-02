import { LimitOrder, MakerTraits, Address, randBigInt, Api } from "@1inch/limit-order-sdk";
import { ethers } from "ethers";
import type { Token, TradingStrategy, LimitOrder as CustomLimitOrder } from '../types';
import { ONEINCH_API_KEY } from '../constants';

export interface ConcentratedLiquidityConfig {
  tokenA: Token;
  tokenB: Token;
  centerPrice: string;
  rangeWidth: number; // Percentage width of the range (e.g., 10 for ±10%)
  totalLiquidity: string;
  gridLevels: number; // Number of orders on each side
  maker: string;
  autoRebalance: boolean;
  rebalanceThreshold: number; // Percentage price movement to trigger rebalance
}

export interface LiquidityPosition {
  id: string;
  tokenA: Token;
  tokenB: Token;
  lowerPrice: number;
  upperPrice: number;
  centerPrice: number;
  totalLiquidity: string;
  activeOrders: CustomLimitOrder[];
  fees24h: number;
  apr: number;
  impermanentLoss: number;
}

export class ConcentratedLiquidityStrategy {
  private api: Api;
  private signer: ethers.Wallet;

  constructor(signer: ethers.Wallet, networkId: number = 1) {
    this.signer = signer;
    
    // Create a simple HTTP connector
    const httpConnector = {
      async request(config: { url: string; method?: string; data?: unknown; headers?: Record<string, string> }) {
        const response = await fetch(config.url, {
          method: config.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ONEINCH_API_KEY}`,
            ...config.headers,
          },
          body: config.data ? JSON.stringify(config.data) : undefined,
        });
        return await response.json();
      },
      async get(url: string, config: { headers?: Record<string, string> } = {}) {
        return this.request({ url, method: 'GET', headers: config.headers });
      },
      async post(url: string, data: unknown, config: { headers?: Record<string, string> } = {}) {
        return this.request({ url, method: 'POST', data, headers: config.headers });
      },
    };
    
    this.api = new Api({
      authKey: ONEINCH_API_KEY,
      networkId,
      httpConnector,
    });
  }

  /**
   * Creates a concentrated liquidity strategy using grid of limit orders
   * This mimics Uniswap V3 concentrated liquidity but with limit orders
   */
  async createConcentratedLiquidityStrategy(config: ConcentratedLiquidityConfig): Promise<TradingStrategy> {
    const {
      tokenA,
      tokenB,
      centerPrice,
      rangeWidth,
      totalLiquidity,
      gridLevels,
      maker,
      autoRebalance,
      rebalanceThreshold
    } = config;

    const strategy: TradingStrategy = {
      id: `cl_${Date.now()}`,
      type: 'CONCENTRATED_LIQUIDITY',
      name: `CL: ${tokenA.symbol}/${tokenB.symbol} ±${rangeWidth}%`,
      description: `Concentrated liquidity position with ${gridLevels} levels on each side, auto-rebalance: ${autoRebalance}`,
      isActive: true,
      parameters: {
        ...config,
        activeOrders: [],
        totalFeesEarned: '0',
        lastRebalanceTime: Date.now(),
        currentPrice: centerPrice,
        lowerPrice: parseFloat(centerPrice) * (1 - rangeWidth / 100),
        upperPrice: parseFloat(centerPrice) * (1 + rangeWidth / 100)
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Create initial grid of orders
    await this.createLiquidityGrid(strategy);

    return strategy;
  }

  /**
   * Creates a grid of limit orders to provide liquidity
   */
  private async createLiquidityGrid(strategy: TradingStrategy): Promise<void> {
    const params = strategy.parameters;
    const centerPrice = parseFloat(params.centerPrice);
    const rangeWidth = params.rangeWidth;
    const gridLevels = params.gridLevels;
    const totalLiquidity = BigInt(params.totalLiquidity);
    
    // Calculate liquidity per level
    const liquidityPerLevel = totalLiquidity / BigInt(gridLevels * 2); // 2 sides

    const orders: CustomLimitOrder[] = [];

    // Create buy orders (below center price)
    for (let i = 1; i <= gridLevels; i++) {
      const priceLevel = centerPrice * (1 - (rangeWidth / 100) * (i / gridLevels));
      const order = await this.createBuyOrder(strategy, priceLevel, liquidityPerLevel);
      if (order) orders.push(order);
    }

    // Create sell orders (above center price)
    for (let i = 1; i <= gridLevels; i++) {
      const priceLevel = centerPrice * (1 + (rangeWidth / 100) * (i / gridLevels));
      const order = await this.createSellOrder(strategy, priceLevel, liquidityPerLevel);
      if (order) orders.push(order);
    }

    params.activeOrders = orders;
  }

  /**
   * Creates a buy order at a specific price level
   */
  private async createBuyOrder(
    strategy: TradingStrategy,
    price: number,
    liquidity: bigint
  ): Promise<CustomLimitOrder | null> {
    const params = strategy.parameters;
    
    try {
      const UINT_40_MAX = (BigInt(1) << BigInt(48)) - BigInt(1);
      const expiresIn = BigInt(86400); // 24 hours
      const expiration = BigInt(Math.floor(Date.now() / 1000)) + expiresIn;

      const makerTraits = MakerTraits.default()
        .withExpiration(expiration)
        .withNonce(randBigInt(UINT_40_MAX));

      // For buy order: pay tokenB, get tokenA
      const makingAmount = liquidity; // Amount of tokenB to pay
      const takingAmount = BigInt(Math.floor(Number(liquidity) / price)); // Amount of tokenA to get

      // Create limit order using the SDK
      const order = new LimitOrder({
        makerAsset: new Address(params.tokenB.address),
        takerAsset: new Address(params.tokenA.address),
        makingAmount,
        takingAmount,
        maker: new Address(params.maker),
      }, makerTraits);

      const limitOrder: CustomLimitOrder = {
        id: `cl_buy_${strategy.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        makerAsset: params.tokenB,
        takerAsset: params.tokenA,
        makingAmount: makingAmount.toString(),
        takingAmount: takingAmount.toString(),
        maker: params.maker,
        status: 'pending',
        createdAt: Date.now(),
        expiration: Number(expiration),
        strategyId: strategy.id
      };

      await this.submitToCustomOrderbook(order, limitOrder, 'CL_BUY', price);
      return limitOrder;
    } catch (error) {
      console.error('Error creating buy order:', error);
      return null;
    }
  }

  /**
   * Creates a sell order at a specific price level
   */
  private async createSellOrder(
    strategy: TradingStrategy,
    price: number,
    liquidity: bigint
  ): Promise<CustomLimitOrder | null> {
    const params = strategy.parameters;
    
    try {
      const UINT_40_MAX = (BigInt(1) << BigInt(48)) - BigInt(1);
      const expiresIn = BigInt(86400); // 24 hours
      const expiration = BigInt(Math.floor(Date.now() / 1000)) + expiresIn;

      const makerTraits = MakerTraits.default()
        .withExpiration(expiration)
        .withNonce(randBigInt(UINT_40_MAX));

      // For sell order: pay tokenA, get tokenB
      const makingAmount = BigInt(Math.floor(Number(liquidity) / price)); // Amount of tokenA to pay
      const takingAmount = liquidity; // Amount of tokenB to get

      // Create limit order using the SDK
      const order = new LimitOrder({
        makerAsset: new Address(params.tokenA.address),
        takerAsset: new Address(params.tokenB.address),
        makingAmount,
        takingAmount,
        maker: new Address(params.maker),
      }, makerTraits);

      const limitOrder: CustomLimitOrder = {
        id: `cl_sell_${strategy.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        makerAsset: params.tokenA,
        takerAsset: params.tokenB,
        makingAmount: makingAmount.toString(),
        takingAmount: takingAmount.toString(),
        maker: params.maker,
        status: 'pending',
        createdAt: Date.now(),
        expiration: Number(expiration),
        strategyId: strategy.id
      };

      await this.submitToCustomOrderbook(order, limitOrder, 'CL_SELL', price);
      return limitOrder;
    } catch (error) {
      console.error('Error creating sell order:', error);
      return null;
    }
  }

  /**
   * Rebalances the concentrated liquidity position based on current price
   */
  async rebalanceLiquidity(strategy: TradingStrategy): Promise<void> {
    if (!strategy.isActive || !strategy.parameters.autoRebalance) {
      return;
    }

    const params = strategy.parameters;
    const currentPrice = await this.getCurrentPrice(params.tokenA, params.tokenB);
    const centerPrice = parseFloat(params.centerPrice);
    const rebalanceThreshold = params.rebalanceThreshold;

    // Check if rebalance is needed
    const priceChange = Math.abs((currentPrice - centerPrice) / centerPrice) * 100;
    
    if (priceChange > rebalanceThreshold) {
      console.log(`Rebalancing CL position: price changed ${priceChange.toFixed(2)}%`);
      
      // Cancel existing orders
      await this.cancelAllOrders(strategy);
      
      // Update center price
      params.centerPrice = currentPrice.toString();
      params.lowerPrice = currentPrice * (1 - params.rangeWidth / 100);
      params.upperPrice = currentPrice * (1 + params.rangeWidth / 100);
      params.lastRebalanceTime = Date.now();
      
      // Create new grid around current price
      await this.createLiquidityGrid(strategy);
      
      strategy.updatedAt = Date.now();
    }
  }

  /**
   * Creates an advanced range order (similar to Uniswap V3 position)
   */
  async createRangeOrder(
    tokenA: Token,
    tokenB: Token,
    lowerPrice: number,
    upperPrice: number,
    liquidity: string,
    maker: string
  ): Promise<TradingStrategy> {
    const centerPrice = (lowerPrice + upperPrice) / 2;
    const rangeWidth = ((upperPrice - lowerPrice) / centerPrice) * 100;

    const strategy: TradingStrategy = {
      id: `range_${Date.now()}`,
      type: 'CONCENTRATED_LIQUIDITY',
      name: `Range: ${tokenA.symbol}/${tokenB.symbol} [${lowerPrice.toFixed(4)}-${upperPrice.toFixed(4)}]`,
      description: `Range order providing liquidity between ${lowerPrice} and ${upperPrice}`,
      isActive: true,
      parameters: {
        tokenA,
        tokenB,
        centerPrice: centerPrice.toString(),
        rangeWidth,
        totalLiquidity: liquidity,
        gridLevels: 5, // Use 5 levels for range orders
        maker,
        autoRebalance: false, // Range orders don't auto-rebalance
        rebalanceThreshold: 50,
        lowerPrice,
        upperPrice,
        activeOrders: []
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await this.createLiquidityGrid(strategy);
    return strategy;
  }

  /**
   * Creates a grid trading strategy (buy low, sell high repeatedly)
   */
  async createGridTrading(
    tokenA: Token,
    tokenB: Token,
    lowerPrice: number,
    upperPrice: number,
    gridCount: number,
    totalCapital: string,
    maker: string
  ): Promise<TradingStrategy> {
    const strategy: TradingStrategy = {
      id: `grid_${Date.now()}`,
      type: 'GRID_TRADING',
      name: `Grid: ${tokenA.symbol}/${tokenB.symbol} ${gridCount} levels`,
      description: `Grid trading with ${gridCount} levels between ${lowerPrice} and ${upperPrice}`,
      isActive: true,
      parameters: {
        tokenA,
        tokenB,
        lowerPrice,
        upperPrice,
        gridCount,
        totalCapital,
        maker,
        activeOrders: [],
        totalProfit: '0',
        executedTrades: 0
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await this.createGridOrders(strategy);
    return strategy;
  }

  /**
   * Creates grid orders for grid trading strategy
   */
  private async createGridOrders(strategy: TradingStrategy): Promise<void> {
    const params = strategy.parameters;
    const { lowerPrice, upperPrice, gridCount, totalCapital } = params;
    const priceStep = (upperPrice - lowerPrice) / (gridCount - 1);
    const capitalPerOrder = BigInt(totalCapital) / BigInt(gridCount);

    const orders: CustomLimitOrder[] = [];

    for (let i = 0; i < gridCount; i++) {
      const price = lowerPrice + (priceStep * i);
      
      // Create both buy and sell orders at each level
      const buyOrder = await this.createBuyOrder(strategy, price * 0.995, capitalPerOrder); // 0.5% below
      const sellOrder = await this.createSellOrder(strategy, price * 1.005, capitalPerOrder); // 0.5% above
      
      if (buyOrder) orders.push(buyOrder);
      if (sellOrder) orders.push(sellOrder);
    }

    params.activeOrders = orders;
  }

  /**
   * Calculate concentrated liquidity metrics
   */
  getConcentratedLiquidityMetrics(strategy: TradingStrategy): {
    tvl: number;
    feesEarned: number;
    apr: number;
    impermanentLoss: number;
    utilizationRate: number;
    priceRange: { lower: number; upper: number };
  } {
    const params = strategy.parameters;
    const currentPrice = parseFloat(params.currentPrice || params.centerPrice);
    
    const tvl = parseFloat(params.totalLiquidity) || 0;
    const feesEarned = parseFloat(params.totalFeesEarned || '0');
    const timeActive = (Date.now() - strategy.createdAt) / (1000 * 60 * 60 * 24); // Days
    const apr = timeActive > 0 ? (feesEarned / tvl) * (365 / timeActive) * 100 : 0;
    
    // Calculate impermanent loss (simplified)
    const initialPrice = parseFloat(strategy.parameters.centerPrice);
    const priceRatio = currentPrice / initialPrice;
    const impermanentLoss = (2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1) * 100;
    
    // Utilization rate (how much of the range is being used)
    const lowerPrice = params.lowerPrice;
    const upperPrice = params.upperPrice;
    const utilizationRate = currentPrice >= lowerPrice && currentPrice <= upperPrice ? 
      100 : 0;

    return {
      tvl,
      feesEarned,
      apr,
      impermanentLoss,
      utilizationRate,
      priceRange: { lower: lowerPrice, upper: upperPrice }
    };
  }

  /**
   * Cancel all orders in the strategy
   */
  private async cancelAllOrders(strategy: TradingStrategy): Promise<void> {
    const params = strategy.parameters;
    
    params.activeOrders.forEach((order: any) => {
      order.status = 'cancelled';
    });
    
    params.activeOrders = [];
  }

  /**
   * Get current market price
   */
  private async getCurrentPrice(tokenA: Token, tokenB: Token): Promise<number> {
    // Mock price with some volatility
    const basePrice = 2000;
    const volatility = 50; // ±50 price movement
    return basePrice + (Math.random() - 0.5) * volatility * 2;
  }

  /**
   * Submit to custom orderbook
   */
  private async submitToCustomOrderbook(
    order: LimitOrder,
    limitOrder: CustomLimitOrder,
    orderType: string,
    price: number
  ): Promise<void> {
    const typedData = order.getTypedData(1); // Default to Ethereum mainnet
    const signature = await this.signer.signTypedData(
      typedData.domain,
      { Order: typedData.types.Order },
      typedData.message
    );

    if (typeof window !== 'undefined') {
      const customOrders = JSON.parse(localStorage.getItem('custom_cl_orders') || '[]');
      customOrders.push({
        order: {
          makerAsset: order.makerAsset.toString(),
          takerAsset: order.takerAsset.toString(),
          makingAmount: order.makingAmount.toString(),
          takingAmount: order.takingAmount.toString(),
          maker: order.maker.toString(),
        },
        signature,
        limitOrder,
        orderType,
        price,
        timestamp: Date.now()
      });
      localStorage.setItem('custom_cl_orders', JSON.stringify(customOrders));
    }
  }

  /**
   * Get all concentrated liquidity orders
   */
  getCustomCLOrders(): any[] {
    return JSON.parse(localStorage.getItem('custom_cl_orders') || '[]');
  }
}