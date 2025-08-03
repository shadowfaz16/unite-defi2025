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
      console.log(`🔍 Fetching price for ${fromToken.symbol}/${toToken.symbol}...`);
      
      // Method 1: Try swap quote approach first (more reliable)
      try {
        const signerAddress = await this.signer.getAddress();
        const oneUnit = (BigInt(10) ** BigInt(fromToken.decimals)).toString();
        
        console.log(`📊 Getting swap quote: ${oneUnit} ${fromToken.symbol} → ${toToken.symbol}`);
        
        const swapQuote = await OneInchAPI.getSwapQuote(
          this.chainId,
          fromToken.address,
          toToken.address,
          oneUnit,
          signerAddress
        );
        
        if (swapQuote.success && swapQuote.data) {
          const fromAmount = parseFloat(swapQuote.data.fromAmount);
          const toAmount = parseFloat(swapQuote.data.toAmount);
          
          if (fromAmount > 0 && toAmount > 0) {
            const price = toAmount / fromAmount;
            console.log(`✅ Price via swap quote: 1 ${fromToken.symbol} = ${price} ${toToken.symbol}`);
            return price;
          }
        }
      } catch (quoteError) {
        console.warn('Swap quote method failed:', quoteError);
      }
      
      // Method 2: Try spot price approach
      try {
        const fromPriceResult = await OneInchAPI.getTokenPrice(this.chainId, fromToken.address);
        const toPriceResult = await OneInchAPI.getTokenPrice(this.chainId, toToken.address);
        
        if (fromPriceResult.success && toPriceResult.success && 
            fromPriceResult.data.priceUSD > 0 && toPriceResult.data.priceUSD > 0) {
          const ratio = fromPriceResult.data.priceUSD / toPriceResult.data.priceUSD;
          console.log(`✅ Price via spot price: 1 ${fromToken.symbol} = ${ratio} ${toToken.symbol}`);
          return ratio;
        }
      } catch (spotError) {
        console.warn('Spot price method failed:', spotError);
      }
      
      // Method 3: Fallback with reasonable defaults
      console.warn(`⚠️ All price methods failed for ${fromToken.symbol}/${toToken.symbol}, using fallback`);
      const fallbackPrice = this.getFallbackPrice(fromToken, toToken);
      console.log(`🔄 Using fallback price: 1 ${fromToken.symbol} = ${fallbackPrice} ${toToken.symbol}`);
      return fallbackPrice;
      
    } catch (error) {
      console.error(`❌ Error getting price for ${fromToken.symbol}/${toToken.symbol}:`, error);
      const fallbackPrice = this.getFallbackPrice(fromToken, toToken);
      console.log(`🔄 Using fallback price after error: 1 ${fromToken.symbol} = ${fallbackPrice} ${toToken.symbol}`);
      return fallbackPrice;
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
   * Submit order to REAL 1inch API (production ready)
   */
  protected async submitToRealOneInchAPI(
    order: LimitOrder,
    signature: string,
    customOrder: CustomLimitOrder,
    strategyType: string
  ): Promise<{ success: boolean; apiResponse?: any }> {
    try {
      console.log(`🚀 Submitting ${strategyType} order to REAL 1inch API...`);
      
      // Submit to real 1inch API
      const { OneInchAPI } = await import('../api/oneinch');
      const result = await OneInchAPI.submitLimitOrder(this.chainId, order, signature);
      
      if (result.success) {
        console.log(`✅ ${strategyType} order successfully submitted to 1inch API!`);
        console.log(`📋 Order hash: ${result.data.orderHash}`);
        
        // Also store locally for UI display
        await this.storeOrderLocally(order, signature, customOrder, strategyType, true);
        
        return { success: true, apiResponse: result.data };
      } else {
        console.warn(`⚠️ Failed to submit ${strategyType} order to 1inch API:`, result.error);
        console.log(`💾 Storing order locally as fallback for demo purposes`);
        
        // Fallback: store locally for demo
        await this.storeOrderLocally(order, signature, customOrder, strategyType, false);
        
        return { success: false, apiResponse: result };
      }
    } catch (error) {
      console.error(`❌ Error submitting ${strategyType} order to 1inch API:`, error);
      
      // Fallback: store locally for demo
      await this.storeOrderLocally(order, signature, customOrder, strategyType, false);
      
      throw error;
    }
  }

  /**
   * Store order locally for demo/fallback purposes
   */
  private async storeOrderLocally(
    order: LimitOrder,
    signature: string,
    customOrder: CustomLimitOrder,
    strategyType: string,
    isRealOrder: boolean = false
  ): Promise<void> {
    try {
      // Store in localStorage for demo fallback
      if (typeof window !== 'undefined') {
        const storageKey = `custom_${strategyType.toLowerCase()}_orders`;
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
          chainId: this.chainId,
          isRealOrder // Mark if this was actually submitted to 1inch API
        };
        
        existingOrders.push(orderData);
        localStorage.setItem(storageKey, JSON.stringify(existingOrders));
        
        console.log(`💾 Order stored locally with key: ${storageKey}`);
        console.log(`📊 Order data saved (${isRealOrder ? 'REAL API' : 'DEMO FALLBACK'}):`, orderData);
        console.log(`📈 Total orders in ${strategyType} storage:`, existingOrders.length);
      }
    } catch (error) {
      console.error(`Failed to store ${strategyType} order locally:`, error);
    }
  }

  /**
   * Submit order to custom orderbook (DEPRECATED - use submitToRealOneInchAPI)
   */
  protected async submitToCustomOrderbook(
    order: LimitOrder,
    signature: string,
    customOrder: CustomLimitOrder,
    strategyType: string
  ): Promise<void> {
    console.warn(`⚠️ Using deprecated custom orderbook for ${strategyType}. Use submitToRealOneInchAPI for production.`);
    return this.storeOrderLocally(order, signature, customOrder, strategyType, false);
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
    console.log(`🧮 Calculating amounts:`, {
      makingAmount: makingAmount.toString(),
      currentPrice,
      slippageTolerance,
      fromDecimals,
      toDecimals
    });
    
    // Validate inputs
    if (isNaN(currentPrice) || currentPrice <= 0) {
      throw new Error(`Invalid current price: ${currentPrice}. Cannot calculate taking amount.`);
    }
    
    if (makingAmount <= BigInt(0)) {
      throw new Error(`Invalid making amount: ${makingAmount}. Must be greater than 0.`);
    }
    
    // Apply slippage tolerance to the price
    const effectivePrice = currentPrice * (1 - slippageTolerance / 100);
    console.log(`💱 Effective price after ${slippageTolerance}% slippage: ${effectivePrice}`);
    
    // Calculate taking amount with proper decimal handling
    const fromAmountNormalized = Number(makingAmount) / (10 ** fromDecimals);
    const toAmountNormalized = fromAmountNormalized * effectivePrice;
    const takingAmount = BigInt(Math.floor(toAmountNormalized * (10 ** toDecimals)));
    
    console.log(`📊 Amount calculation result:`, {
      fromAmountNormalized,
      toAmountNormalized,
      takingAmount: takingAmount.toString()
    });
    
    return { takingAmount, effectivePrice };
  }

  /**
   * Get all custom orders for a strategy type
   */
  protected getCustomOrders(strategyType: string): any[] {
    if (typeof window === 'undefined') return [];
    
    const storageKey = `custom_${strategyType.toLowerCase()}_orders`;
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  }

  /**
   * Cancel a specific order by updating its status
   */
  protected async cancelOrder(orderId: string, strategyType: string): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const storageKey = `custom_${strategyType.toLowerCase()}_orders`;
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