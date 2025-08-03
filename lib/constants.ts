// 1inch API endpoints and configuration
export const ONEINCH_API_BASE = 'https://1inch-vercel-proxy-lyart.vercel.app';
export const ONEINCH_API_KEY = process.env.NEXT_PUBLIC_1INCH_API_KEY || 'sQ7qNdg4KNi4d2jjkboVZcFPl8oy0EsZ';

// Supported networks
export const SUPPORTED_NETWORKS = {
  1: 'Ethereum',
  56: 'BNB Chain',
  137: 'Polygon',
  43114: 'Avalanche',
  250: 'Fantom'
} as const;

// Token addresses for common tokens
export const TOKEN_ADDRESSES = {
  1: { // Ethereum
    USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    USDC: '0xa0b86a33e6996051cb9a4c3e47e63b0b0e4f3c1a',
    WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    ONEINCH: '0x111111111117dc0aa78b770fa6a738034120c302'
  },
  137: { // Polygon
    USDT: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    USDC: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    WMATIC: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'
  }
} as const;

// Strategy types
export const STRATEGY_TYPES = {
  TWAP: 'Time-Weighted Average Price',
  DCA: 'Dollar Cost Averaging',
  STOP_LOSS: 'Stop Loss',
  TAKE_PROFIT: 'Take Profit',
  GRID_TRADING: 'Grid Trading',
  OPTIONS_SYNTHETIC: 'Synthetic Options',
  CONCENTRATED_LIQUIDITY: 'Concentrated Liquidity'
} as const;

// Order status
export const ORDER_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  FILLED: 'filled',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
} as const;