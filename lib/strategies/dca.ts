import { LimitOrder, MakerTraits, Address, Sdk, randBigInt, FetchProviderConnector } from "@1inch/limit-order-sdk";
import { ethers } from "ethers";
import type { DCAOrder, Token, TradingStrategy } from '../types';
import { ONEINCH_API_KEY } from '../constants';

export interface DCAConfig {
  fromToken: Token;
  toToken: Token;
  amountPerOrder: string;
  intervalHours: number;
  totalOrders: number;
  maker: string;
  slippageTolerance: number;
}

export class DCAStrategy {
  private sdk: Sdk;
  private signer: ethers.Wallet;

  constructor(signer: ethers.Wallet, networkId: number = 1) {
    this.signer = signer;
    this.sdk = new Sdk({
      authKey: ONEINCH_API_KEY,
      networkId,
      httpConnector: new FetchProviderConnector(),
    });
  }

  /**
   * Creates a DCA (Dollar Cost Averaging) strategy
   * This creates recurring buy orders at regular intervals
   */
  async createDCAStrategy(config: DCAConfig): Promise<TradingStrategy> {
    const {
      fromToken,
      toToken,
      amountPerOrder,
      intervalHours,
      totalOrders,
      maker,
      slippageTolerance
    } = config;

    const strategy: TradingStrategy = {
      id: `dca_${Date.now()}`,
      type: 'DCA',
      name: `DCA: ${amountPerOrder} ${fromToken.symbol} → ${toToken.symbol}`,
      description: `Buy ${amountPerOrder} ${fromToken.symbol} worth of ${toToken.symbol} every ${intervalHours} hours for ${totalOrders} times`,
      isActive: true,
      parameters: {
        fromToken,
        toToken,
        amountPerOrder,
        intervalHours,
        totalOrders,
        maker,
        slippageTolerance,
        executedOrders: 0,
        nextExecutionTime: Date.now() + (intervalHours * 60 * 60 * 1000),
        totalInvested: '0',
        totalReceived: '0',
        averagePrice: 0
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    return strategy;
  }

  /**
   * Executes the next DCA order
   */
  async executeNextDCAOrder(strategy: TradingStrategy): Promise<DCAOrder | null> {
    if (!strategy.isActive || strategy.type !== 'DCA') {
      throw new Error('Invalid or inactive DCA strategy');
    }

    const params = strategy.parameters;
    
    // Check if all orders have been executed
    if (params.executedOrders >= params.totalOrders) {
      strategy.isActive = false;
      return null;
    }

    // Check if it's time to execute the next order
    if (Date.now() < params.nextExecutionTime) {
      return null;
    }

    try {
      // Get current market price
      const currentPrice = await this.getCurrentPrice(params.fromToken, params.toToken);
      
      const makingAmount = BigInt(params.amountPerOrder);
      const baseRate = currentPrice * (1 - params.slippageTolerance / 100);
      const takingAmount = makingAmount * BigInt(Math.floor(baseRate * 1e18)) / BigInt(1e18);

      const UINT_40_MAX = (1n << 48n) - 1n;
      const expiresIn = BigInt(params.intervalHours * 3600 + 1800); // Interval + 30 min buffer
      const expiration = BigInt(Math.floor(Date.now() / 1000)) + expiresIn;

      const makerTraits = MakerTraits.default()
        .withExpiration(expiration)
        .withNonce(randBigInt(UINT_40_MAX));

      const order = await this.sdk.createOrder(
        {
          makerAsset: new Address(params.fromToken.address),
          takerAsset: new Address(params.toToken.address),
          makingAmount,
          takingAmount,
          maker: new Address(params.maker),
        },
        makerTraits
      );

      // Update strategy parameters
      params.executedOrders += 1;
      params.nextExecutionTime = Date.now() + (params.intervalHours * 60 * 60 * 1000);
      params.totalInvested = (BigInt(params.totalInvested) + makingAmount).toString();
      strategy.updatedAt = Date.now();

      if (params.executedOrders >= params.totalOrders) {
        strategy.isActive = false;
      }

      const dcaOrder: DCAOrder = {
        id: `dca_order_${strategy.id}_${params.executedOrders}`,
        fromToken: params.fromToken,
        toToken: params.toToken,
        amountPerOrder: params.amountPerOrder,
        intervalHours: params.intervalHours,
        totalOrders: params.totalOrders,
        executedOrders: params.executedOrders,
        isActive: strategy.isActive,
        nextExecutionTime: params.nextExecutionTime
      };

      // Submit to custom orderbook
      await this.submitToCustomOrderbook(order, dcaOrder);

      return dcaOrder;
    } catch (error) {
      console.error('Error executing DCA order:', error);
      throw error;
    }
  }

  /**
   * Advanced DCA with price conditions
   * Only execute DCA if price is below a certain threshold (buy the dip)
   */
  async createSmartDCA(
    config: DCAConfig,
    priceConditions: {
      maxPriceThreshold?: number; // Only buy if price is below this
      minPriceDropPercent?: number; // Only buy if price dropped by this % since last order
    }
  ): Promise<TradingStrategy> {
    const strategy = await this.createDCAStrategy(config);
    
    strategy.name = `Smart DCA: ${config.amountPerOrder} ${config.fromToken.symbol} → ${config.toToken.symbol}`;
    strategy.description = `Smart DCA with price conditions: max threshold ${priceConditions.maxPriceThreshold || 'none'}, min drop ${priceConditions.minPriceDropPercent || 0}%`;
    strategy.parameters.priceConditions = priceConditions;
    strategy.parameters.lastExecutionPrice = 0;

    return strategy;
  }

  /**
   * Execute smart DCA with price conditions
   */
  async executeSmartDCAOrder(strategy: TradingStrategy): Promise<DCAOrder | null> {
    const params = strategy.parameters;
    
    if (!params.priceConditions) {
      return this.executeNextDCAOrder(strategy);
    }

    const currentPrice = await this.getCurrentPrice(params.fromToken, params.toToken);
    const { maxPriceThreshold, minPriceDropPercent } = params.priceConditions;

    // Check price threshold condition
    if (maxPriceThreshold && currentPrice > maxPriceThreshold) {
      console.log(`Price ${currentPrice} above threshold ${maxPriceThreshold}, skipping DCA order`);
      return null;
    }

    // Check price drop condition
    if (minPriceDropPercent && params.lastExecutionPrice > 0) {
      const priceDropPercent = ((params.lastExecutionPrice - currentPrice) / params.lastExecutionPrice) * 100;
      if (priceDropPercent < minPriceDropPercent) {
        console.log(`Price drop ${priceDropPercent}% below required ${minPriceDropPercent}%, skipping DCA order`);
        return null;
      }
    }

    // Execute the order
    const order = await this.executeNextDCAOrder(strategy);
    if (order) {
      params.lastExecutionPrice = currentPrice;
    }

    return order;
  }

  /**
   * Get current market price for token pair
   */
  private async getCurrentPrice(fromToken: Token, toToken: Token): Promise<number> {
    // This would integrate with 1inch Spot Price API
    // For now, return a mock price with some variation
    const basePrice = 0.0001;
    const variation = (Math.random() - 0.5) * 0.0002; // +/- 0.01% variation
    return basePrice + variation;
  }

  /**
   * Submit to custom orderbook
   */
  private async submitToCustomOrderbook(order: any, dcaOrder: DCAOrder): Promise<void> {
    const typedData = order.getTypedData();
    const signature = await this.signer.signTypedData(
      typedData.domain,
      { Order: typedData.types.Order },
      typedData.message
    );

    // Store in custom orderbook
    const customOrders = JSON.parse(localStorage.getItem('custom_dca_orders') || '[]');
    customOrders.push({
      order: order.build(),
      signature,
      dcaOrder,
      timestamp: Date.now()
    });
    localStorage.setItem('custom_dca_orders', JSON.stringify(customOrders));
  }

  /**
   * Get DCA strategy performance metrics
   */
  getDCAPerformance(strategy: TradingStrategy): {
    completion: number;
    totalInvested: string;
    averagePrice: number;
    estimatedValue: number;
    pnl: number;
  } {
    const params = strategy.parameters;
    const completion = (params.executedOrders / params.totalOrders) * 100;
    
    // Calculate average price and current value
    const totalInvested = parseFloat(params.totalInvested || '0');
    const averagePrice = params.averagePrice || 0;
    const estimatedValue = totalInvested * 1.05; // Mock 5% gain
    const pnl = estimatedValue - totalInvested;

    return {
      completion,
      totalInvested: params.totalInvested || '0',
      averagePrice,
      estimatedValue,
      pnl
    };
  }

  /**
   * Cancel DCA strategy
   */
  cancelDCAStrategy(strategy: TradingStrategy): void {
    strategy.isActive = false;
    strategy.updatedAt = Date.now();
  }

  /**
   * Get all DCA orders from custom orderbook
   */
  getCustomDCAOrders(): any[] {
    return JSON.parse(localStorage.getItem('custom_dca_orders') || '[]');
  }
}