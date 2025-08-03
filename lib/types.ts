export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export interface TokenBalance {
  token: Token;
  balance: string;
  balanceUSD: number;
}

export interface PriceData {
  token: string;
  price: number;
  priceUSD: number;
  timestamp: number;
}

export interface TradingStrategy {
  id: string;
  type: keyof typeof import('./constants').STRATEGY_TYPES;
  name: string;
  description: string;
  isActive: boolean;
  parameters: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface LimitOrder {
  id: string;
  makerAsset: Token;
  takerAsset: Token;
  makingAmount: string;
  takingAmount: string;
  maker: string;
  status: (typeof import('./constants').ORDER_STATUS)[keyof typeof import('./constants').ORDER_STATUS];
  createdAt: number;
  expiration?: number;
  strategyId?: string;
}

export interface TWAPOrder extends LimitOrder {
  totalAmount: string;
  intervalMinutes: number;
  numberOfOrders: number;
  executedOrders: number;
}

export interface DCAOrder {
  id: string;
  fromToken: Token;
  toToken: Token;
  amountPerOrder: string;
  intervalHours: number;
  totalOrders: number;
  executedOrders: number;
  isActive: boolean;
  nextExecutionTime: number;
}

export interface StopLossOrder extends LimitOrder {
  triggerPrice: string;
  triggerPriceUSD: number;
  currentPrice: string;
}

export interface PortfolioData {
  totalValueUSD: number;
  balances: TokenBalance[];
  pnl24h: number;
  pnl7d: number;
  pnl30d: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface SwapQuote {
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  estimatedGas: string;
  protocols: string[];
}

export interface ChartData {
  timestamp: number;
  time: string;
  price: number;
  volume: number;
}

export interface ChartPoint {
  time: number;
  value: number;
}

export interface ChartAPIResponse {
  data: ChartPoint[];
}

export interface GasPrice {
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
}

export interface GasPriceData {
  baseFee: string;
  low: GasPrice;
  medium: GasPrice;
  high: GasPrice;
  instant: GasPrice;
}