import { LimitOrder, MakerTraits, Address, randBigInt, Api } from "@1inch/limit-order-sdk";
import { ethers } from "ethers";
import type { Token, TradingStrategy, LimitOrder as CustomLimitOrder } from '../types';
import { ONEINCH_API_KEY } from '../constants';

export interface OptionsConfig {
  underlyingToken: Token;
  strikeToken: Token; // Token to pay with (e.g., USDC)
  strikePrice: string; // Price at which option can be exercised
  premium: string; // Premium paid for the option
  expiration: number; // Unix timestamp
  isCall: boolean; // true for call option, false for put option
  maker: string;
  optionSize: string; // Amount of underlying token
}

export interface SyntheticOption {
  id: string;
  type: 'CALL' | 'PUT';
  underlyingToken: Token;
  strikeToken: Token;
  strikePrice: string;
  premium: string;
  optionSize: string;
  expiration: number;
  isActive: boolean;
  orders: CustomLimitOrder[];
  pnl: number;
}

export class OptionsStrategy {
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
   * Creates a synthetic call option using limit orders
   * A call option gives the right to buy the underlying at the strike price
   */
  async createSyntheticCallOption(config: OptionsConfig): Promise<TradingStrategy> {
    if (!config.isCall) {
      throw new Error('Use createSyntheticPutOption for put options');
    }

    const strategy: TradingStrategy = {
      id: `call_option_${Date.now()}`,
      type: 'OPTIONS_SYNTHETIC',
      name: `Call Option: ${config.underlyingToken.symbol} @ ${config.strikePrice}`,
      description: `Call option to buy ${config.optionSize} ${config.underlyingToken.symbol} at ${config.strikePrice} ${config.strikeToken.symbol}`,
      isActive: true,
      parameters: {
        ...config,
        type: 'CALL',
        orders: [],
        currentPrice: 0,
        intrinsicValue: 0,
        timeValue: 0
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Create the limit order that represents the option
    await this.createCallOptionOrder(strategy);

    return strategy;
  }

  /**
   * Creates a synthetic put option using limit orders
   * A put option gives the right to sell the underlying at the strike price
   */
  async createSyntheticPutOption(config: OptionsConfig): Promise<TradingStrategy> {
    if (config.isCall) {
      throw new Error('Use createSyntheticCallOption for call options');
    }

    const strategy: TradingStrategy = {
      id: `put_option_${Date.now()}`,
      type: 'OPTIONS_SYNTHETIC',
      name: `Put Option: ${config.underlyingToken.symbol} @ ${config.strikePrice}`,
      description: `Put option to sell ${config.optionSize} ${config.underlyingToken.symbol} at ${config.strikePrice} ${config.strikeToken.symbol}`,
      isActive: true,
      parameters: {
        ...config,
        type: 'PUT',
        orders: [],
        currentPrice: 0,
        intrinsicValue: 0,
        timeValue: 0
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Create the limit order that represents the option
    await this.createPutOptionOrder(strategy);

    return strategy;
  }

  /**
   * Creates a limit order for a call option
   * The order will only execute if the current price is above strike price
   */
  private async createCallOptionOrder(strategy: TradingStrategy): Promise<void> {
    const params = strategy.parameters;
    
    const UINT_40_MAX = (BigInt(1) << BigInt(48)) - BigInt(1);
    const expiration = BigInt(params.expiration);

    const makerTraits = MakerTraits.default()
      .withExpiration(expiration)
      .withNonce(randBigInt(UINT_40_MAX));

    // For a call option, we want to buy the underlying token at strike price
    // makingAmount = strike price * option size (what we pay)
    // takingAmount = option size (what we get)
    const makingAmount = BigInt(params.strikePrice) * BigInt(params.optionSize) / BigInt(10 ** params.underlyingToken.decimals);
    const takingAmount = BigInt(params.optionSize);

    // Create limit order using the SDK
    const order = new LimitOrder({
      makerAsset: new Address(params.strikeToken.address), // Pay with strike token (e.g., USDC)
      takerAsset: new Address(params.underlyingToken.address), // Get underlying token
      makingAmount,
      takingAmount,
      maker: new Address(params.maker),
    }, makerTraits);

    const limitOrder: CustomLimitOrder = {
      id: `call_order_${strategy.id}`,
      makerAsset: params.strikeToken,
      takerAsset: params.underlyingToken,
      makingAmount: makingAmount.toString(),
      takingAmount: takingAmount.toString(),
      maker: params.maker,
      status: 'pending',
      createdAt: Date.now(),
      expiration: params.expiration,
      strategyId: strategy.id
    };

    params.orders = [limitOrder];
    await this.submitToCustomOrderbook(order, limitOrder, 'CALL');
  }

  /**
   * Creates a limit order for a put option
   * The order will only execute if the current price is below strike price
   */
  private async createPutOptionOrder(strategy: TradingStrategy): Promise<void> {
    const params = strategy.parameters;
    
    const UINT_40_MAX = (BigInt(1) << BigInt(48)) - BigInt(1);
    const expiration = BigInt(params.expiration);

    const makerTraits = MakerTraits.default()
      .withExpiration(expiration)
      .withNonce(randBigInt(UINT_40_MAX));

    // For a put option, we want to sell the underlying token at strike price
    // makingAmount = option size (what we give)
    // takingAmount = strike price * option size (what we get)
    const makingAmount = BigInt(params.optionSize);
    const takingAmount = BigInt(params.strikePrice) * BigInt(params.optionSize) / BigInt(10 ** params.underlyingToken.decimals);

    // Create limit order using the SDK
    const order = new LimitOrder({
      makerAsset: new Address(params.underlyingToken.address), // Give underlying token
      takerAsset: new Address(params.strikeToken.address), // Get strike token (e.g., USDC)
      makingAmount,
      takingAmount,
      maker: new Address(params.maker),
    }, makerTraits);

    const limitOrder: CustomLimitOrder = {
      id: `put_order_${strategy.id}`,
      makerAsset: params.underlyingToken,
      takerAsset: params.strikeToken,
      makingAmount: makingAmount.toString(),
      takingAmount: takingAmount.toString(),
      maker: params.maker,
      status: 'pending',
      createdAt: Date.now(),
      expiration: params.expiration,
      strategyId: strategy.id
    };

    params.orders = [limitOrder];
    await this.submitToCustomOrderbook(order, limitOrder, 'PUT');
  }

  /**
   * Creates a covered call strategy
   * Sell a call option while holding the underlying asset
   */
  async createCoveredCall(
    underlyingToken: Token,
    strikeToken: Token,
    strikePrice: string,
    premium: string,
    expiration: number,
    optionSize: string,
    maker: string
  ): Promise<TradingStrategy> {
    const strategy: TradingStrategy = {
      id: `covered_call_${Date.now()}`,
      type: 'OPTIONS_SYNTHETIC',
      name: `Covered Call: ${underlyingToken.symbol} @ ${strikePrice}`,
      description: `Sell call option and hold ${optionSize} ${underlyingToken.symbol} as collateral`,
      isActive: true,
      parameters: {
        underlyingToken,
        strikeToken,
        strikePrice,
        premium,
        expiration,
        optionSize,
        maker,
        type: 'COVERED_CALL',
        orders: [],
        collateralAmount: optionSize
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    return strategy;
  }

  /**
   * Creates a protective put strategy
   * Buy a put option while holding the underlying asset
   */
  async createProtectivePut(
    underlyingToken: Token,
    strikeToken: Token,
    strikePrice: string,
    premium: string,
    expiration: number,
    optionSize: string,
    maker: string
  ): Promise<TradingStrategy> {
    const strategy: TradingStrategy = {
      id: `protective_put_${Date.now()}`,
      type: 'OPTIONS_SYNTHETIC',
      name: `Protective Put: ${underlyingToken.symbol} @ ${strikePrice}`,
      description: `Buy put option to protect ${optionSize} ${underlyingToken.symbol} holdings`,
      isActive: true,
      parameters: {
        underlyingToken,
        strikeToken,
        strikePrice,
        premium,
        expiration,
        optionSize,
        maker,
        type: 'PROTECTIVE_PUT',
        orders: [],
        protectedAmount: optionSize
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    return strategy;
  }

  /**
   * Calculate option Greeks (simplified)
   */
  calculateOptionGreeks(strategy: TradingStrategy, currentPrice: number): {
    delta: number;
    gamma: number;
    theta: number;
    intrinsicValue: number;
    timeValue: number;
  } {
    const params = strategy.parameters;
    const strikePrice = parseFloat(params.strikePrice);
    const timeToExpiry = (params.expiration - Date.now()) / (1000 * 60 * 60 * 24 * 365); // Years
    
    let intrinsicValue = 0;
    let delta = 0;

    if (params.type === 'CALL') {
      intrinsicValue = Math.max(0, currentPrice - strikePrice);
      delta = currentPrice > strikePrice ? 0.7 : 0.3; // Simplified delta
    } else if (params.type === 'PUT') {
      intrinsicValue = Math.max(0, strikePrice - currentPrice);
      delta = currentPrice < strikePrice ? -0.7 : -0.3; // Simplified delta
    }

    const timeValue = Math.max(0, parseFloat(params.premium) - intrinsicValue);
    const theta = -timeValue / (timeToExpiry * 365); // Time decay per day
    const gamma = 0.1; // Simplified gamma

    return {
      delta,
      gamma,
      theta,
      intrinsicValue,
      timeValue
    };
  }

  /**
   * Exercise the option if it's in the money
   */
  async exerciseOption(strategy: TradingStrategy): Promise<boolean> {
    const params = strategy.parameters;
    const currentPrice = await this.getCurrentPrice(params.underlyingToken, params.strikeToken);
    const strikePrice = parseFloat(params.strikePrice);

    let shouldExercise = false;

    if (params.type === 'CALL' && currentPrice > strikePrice) {
      shouldExercise = true;
    } else if (params.type === 'PUT' && currentPrice < strikePrice) {
      shouldExercise = true;
    }

    if (shouldExercise) {
      // Execute the option order
      strategy.isActive = false;
      strategy.updatedAt = Date.now();
      
      // Update order status
      params.orders.forEach((order: any) => {
        order.status = 'filled';
      });

      return true;
    }

    return false;
  }

  /**
   * Get current market price
   */
  private async getCurrentPrice(fromToken: Token, toToken: Token): Promise<number> {
    // Mock price for demo
    return 2000 + Math.random() * 200; // Price between 2000-2200
  }

  /**
   * Submit to custom orderbook
   */
  private async submitToCustomOrderbook(order: LimitOrder, limitOrder: CustomLimitOrder, optionType: string): Promise<void> {
    const typedData = order.getTypedData(1); // Pass networkId
    const signature = await this.signer.signTypedData(
      typedData.domain,
      { Order: typedData.types.Order },
      typedData.message
    );

    if (typeof window !== 'undefined') {
      const customOrders = JSON.parse(localStorage.getItem('custom_options_orders') || '[]');
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
        optionType,
        timestamp: Date.now()
      });
      localStorage.setItem('custom_options_orders', JSON.stringify(customOrders));
    }
  }

  /**
   * Get options performance
   */
  getOptionsPerformance(strategy: TradingStrategy): {
    currentValue: number;
    pnl: number;
    pnlPercent: number;
    timeToExpiry: number;
    isInTheMoney: boolean;
  } {
    const params = strategy.parameters;
    const premium = parseFloat(params.premium);
    const timeToExpiry = (params.expiration - Date.now()) / (1000 * 60 * 60 * 24); // Days
    
    // Mock current value calculation
    const currentValue = premium * 1.2; // 20% gain for demo
    const pnl = currentValue - premium;
    const pnlPercent = (pnl / premium) * 100;
    const isInTheMoney = Math.random() > 0.5; // Mock ITM status

    return {
      currentValue,
      pnl,
      pnlPercent,
      timeToExpiry,
      isInTheMoney
    };
  }

  /**
   * Get all options orders from custom orderbook
   */
  getCustomOptionsOrders(): any[] {
    return JSON.parse(localStorage.getItem('custom_options_orders') || '[]');
  }
}