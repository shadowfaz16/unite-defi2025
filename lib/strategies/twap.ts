import { LimitOrder, MakerTraits, Address, Sdk, randBigInt, FetchProviderConnector } from "@1inch/limit-order-sdk";
import { ethers } from "ethers";
import type { TWAPOrder, Token, TradingStrategy } from '../types';
import { ONEINCH_API_KEY } from '../constants';

export interface TWAPConfig {
  fromToken: Token;
  toToken: Token;
  totalAmount: string;
  numberOfOrders: number;
  intervalMinutes: number;
  slippageTolerance: number;
  maker: string;
}

export class TWAPStrategy {
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
   * Creates a TWAP (Time-Weighted Average Price) order strategy
   * This splits a large order into smaller orders executed over time
   */
  async createTWAPStrategy(config: TWAPConfig): Promise<TradingStrategy> {
    const {
      fromToken,
      toToken,
      totalAmount,
      numberOfOrders,
      intervalMinutes,
      slippageTolerance,
      maker
    } = config;

    // Calculate amount per order
    const totalAmountBN = BigInt(totalAmount);
    const amountPerOrder = totalAmountBN / BigInt(numberOfOrders);
    
    const strategy: TradingStrategy = {
      id: `twap_${Date.now()}`,
      type: 'TWAP',
      name: `TWAP: ${fromToken.symbol} → ${toToken.symbol}`,
      description: `Split ${totalAmount} ${fromToken.symbol} into ${numberOfOrders} orders executed every ${intervalMinutes} minutes`,
      isActive: true,
      parameters: {
        fromToken,
        toToken,
        totalAmount,
        numberOfOrders,
        intervalMinutes,
        slippageTolerance,
        amountPerOrder: amountPerOrder.toString(),
        maker,
        executedOrders: 0,
        nextExecutionTime: Date.now() + (intervalMinutes * 60 * 1000)
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    return strategy;
  }

  /**
   * Executes the next order in a TWAP strategy
   */
  async executeNextTWAPOrder(strategy: TradingStrategy): Promise<LimitOrder | null> {
    if (!strategy.isActive || strategy.type !== 'TWAP') {
      throw new Error('Invalid or inactive TWAP strategy');
    }

    const params = strategy.parameters;
    
    // Check if all orders have been executed
    if (params.executedOrders >= params.numberOfOrders) {
      strategy.isActive = false;
      return null;
    }

    // Check if it's time to execute the next order
    if (Date.now() < params.nextExecutionTime) {
      return null;
    }

    const UINT_40_MAX = (1n << 48n) - 1n;
    const expiresIn = 3600n; // 1 hour expiration
    const expiration = BigInt(Math.floor(Date.now() / 1000)) + expiresIn;

    const makerTraits = MakerTraits.default()
      .withExpiration(expiration)
      .withNonce(randBigInt(UINT_40_MAX));

    try {
      // Get current market price for this token pair
      const currentPrice = await this.getCurrentPrice(params.fromToken, params.toToken);
      
      // Calculate taking amount based on current price with slippage protection
      const makingAmount = BigInt(params.amountPerOrder);
      const baseRate = currentPrice * (1 - params.slippageTolerance / 100);
      const takingAmount = makingAmount * BigInt(Math.floor(baseRate * 1e18)) / BigInt(1e18);

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
      params.nextExecutionTime = Date.now() + (params.intervalMinutes * 60 * 1000);
      strategy.updatedAt = Date.now();

      if (params.executedOrders >= params.numberOfOrders) {
        strategy.isActive = false;
      }

      const limitOrder: LimitOrder = {
        id: `twap_order_${strategy.id}_${params.executedOrders}`,
        makerAsset: params.fromToken,
        takerAsset: params.toToken,
        makingAmount: makingAmount.toString(),
        takingAmount: takingAmount.toString(),
        maker: params.maker,
        status: 'pending',
        createdAt: Date.now(),
        expiration: Number(expiration),
        strategyId: strategy.id
      };

      return limitOrder;
    } catch (error) {
      console.error('Error executing TWAP order:', error);
      throw error;
    }
  }

  /**
   * Get current market price for token pair
   */
  private async getCurrentPrice(fromToken: Token, toToken: Token): Promise<number> {
    // This would integrate with 1inch Spot Price API
    // For now, return a mock price
    return 0.0001; // Mock price ratio
  }

  /**
   * Submit a signed TWAP order to the 1inch limit order protocol
   */
  async submitTWAPOrder(order: any): Promise<void> {
    const typedData = order.getTypedData();
    const signature = await this.signer.signTypedData(
      typedData.domain,
      { Order: typedData.types.Order },
      typedData.message
    );

    // Submit to our custom orderbook, NOT the official 1inch API
    // This satisfies the hackathon requirement: "Custom Limit Orders should not be posted to official Limit Order API"
    await this.submitToCustomOrderbook(order, signature);
  }

  /**
   * Submit to custom orderbook (not official 1inch API)
   */
  private async submitToCustomOrderbook(order: any, signature: string): Promise<void> {
    // Custom implementation - could be a local database, IPFS, or custom API
    console.log('Submitting to custom orderbook:', {
      order: order,
      signature
    });
    
    // Store in local storage or custom backend for demo purposes
    const customOrders = JSON.parse(localStorage.getItem('custom_twap_orders') || '[]');
    customOrders.push({
      order: order.build(),
      signature,
      timestamp: Date.now()
    });
    localStorage.setItem('custom_twap_orders', JSON.stringify(customOrders));
  }

  /**
   * Get all TWAP orders from custom orderbook
   */
  getCustomTWAPOrders(): any[] {
    return JSON.parse(localStorage.getItem('custom_twap_orders') || '[]');
  }

  /**
   * Cancel a TWAP strategy
   */
  cancelTWAPStrategy(strategy: TradingStrategy): void {
    strategy.isActive = false;
    strategy.updatedAt = Date.now();
  }

  /**
   * Get TWAP strategy performance metrics
   */
  getTWAPPerformance(strategy: TradingStrategy): {
    completion: number;
    averagePrice: number;
    totalExecuted: string;
    remainingAmount: string;
  } {
    const params = strategy.parameters;
    const completion = (params.executedOrders / params.numberOfOrders) * 100;
    const totalExecuted = BigInt(params.amountPerOrder) * BigInt(params.executedOrders);
    const remainingAmount = BigInt(params.totalAmount) - totalExecuted;

    return {
      completion,
      averagePrice: 0, // Would calculate from executed orders
      totalExecuted: totalExecuted.toString(),
      remainingAmount: remainingAmount.toString()
    };
  }
}