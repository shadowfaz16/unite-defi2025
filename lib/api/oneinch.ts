import axios from 'axios';
import { ONEINCH_API_BASE, ONEINCH_API_KEY } from '../constants';
import type { Token, TokenBalance, PriceData, SwapQuote, ApiResponse, GasPriceData, ChartAPIResponse, ChartData, TransactionHistoryResponse, GetLimitOrdersV4Response, OrderBookData } from '../types';

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
      console.log('API Key available:', !!ONEINCH_API_KEY);
      console.log('API Base URL:', ONEINCH_API_BASE);
      
      // Use the exact same approach that worked in our test
      const url = `${ONEINCH_API_BASE}/gas-price/v1.6/${chainId}`;
      const config = {
        headers: {
          Authorization: `Bearer ${ONEINCH_API_KEY}`,
        },
        params: {},
        paramsSerializer: {
          indexes: null,
        },
      };

      console.log('Making request to:', url);
      console.log('Request config:', { ...config, headers: { ...config.headers, Authorization: '[REDACTED]' } });
      
      const response = await axios.get(url, config);
      
      console.log('✅ Gas price response received:', response.data);
      
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
      console.error('❌ Error fetching gas prices:', error);
      console.error('Error details:');
      console.error('- Message:', error.message);
      console.error('- Code:', error.code);
      
      if (error.response) {
        console.error('- Response status:', error.response.status);
        console.error('- Response headers:', error.response.headers);
        console.error('- Response data:', error.response.data);
      } else if (error.request) {
        console.error('- Request was made but no response received');
        console.error('- Request details:', error.request);
      }
      
      let errorMessage = error.message;
      if (error.response?.status === 401) {
        errorMessage = 'API Authentication failed - please check API key';
      } else if (error.response?.status === 403) {
        errorMessage = 'API Access forbidden - please check permissions';
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('CORS')) {
        errorMessage = 'Network error - please check your connection';
      }
      
      return { success: false, data: {} as GasPriceData, error: errorMessage };
    }
  }

  // Charts API - Get historical price data
  static async getChartData(
    token0: string,
    token1: string,
    period: '24H' | '1W' | '1M' | '1Y' | 'AllTime',
    chainId: number = 1
  ): Promise<ApiResponse<ChartData[]>> {
    try {
      console.log(`Fetching chart data for ${token0}/${token1} period ${period} on chain ${chainId}...`);
      console.log('API Key available:', !!ONEINCH_API_KEY);
      console.log('API Base URL:', ONEINCH_API_BASE);
      
      // Use the same proxy approach as gas price API
      const url = `${ONEINCH_API_BASE}/charts/v1.0/chart/line/${token0}/${token1}/${period}/${chainId}`;
      const config = {
        headers: {
          Authorization: `Bearer ${ONEINCH_API_KEY}`,
        },
        params: {},
        paramsSerializer: {
          indexes: null,
        },
      };

      console.log('Making request to:', url);
      console.log('Request config:', { ...config, headers: { ...config.headers, Authorization: '[REDACTED]' } });
      
      const response = await axios.get(url, config);
      
      console.log('✅ Chart data response received:', response.data);
      
      // Transform the API response to match our ChartData interface
      const chartData: ChartData[] = response.data.data.map((point: any, index: number) => ({
        timestamp: point.time * 1000, // Convert to milliseconds
        time: new Date(point.time * 1000).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          month: 'short',
          day: 'numeric'
        }),
        price: point.value,
        volume: Math.random() * 1000000 + 500000 // Mock volume data since API doesn't provide it
      }));

      return { success: true, data: chartData };
    } catch (error: any) {
      console.error('❌ Error fetching chart data:', error);
      console.error('Error details:');
      console.error('- Message:', error.message);
      console.error('- Code:', error.code);
      
      if (error.response) {
        console.error('- Response status:', error.response.status);
        console.error('- Response headers:', error.response.headers);
        console.error('- Response data:', error.response.data);
      }
      
      let errorMessage = error.message;
      if (error.response?.status === 401) {
        errorMessage = 'API Authentication failed - please check API key';
      } else if (error.response?.status === 403) {
        errorMessage = 'API Access forbidden - please check permissions';
      } else if (error.response?.status === 404) {
        errorMessage = 'Chart data not found for this token pair';
      }
      
      return { success: false, data: [], error: errorMessage };
    }
  }

  // Transaction History API - Get wallet transaction history
  static async getTransactionHistory(
    address: string,
    chainId: number = 1,
    limit: number = 10
  ): Promise<ApiResponse<TransactionHistoryResponse>> {
    try {
      console.log(`Fetching transaction history for ${address} on chain ${chainId}...`);
      console.log('API Key available:', !!ONEINCH_API_KEY);
      console.log('API Base URL:', ONEINCH_API_BASE);
      
      // Use the same proxy approach as gas price and chart APIs
      const url = `${ONEINCH_API_BASE}/history/v2.0/history/${address}/events`;
      const config = {
        headers: {
          Authorization: `Bearer ${ONEINCH_API_KEY}`,
        },
        params: {
          limit: limit,
          chainId: chainId,
        },
        paramsSerializer: {
          indexes: null,
        },
      };

      console.log('Making request to:', url);
      console.log('Request config:', { ...config, headers: { ...config.headers, Authorization: '[REDACTED]' } });
      
      const response = await axios.get(url, config);
      
      console.log('✅ Transaction history response received:', response.data);
      
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('❌ Error fetching transaction history:', error);
      console.error('Error details:');
      console.error('- Message:', error.message);
      console.error('- Code:', error.code);
      
      if (error.response) {
        console.error('- Response status:', error.response.status);
        console.error('- Response headers:', error.response.headers);
        console.error('- Response data:', error.response.data);
      }
      
      let errorMessage = error.message;
      if (error.response?.status === 401) {
        errorMessage = 'API Authentication failed - please check API key';
      } else if (error.response?.status === 403) {
        errorMessage = 'API Access forbidden - please check permissions';
      } else if (error.response?.status === 404) {
        errorMessage = 'Transaction history not found for this address';
      }
      
      return { success: false, data: { items: [], cache_counter: 0 }, error: errorMessage };
    }
  }

  // Orderbook API - Get limit orders for a token pair
  static async getOrderBook(
    chainId: number,
    makerAsset: string,
    takerAsset: string,
    limit: number = 20
  ): Promise<ApiResponse<OrderBookData>> {
    try {
      console.log(`Fetching orderbook for ${makerAsset}/${takerAsset} on chain ${chainId}...`);
      console.log('API Key available:', !!ONEINCH_API_KEY);
      console.log('API Base URL:', ONEINCH_API_BASE);
      
      // Use the same proxy approach as other APIs
      const url = `${ONEINCH_API_BASE}/orderbook/v4.0/${chainId}/all`;
      
      // Fetch buy orders: people offering takerAsset (USDT) to get makerAsset (WETH)
      const buyConfig = {
        headers: {
          Authorization: `Bearer ${ONEINCH_API_KEY}`,
        },
        params: {
          page: 1,
          limit: limit,
          statuses: '1,2,3',
          sortBy: 'createDateTime',
          makerAsset: takerAsset, // USDT - what they're offering
          takerAsset: makerAsset, // WETH - what they want
        },
        paramsSerializer: {
          indexes: null,
        },
      };

      // Fetch sell orders: people offering makerAsset (WETH) to get takerAsset (USDT) 
      const sellConfig = {
        headers: {
          Authorization: `Bearer ${ONEINCH_API_KEY}`,
        },
        params: {
          page: 1,
          limit: limit,
          statuses: '1,2,3',
          sortBy: 'createDateTime',
          makerAsset: makerAsset, // WETH - what they're offering
          takerAsset: takerAsset, // USDT - what they want
        },
        paramsSerializer: {
          indexes: null,
        },
      };

      console.log('Making requests to:', url);
      console.log('Buy config:', { ...buyConfig, headers: { ...buyConfig.headers, Authorization: '[REDACTED]' } });
      console.log('Sell config:', { ...sellConfig, headers: { ...sellConfig.headers, Authorization: '[REDACTED]' } });
      
      // Fetch both buy and sell orders in parallel
      const [buyResponse, sellResponse] = await Promise.all([
        axios.get(url, buyConfig),
        axios.get(url, sellConfig)
      ]);
      
      console.log('✅ Orderbook responses received');
      console.log('Buy orders:', buyResponse.data.length);
      console.log('Sell orders:', sellResponse.data.length);
      
      const orderBookData: OrderBookData = {
        buy: buyResponse.data || [],
        sell: sellResponse.data || []
      };

      return { success: true, data: orderBookData };
    } catch (error: any) {
      console.error('❌ Error fetching orderbook:', error);
      console.error('Error details:');
      console.error('- Message:', error.message);
      console.error('- Code:', error.code);
      
      if (error.response) {
        console.error('- Response status:', error.response.status);
        console.error('- Response headers:', error.response.headers);
        console.error('- Response data:', error.response.data);
      }
      
      let errorMessage = error.message;
      if (error.response?.status === 401) {
        errorMessage = 'API Authentication failed - please check API key';
      } else if (error.response?.status === 403) {
        errorMessage = 'API Access forbidden - please check permissions';
      } else if (error.response?.status === 404) {
        errorMessage = 'Orderbook data not found for this token pair';
      }
      
      return { success: false, data: { buy: [], sell: [] }, error: errorMessage };
    }
  }
}