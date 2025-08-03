import { LimitOrder, MakerTraits, Address, randBigInt, Api } from "@1inch/limit-order-sdk";
import { ethers } from "ethers";
import { OneInchAPI } from '../api/oneinch';
import type { Token, TradingStrategy, LimitOrder as CustomLimitOrder } from '../types';
import { ONEINCH_API_KEY } from '../constants';

export interface LimitOrderParams {
  makerAsset: Token;
  takerAsset: Token;
  makingAmount: bigint;
  takingAmount: bigint;
  maker: string;
  expiration?: bigint;
  salt?: bigint;
}

export abstract class BaseStrategy {
  protected api: Api;
  protected signer: ethers.Wallet;
  protected chainId: number;

  constructor(signer: ethers.Wallet, chainId: number = 1) {
    this.signer = signer;
    this.chainId = chainId;
    
    // Use the same proxy pattern as OneInchAPI.ts for consistency
    const httpConnector = {
      async request(config: { url: string; method?: string; data?: unknown; headers?: Record<string, string> }) {
        try {
          const response = await fetch(config.url, {
            method: config.method || 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${ONEINCH_API_KEY}`,
              'X-API-Key': ONEINCH_API_KEY,
              ...config.headers,
            },
            body: config.data ? JSON.stringify(config.data) : undefined,
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          return await response.json();
        } catch (error) {
          console.error("HTTP request failed:", error);
          throw error;
        }
      },
      
      async post(url: string, data: any, config: any = {}) {
        return this.request({
          url,
          method: 'POST',
          data,
          headers: config.headers
        });
      },
      
      async get(url: string, config: any = {}) {
        return this.request({
          url,
          method: 'GET', 
          headers: config.headers
        });
      }
    };
    
    this.api = new Api({
      authKey: ONEINCH_API_KEY,
      networkId: chainId,
      httpConnector,
    });
  }

  /**
   * Get real-time price for a token pair using 1inch Spot Price API
   */
  protected async getCurrentPrice(fromToken: Token, toToken: Token): Promise<number> {
    try {
      // Use the existing OneInchAPI.getTokenPrice for consistency
      const fromPriceResult = await OneInchAPI.getTokenPrice(this.chainId, fromToken.address);
      const toPriceResult = await OneInchAPI.getTokenPrice(this.chainId, toToken.address);
      
      if (fromPriceResult.success && toPriceResult.success) {
        const ratio = fromPriceResult.data.priceUSD / toPriceResult.data.priceUSD;
        return ratio;
      }
      
      // Fallback: use a more direct approach
      const swapQuote = await OneInchAPI.getSwapQuote(
        this.chainId,
        fromToken.address,
        toToken.address,
        (BigInt(10) ** BigInt(fromToken.decimals)).toString(), // 1 unit of fromToken
        this.signer.address
      );
      
      if (swapQuote.success) {
        const fromAmount = parseFloat(swapQuote.data.fromAmount);
        const toAmount = parseFloat(swapQuote.data.toAmount);
        return fromAmount / toAmount;
      }
      
      // Final fallback with reasonable defaults
      console.warn(`Failed to get real price for ${fromToken.symbol}/${toToken.symbol}, using fallback`);
      return this.getFallbackPrice(fromToken, toToken);
    } catch (error) {
      console.error(`Error getting price for ${fromToken.symbol}/${toToken.symbol}:`, error);
      return this.getFallbackPrice(fromToken, toToken);
    }
  }

  /**
   * Get fallback prices based on common token pairs
   */
  private getFallbackPrice(fromToken: Token, toToken: Token): number {
    const priceFallbacks: Record<string, number> = {
      'WETH/USDT': 2400,
      'WETH/USDC': 2400,
      'WBTC/USDT': 42000,
      'WBTC/USDC': 42000,
      '1INCH/USDT': 0.45,
      '1INCH/USDC': 0.45,
      'UNI/USDT': 8.5,
      'UNI/USDC': 8.5,
      'LINK/USDT': 14.2,
      'LINK/USDC': 14.2,
    };
    
    const pairKey = `${fromToken.symbol}/${toToken.symbol}`;
    const reversePairKey = `${toToken.symbol}/${fromToken.symbol}`;
    
    if (priceFallbacks[pairKey]) {
      return priceFallbacks[pairKey];
    } else if (priceFallbacks[reversePairKey]) {
      return 1 / priceFallbacks[reversePairKey];
    }
    
    // Default fallback
    return 0.001;
  }

  /**
   * Create a signed limit order using the 1inch SDK
   */
  protected async createLimitOrder(params: LimitOrderParams): Promise<{
    order: LimitOrder;
    signature: string;
    customOrder: CustomLimitOrder;
  }> {
    const {
      makerAsset,
      takerAsset,
      makingAmount,
      takingAmount,
      maker,
      expiration,
      salt
    } = params;

    // Generate secure random values
    const UINT_40_MAX = (BigInt(1) << BigInt(40)) - BigInt(1);
    const orderSalt = salt || randBigInt(UINT_40_MAX);
    const orderExpiration = expiration || BigInt(Math.floor(Date.now() / 1000)) + BigInt(3600); // 1 hour default

    // Create maker traits with proper gas optimization
    const makerTraits = MakerTraits.default()
      .withExpiration(orderExpiration)
      .withNonce(orderSalt)
      .allowPartialFills()
      .allowMultipleFills();

    // Create the limit order
    const order = new LimitOrder({
      makerAsset: new Address(makerAsset.address),
      takerAsset: new Address(takerAsset.address),
      makingAmount,
      takingAmount,
      maker: new Address(maker),
      receiver: new Address(maker), // Self-receive by default
    }, makerTraits);

    // Sign the order using EIP-712
    const typedData = order.getTypedData(this.chainId);

    const signature = await this.signer.signTypedData(
      typedData.domain,
      { Order: typedData.types.Order },
      typedData.message
    );

    // Create custom order object for tracking
    const customOrder: CustomLimitOrder = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      makerAsset,
      takerAsset,
      makingAmount: makingAmount.toString(),
      takingAmount: takingAmount.toString(),
      maker,
      status: 'pending',
      createdAt: Date.now(),
      expiration: Number(orderExpiration),
      signature,
      orderHash: order.getOrderHash(this.chainId),
    };

    return { order, signature, customOrder };
  }

  /**
   * Submit order to custom orderbook (not official 1inch API per hackathon rules)
   */
  protected async submitToCustomOrderbook(
    order: LimitOrder,
    signature: string,
    customOrder: CustomLimitOrder,
    strategyType: string
  ): Promise<void> {
    try {
      // Store in localStorage for demo (in production, would use custom backend)
      if (typeof window !== 'undefined') {
        const storageKey = `custom_orders_${strategyType.toLowerCase()}`;
        const existingOrders = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        const orderData = {
          order: {
            makerAsset: order.makerAsset.toString(),
            takerAsset: order.takerAsset.toString(),
            makingAmount: order.makingAmount.toString(),
            takingAmount: order.takingAmount.toString(),
            maker: order.maker.toString(),
            orderHash: customOrder.orderHash,
          },
          signature,
          customOrder,
          strategyType,
          timestamp: Date.now(),
          chainId: this.chainId
        };
        
        existingOrders.push(orderData);
        localStorage.setItem(storageKey, JSON.stringify(existingOrders));
        
        console.log(`✅ Order submitted to custom ${strategyType} orderbook:`, customOrder.id);
      }
    } catch (error) {
      console.error(`Failed to submit order to custom ${strategyType} orderbook:`, error);
      throw error;
    }
  }

  /**
   * Calculate optimal amounts based on current market price and slippage
   */
  protected calculateAmountsWithSlippage(
    makingAmount: bigint,
    currentPrice: number,
    slippageTolerance: number,
    fromDecimals: number,
    toDecimals: number
  ): { takingAmount: bigint; effectivePrice: number } {
    // Apply slippage tolerance to the price
    const effectivePrice = currentPrice * (1 - slippageTolerance / 100);
    
    // Calculate taking amount with proper decimal handling
    const fromAmountNormalized = Number(makingAmount) / (10 ** fromDecimals);
    const toAmountNormalized = fromAmountNormalized * effectivePrice;
    const takingAmount = BigInt(Math.floor(toAmountNormalized * (10 ** toDecimals)));
    
    return { takingAmount, effectivePrice };
  }

  /**
   * Get all custom orders for a strategy type
   */
  protected getCustomOrders(strategyType: string): any[] {
    if (typeof window === 'undefined') return [];
    
    const storageKey = `custom_orders_${strategyType.toLowerCase()}`;
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  }

  /**
   * Cancel a specific order by updating its status
   */
  protected async cancelOrder(orderId: string, strategyType: string): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const storageKey = `custom_orders_${strategyType.toLowerCase()}`;
    const orders = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    const updatedOrders = orders.map((orderData: any) => {
      if (orderData.customOrder.id === orderId) {
        orderData.customOrder.status = 'cancelled';
      }
      return orderData;
    });
    
    localStorage.setItem(storageKey, JSON.stringify(updatedOrders));
    console.log(`✅ Order ${orderId} cancelled`);
  }

  /**
   * Get strategy performance metrics
   */
  protected calculatePerformanceMetrics(strategy: TradingStrategy): {
    totalValue: number;
    pnl: number;
    pnlPercent: number;
    completionRate: number;
    avgExecutionPrice: number;
  } {
    // This would be implemented by each strategy type
    return {
      totalValue: 0,
      pnl: 0,
      pnlPercent: 0,
      completionRate: 0,
      avgExecutionPrice: 0
    };
  }
}