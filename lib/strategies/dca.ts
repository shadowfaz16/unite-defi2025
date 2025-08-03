import { LimitOrder } from "@1inch/limit-order-sdk";
import { ethers } from "ethers";
import { BaseStrategy } from './base-strategy';
import type { DCAOrder, Token, TradingStrategy } from '../types';

export interface DCAConfig {
  fromToken: Token;
  toToken: Token;
  amountPerOrder: string;
  intervalHours: number;
  totalOrders: number;
  maker: string;
  slippageTolerance: number;
}

export class DCAStrategy extends BaseStrategy {
  constructor(signer: ethers.Wallet, networkId: number = 1) {
    super(signer, networkId);
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
   * Executes the next DCA order using real-time price data
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
      // Get current market price using real 1inch API data
      const currentPrice = await this.getCurrentPrice(params.fromToken, params.toToken);
      console.log(`📊 Current ${params.fromToken.symbol}/${params.toToken.symbol} price: ${currentPrice}`);
      
      const makingAmount = BigInt(params.amountPerOrder);
      
      // Calculate taking amount with slippage protection using base class method
      const { takingAmount, effectivePrice } = this.calculateAmountsWithSlippage(
        makingAmount,
        currentPrice,
        params.slippageTolerance,
        params.fromToken.decimals,
        params.toToken.decimals
      );

      // Set expiration to interval + buffer time
      const expirationTime = BigInt(Math.floor(Date.now() / 1000)) + BigInt(params.intervalHours * 3600 + 1800);

      // Create and sign the limit order using base class method
      const { order, signature, customOrder } = await this.createLimitOrder({
        makerAsset: params.fromToken,
        takerAsset: params.toToken,
        makingAmount,
        takingAmount,
        maker: params.maker,
        expiration: expirationTime,
      });

      // Update strategy parameters
      params.executedOrders += 1;
      params.nextExecutionTime = Date.now() + (params.intervalHours * 60 * 60 * 1000);
      params.totalInvested = (BigInt(params.totalInvested) + makingAmount).toString();
      strategy.updatedAt = Date.now();

      if (params.executedOrders >= params.totalOrders) {
        strategy.isActive = false;
      }

      // Create DCA order result
      const dcaOrder: DCAOrder = {
        id: customOrder.id,
        fromToken: params.fromToken,
        toToken: params.toToken,
        amountPerOrder: params.amountPerOrder,
        intervalHours: params.intervalHours,
        totalOrders: params.totalOrders,
        executedOrders: params.executedOrders,
        isActive: strategy.isActive,
        nextExecutionTime: params.nextExecutionTime,
        currentPrice,
        effectivePrice,
        orderHash: customOrder.orderHash
      };

      // Submit to custom orderbook (not official 1inch API per hackathon rules)
      await this.submitToCustomOrderbook(order, signature, customOrder, 'DCA');

      console.log(`✅ DCA order ${dcaOrder.id} created and submitted to custom orderbook`);
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
   * Get all DCA orders from custom orderbook
   */
  getCustomDCAOrders(): any[] {
    return this.getCustomOrders('DCA');
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


}