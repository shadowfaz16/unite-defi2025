import axios from 'axios';
import { ONEINCH_API_BASE, ONEINCH_API_KEY } from '../constants';
import type { Token, TokenBalance, PriceData, SwapQuote, ApiResponse, GasPriceData } from '../types';

const api = axios.create({
  baseURL: ONEINCH_API_BASE,
  headers: {
    'Authorization': `Bearer ${ONEINCH_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

export class OneInchAPI {
  
  // Balance API - Get wallet balances
  static async getWalletBalances(chainId: number, address: string): Promise<ApiResponse<TokenBalance[]>> {
    try {
      const response = await api.get(`/balance/v1.2/${chainId}/balances/${address}`);
      
      const balances: TokenBalance[] = Object.entries(response.data).map(([tokenAddress, data]: [string, any]) => ({
        token: {
          address: tokenAddress,
          symbol: data.symbol,
          name: data.name,
          decimals: data.decimals,
          logoURI: data.logoURI
        },
        balance: data.balance,
        balanceUSD: parseFloat(data.balanceUSD || '0')
      }));

      return { success: true, data: balances };
    } catch (error: any) {
      return { success: false, data: [], error: error.message };
    }
  }

  // Spot Price API - Get token prices
  static async getTokenPrice(chainId: number, tokenAddress: string): Promise<ApiResponse<PriceData>> {
    try {
      const response = await api.get(`/price/v1.1/${chainId}/${tokenAddress}`);
      
      const priceData: PriceData = {
        token: tokenAddress,
        price: parseFloat(response.data.price),
        priceUSD: parseFloat(response.data.priceUSD || response.data.price),
        timestamp: Date.now()
      };

      return { success: true, data: priceData };
    } catch (error: any) {
      return { success: false, data: {} as PriceData, error: error.message };
    }
  }

  // Token API - Get token metadata
  static async getTokenInfo(chainId: number, tokenAddress: string): Promise<ApiResponse<Token>> {
    try {
      const response = await api.get(`/token/v1.2/${chainId}/${tokenAddress}`);
      
      const token: Token = {
        address: response.data.address,
        symbol: response.data.symbol,
        name: response.data.name,
        decimals: response.data.decimals,
        logoURI: response.data.logoURI
      };

      return { success: true, data: token };
    } catch (error: any) {
      return { success: false, data: {} as Token, error: error.message };
    }
  }

  // Swap API - Get swap quote
  static async getSwapQuote(
    chainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    fromAddress: string
  ): Promise<ApiResponse<SwapQuote>> {
    try {
      const params = new URLSearchParams({
        src: fromTokenAddress,
        dst: toTokenAddress,
        amount: amount,
        from: fromAddress,
        slippage: '1', // 1% slippage
        disableEstimate: 'false'
      });

      const response = await api.get(`/swap/v6.0/${chainId}/quote?${params}`);
      
      const quote: SwapQuote = {
        fromToken: response.data.fromToken,
        toToken: response.data.toToken,
        fromAmount: response.data.fromAmount,
        toAmount: response.data.toAmount,
        estimatedGas: response.data.estimatedGas,
        protocols: response.data.protocols
      };

      return { success: true, data: quote };
    } catch (error: any) {
      return { success: false, data: {} as SwapQuote, error: error.message };
    }
  }

  // Fusion API - Create fusion order
  static async createFusionOrder(
    chainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    fromAddress: string
  ): Promise<ApiResponse<any>> {
    try {
      const body = {
        src: fromTokenAddress,
        dst: toTokenAddress,
        amount: amount,
        from: fromAddress,
        enableEstimate: true
      };

      const response = await api.post(`/fusion/v1.0/${chainId}/orders`, body);
      
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  }

  // Portfolio API - Get portfolio history
  static async getPortfolioHistory(chainId: number, address: string, timeframe: string = '1d'): Promise<ApiResponse<any>> {
    try {
      const response = await api.get(`/portfolio/v4/${chainId}/${address}/history?timeframe=${timeframe}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, data: null, error: error.message };
    }
  }

  // Transaction Gateway API - Broadcast transaction
  static async broadcastTransaction(chainId: number, signedTx: string): Promise<ApiResponse<string>> {
    try {
      const response = await api.post(`/tx-gateway/v1.1/${chainId}/broadcast`, {
        rawTransaction: signedTx
      });
      
      return { success: true, data: response.data.transactionHash };
    } catch (error: any) {
      return { success: false, data: '', error: error.message };
    }
  }

  // Gas Price API - Get current gas prices
  static async getGasPrice(chainId: number): Promise<ApiResponse<GasPriceData>> {
    try {
      console.log(`Fetching gas prices for chain ${chainId}...`);
      const response = await api.get(`/gas-price/v1.6/${chainId}`);
      
      console.log('Gas price response:', response.data);
      
      const gasData: GasPriceData = {
        baseFee: response.data.baseFee,
        low: {
          maxPriorityFeePerGas: response.data.low.maxPriorityFeePerGas,
          maxFeePerGas: response.data.low.maxFeePerGas
        },
        medium: {
          maxPriorityFeePerGas: response.data.medium.maxPriorityFeePerGas,
          maxFeePerGas: response.data.medium.maxFeePerGas
        },
        high: {
          maxPriorityFeePerGas: response.data.high.maxPriorityFeePerGas,
          maxFeePerGas: response.data.high.maxFeePerGas
        },
        instant: {
          maxPriorityFeePerGas: response.data.instant.maxPriorityFeePerGas,
          maxFeePerGas: response.data.instant.maxFeePerGas
        }
      };

      return { success: true, data: gasData };
    } catch (error: any) {
      console.error('Error fetching gas prices:', error);
      return { success: false, data: {} as GasPriceData, error: error.message };
    }
  }
}