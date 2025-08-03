import { LimitOrder as SDKLimitOrder } from "@1inch/limit-order-sdk";
import { ethers } from "ethers";
import { BaseStrategy } from './base-strategy';
import type { Token, TradingStrategy, LimitOrder } from '../types';

export interface TWAPConfig {
  fromToken: Token;
  toToken: Token;
  totalAmount: string;
  numberOfOrders: number;
  intervalMinutes: number;
  slippageTolerance: number;
  maker: string;
}

export class TWAPStrategy extends BaseStrategy {
  constructor(signer: ethers.Wallet, networkId: number = 1) {
    super(signer, networkId);
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
    
    // Debug: Show user-friendly amounts
    const userFriendlyTotal = Number(totalAmountBN) / (10 ** fromToken.decimals);
    const userFriendlyPerOrder = Number(amountPerOrder) / (10 ** fromToken.decimals);
    console.log(`📊 TWAP Strategy: Total ${userFriendlyTotal} ${fromToken.symbol} split into ${numberOfOrders} orders of ${userFriendlyPerOrder} ${fromToken.symbol} each`);
    
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
        nextExecutionTime: Date.now() - 1000 // Set to past so first order executes immediately
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    return strategy;
  }

  /**
   * Executes the next order in a TWAP strategy using real-time price data
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

    try {
      // Get current market price using real 1inch API data
      const currentPrice = await this.getCurrentPrice(params.fromToken, params.toToken);
      console.log(`📊 Current ${params.fromToken.symbol}/${params.toToken.symbol} price: ${currentPrice}`);
      
      // params.amountPerOrder is already in decimals (converted by frontend)
      const makingAmount = BigInt(params.amountPerOrder);
      const userFriendlyAmount = Number(makingAmount) / (10 ** params.fromToken.decimals);
      console.log(`💰 Using amount: ${userFriendlyAmount} ${params.fromToken.symbol} (${params.amountPerOrder} decimals)`);
      
      // Calculate taking amount with slippage protection using base class method
      const { takingAmount } = this.calculateAmountsWithSlippage(
        makingAmount,
        currentPrice,
        params.slippageTolerance,
        params.fromToken.decimals,
        params.toToken.decimals
      );

      // Set expiration to 1 hour
      const expirationTime = BigInt(Math.floor(Date.now() / 1000)) + BigInt(3600);

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
      params.nextExecutionTime = Date.now() + (params.intervalMinutes * 60 * 1000);
      strategy.updatedAt = Date.now();

      if (params.executedOrders >= params.numberOfOrders) {
        strategy.isActive = false;
      }

      // Create enhanced limit order result
      const limitOrder: LimitOrder = {
        id: customOrder.id,
        makerAsset: params.fromToken,
        takerAsset: params.toToken,
        makingAmount: makingAmount.toString(),
        takingAmount: takingAmount.toString(),
        maker: params.maker,
        status: 'pending',
        createdAt: Date.now(),
        expiration: Number(expirationTime),
        strategyId: strategy.id,
        signature,
        orderHash: customOrder.orderHash
      };

      // Submit to REAL 1inch API
      console.log(`📤 Submitting TWAP order to REAL 1inch API...`);
      const apiResult = await this.submitToRealOneInchAPI(order, signature, customOrder, 'TWAP');

      if (apiResult.success) {
        console.log(`✅ TWAP order ${limitOrder.id} successfully submitted to 1inch API!`);
        console.log(`🔗 Order hash: ${apiResult.apiResponse?.orderHash}`);
      } else {
        console.log(`⚠️ TWAP order ${limitOrder.id} stored locally as fallback`);
      }
      
      // Verify storage after submission
      if (typeof window !== 'undefined') {
        const storedOrders = JSON.parse(localStorage.getItem('custom_twap_orders') || '[]');
        console.log(`🔍 Verification: ${storedOrders.length} TWAP orders now in localStorage`);
      }
      return limitOrder;
    } catch (error) {
      console.error('Error executing TWAP order:', error);
      throw error;
    }
  }

  /**
   * Submit a signed TWAP order to our custom orderbook
   */
  async submitTWAPOrder(order: SDKLimitOrder): Promise<void> {
    // This method creates a custom order and submits it
    const customOrder = {
      id: `twap_manual_${Date.now()}`,
      makerAsset: { address: order.makerAsset.toString() } as Token,
      takerAsset: { address: order.takerAsset.toString() } as Token,
      makingAmount: order.makingAmount.toString(),
      takingAmount: order.takingAmount.toString(),
      maker: order.maker.toString(),
      status: 'pending' as const,
      createdAt: Date.now(),
      expiration: Date.now() + 3600000, // 1 hour
    };

    // Use base class method to get signature and submit
    const typedData = order.getTypedData(this.chainId);
    const signature = await this.signer.signTypedData(
      typedData.domain,
      { Order: typedData.types.Order },
      typedData.message
    );

    await this.submitToCustomOrderbook(order, signature, customOrder, 'TWAP');
  }

  /**
   * Get all TWAP orders from custom orderbook
   */
  getCustomTWAPOrders(): any[] {
    return this.getCustomOrders('TWAP');
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