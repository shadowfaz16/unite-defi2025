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
  signature?: string;
  orderHash?: string;
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
  currentPrice?: number;
  effectivePrice?: number;
  orderHash?: string;
}

export interface StopLossOrder extends LimitOrder {
  triggerPrice: string;
  triggerPriceUSD: number;
  currentPrice: string;
}

export interface ArbitrageMarket {
  id: string;
  name: string;
  type: 'DEX' | 'CEX' | 'LIMIT_ORDER';
  endpoint?: string;
  fee: number;
  minSize: string;
  enabled: boolean;
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

export interface TokenAction {
  chainId: string;
  address: string;
  standard: string;
  fromAddress: string;
  toAddress: string;
  tokenId?: object;
  amount: string;
  direction: 'In' | 'Out' | 'Self' | 'On';
}

export interface TransactionDetails {
  orderInBlock: number;
  txHash: string;
  chainId: number;
  blockNumber: number;
  blockTimeSec: number;
  status: string;
  type: string;
  tokenActions: TokenAction[];
  fromAddress: string;
  toAddress: string;
  nonce: number;
  feeInSmallestNative: string;
  meta?: object;
}

export interface TransactionHistoryEvent {
  id: string;
  address: string;
  type: number;
  rating: 'Reliable' | 'Scam';
  timeMs: number;
  direction?: 'in' | 'out';
  details: TransactionDetails;
  eventOrderInTransaction: number;
}

export interface TransactionHistoryResponse {
  items: TransactionHistoryEvent[];
  cache_counter: number;
}

export interface LimitOrderV4Data {
  makerAsset: string;
  takerAsset: string;
  maker: string;
  receiver?: string;
  makingAmount: string;
  takingAmount: string;
  salt: string;
  extension?: string;
  makerTraits?: string;
}

export interface GetLimitOrdersV4Response {
  signature: string;
  orderHash: string;
  createDateTime: string;
  remainingMakerAmount: string;
  makerBalance: string;
  makerAllowance: string;
  data: LimitOrderV4Data;
  makerRate: string;
  takerRate: string;
  isMakerContract: boolean;
  orderInvalidReason: string | null;
}

export interface OrderBookData {
  buy: GetLimitOrdersV4Response[];
  sell: GetLimitOrdersV4Response[];
}