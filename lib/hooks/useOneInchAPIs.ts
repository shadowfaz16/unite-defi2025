import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OneInchAPI } from '../api/oneinch';
import type { TokenBalance, PriceData, TransactionHistoryResponse, OrderBookData } from '../types';

// Custom hook for wallet balances
export function useWalletBalances(chainId: number, address: string | undefined) {
  return useQuery({
    queryKey: ['balances', chainId, address],
    queryFn: () => OneInchAPI.getWalletBalances(chainId, address!),
    enabled: !!address && !!chainId,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 20000, // Consider data stale after 20 seconds
  });
}

// Custom hook for token prices
export function useTokenPrice(chainId: number, tokenAddress: string | undefined) {
  return useQuery({
    queryKey: ['tokenPrice', chainId, tokenAddress],
    queryFn: () => OneInchAPI.getTokenPrice(chainId, tokenAddress!),
    enabled: !!tokenAddress && !!chainId,
    refetchInterval: 10000, // Refetch every 10 seconds for prices
    staleTime: 5000, // Prices become stale quickly
  });
}

// Custom hook for multiple token prices
export function useTokenPrices(chainId: number, tokenAddresses: string[]) {
  return useQuery({
    queryKey: ['tokenPrices', chainId, tokenAddresses],
    queryFn: async () => {
      const pricePromises = tokenAddresses.map(address => 
        OneInchAPI.getTokenPrice(chainId, address)
      );
      const results = await Promise.all(pricePromises);
      return results.reduce((acc, result, index) => {
        if (result.success) {
          acc[tokenAddresses[index]] = result.data;
        }
        return acc;
      }, {} as Record<string, PriceData>);
    },
    enabled: tokenAddresses.length > 0 && !!chainId,
    refetchInterval: 15000,
    staleTime: 10000,
  });
}

// Custom hook for token metadata
export function useTokenInfo(chainId: number, tokenAddress: string | undefined) {
  return useQuery({
    queryKey: ['tokenInfo', chainId, tokenAddress],
    queryFn: () => OneInchAPI.getTokenInfo(chainId, tokenAddress!),
    enabled: !!tokenAddress && !!chainId,
    staleTime: 5 * 60 * 1000, // Token info is stable for 5 minutes
  });
}

// Custom hook for swap quotes
export function useSwapQuote(
  chainId: number,
  fromToken: string | undefined,
  toToken: string | undefined,
  amount: string | undefined,
  fromAddress: string | undefined
) {
  return useQuery({
    queryKey: ['swapQuote', chainId, fromToken, toToken, amount, fromAddress],
    queryFn: () => OneInchAPI.getSwapQuote(chainId, fromToken!, toToken!, amount!, fromAddress!),
    enabled: !!(fromToken && toToken && amount && fromAddress && chainId),
    refetchInterval: 15000, // Quotes update frequently
    staleTime: 10000,
  });
}

// Custom hook for portfolio history
export function usePortfolioHistory(
  chainId: number,
  address: string | undefined,
  timeframe: string = '1d'
) {
  return useQuery({
    queryKey: ['portfolioHistory', chainId, address, timeframe],
    queryFn: () => OneInchAPI.getPortfolioHistory(chainId, address!, timeframe),
    enabled: !!address && !!chainId,
    staleTime: 60000, // Portfolio history is stable for 1 minute
  });
}

// Mutation hook for creating Fusion orders
export function useFusionOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chainId,
      fromToken,
      toToken,
      amount,
      fromAddress
    }: {
      chainId: number;
      fromToken: string;
      toToken: string;
      amount: string;
      fromAddress: string;
    }) => OneInchAPI.createFusionOrder(chainId, fromToken, toToken, amount, fromAddress),
    
    onSuccess: () => {
      // Invalidate relevant queries after successful order creation
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['portfolioHistory'] });
    },
  });
}

// Mutation hook for broadcasting transactions
export function useBroadcastTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chainId,
      signedTx
    }: {
      chainId: number;
      signedTx: string;
    }) => OneInchAPI.broadcastTransaction(chainId, signedTx),
    
    onSuccess: () => {
      // Invalidate balances and portfolio after transaction
      queryClient.invalidateQueries({ queryKey: ['balances'] });
      queryClient.invalidateQueries({ queryKey: ['portfolioHistory'] });
    },
  });
}

// Hook for real-time price updates with WebSocket-like behavior
export function useRealTimePrices(tokenPairs: Array<{ chainId: number; address: string }>) {
  return useQuery({
    queryKey: ['realTimePrices', tokenPairs],
    queryFn: async () => {
      const pricePromises = tokenPairs.map(({ chainId, address }) =>
        OneInchAPI.getTokenPrice(chainId, address)
      );
      const results = await Promise.all(pricePromises);
      
      return tokenPairs.reduce((acc, pair, index) => {
        const key = `${pair.chainId}-${pair.address}`;
        if (results[index].success) {
          acc[key] = results[index].data;
        }
        return acc;
      }, {} as Record<string, PriceData>);
    },
    enabled: tokenPairs.length > 0,
    refetchInterval: 5000, // Very frequent updates for real-time feel
    staleTime: 3000,
  });
}

// Hook for portfolio analytics using Portfolio API
export function usePortfolioAnalytics(chainId: number, address: string | undefined) {
  const { data: balances } = useWalletBalances(chainId, address);
  const { data: portfolioValue } = usePortfolioValue(address, [chainId]);

  return useQuery({
    queryKey: ['portfolioAnalytics', chainId, address, balances, portfolioValue],
    queryFn: async () => {
      if (!address) return null;

      // Use Portfolio API data for accurate totals
      const totalValue = portfolioValue?.data?.total || 0;
      
      // Calculate 24h, 7d changes (using mock calculation for demo)
      const pnl24h = totalValue * 0.02; // 2% gain - in production you'd use historical data
      const pnl7d = totalValue * 0.05; // 5% gain
      const pnl30d = totalValue * 0.12; // 12% gain

      return {
        totalValueUSD: totalValue,
        balances: balances?.data || [],
        pnl24h,
        pnl7d,
        pnl30d,
        topPerformingAsset: balances?.data?.[0]?.token.symbol || 'N/A',
        diversificationScore: Math.min((balances?.data?.length || 0) * 20, 100) // Mock score
      };
    },
    enabled: !!address,
    staleTime: 30000,
  });
}

// Hook for portfolio value using Portfolio API
export function usePortfolioValue(address: string | undefined, chainIds: number[] = [1]) {
  return useQuery({
    queryKey: ['portfolioValue', address, chainIds],
    queryFn: () => OneInchAPI.getPortfolioValue(address!, chainIds),
    enabled: !!address,
    refetchInterval: 30000,
    staleTime: 20000,
  });
}

// Hook for cross-chain data aggregation using Portfolio API
export function useCrossChainPortfolio(
  address: string | undefined,
  chains: number[] = [1, 137, 56, 43114] // Ethereum, Polygon, BSC, Avalanche
) {
  return useQuery({
    queryKey: ['crossChainPortfolio', address, chains],
    queryFn: async () => {
      if (!address) return null;

      // Fetch portfolio values for each chain using Portfolio API
      const portfolioPromises = chains.map(chainId =>
        OneInchAPI.getPortfolioValue(address, [chainId])
      );
      
      // Also fetch individual token data for display
      const balancePromises = chains.map(chainId =>
        OneInchAPI.getWalletBalances(chainId, address)
      );
      
      const [portfolioResults, balanceResults] = await Promise.all([
        Promise.all(portfolioPromises),
        Promise.all(balancePromises)
      ]);
      
      let totalValueUSD = 0;
      const balancesByChain: Record<number, TokenBalance[]> = {};
      const valuesByChain: Record<number, number> = {};
      
      portfolioResults.forEach((result, index) => {
        const chainId = chains[index];
        if (result.success && result.data) {
          const chainValue = result.data.total || 0;
          valuesByChain[chainId] = chainValue;
          totalValueUSD += chainValue;
        }
      });

      balanceResults.forEach((result, index) => {
        const chainId = chains[index];
        if (result.success) {
          balancesByChain[chainId] = result.data;
        }
      });

      // Filter out chains with no value
      const activeChains = Object.entries(valuesByChain)
        .filter(([_, value]) => value > 0)
        .map(([chainId, _]) => parseInt(chainId));

      return {
        totalValueUSD,
        balancesByChain,
        valuesByChain,
        chainCount: activeChains.length,
        topChainByValue: Object.entries(valuesByChain)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || '1'
      };
    },
    enabled: !!address,
    staleTime: 60000, // Cross-chain data updates less frequently
    refetchInterval: 60000,
  });
}

// Hook for transaction history
export function useTransactionHistory(
  address: string | undefined,
  chainId: number = 1,
  limit: number = 10
) {
  return useQuery({
    queryKey: ['transactionHistory', address, chainId, limit],
    queryFn: () => OneInchAPI.getTransactionHistory(address!, chainId, limit),
    enabled: !!address,
    staleTime: 30000, // Transaction history is relatively stable
    refetchInterval: 60000, // Refetch every minute for new transactions
  });
}

// Hook for orderbook data
export function useOrderBook(
  chainId: number,
  makerAsset: string | undefined,
  takerAsset: string | undefined,
  limit: number = 20
) {
  return useQuery({
    queryKey: ['orderbook', chainId, makerAsset, takerAsset, limit],
    queryFn: () => OneInchAPI.getOrderBook(chainId, makerAsset!, takerAsset!, limit),
    enabled: !!(makerAsset && takerAsset),
    staleTime: 10000, // Orderbook data updates frequently
    refetchInterval: 15000, // Refetch every 15 seconds for live feel
  });
}

// Hook for user limit orders with fallback separation
export function useUserLimitOrders(
  chainId: number,
  address: string | undefined,
  page: number = 1,
  limit: number = 10,
  statuses: string = '1,2,3'
) {
  // Fallback wallet for demo purposes
  const FALLBACK_WALLET = '0xfff94f585f6d0640c2284ba82159909c694ae2d7';
  
  return useQuery({
    queryKey: ['userLimitOrders', chainId, address, page, limit, statuses],
    queryFn: async () => {
      const result = {
        success: true,
        userOrders: [] as any[],
        fallbackOrders: [] as any[],
        isUsingFallback: false,
        error: null as string | null
      };

      // Always fetch fallback orders for demo
      try {
        const fallbackResponse = await OneInchAPI.getUserLimitOrders(chainId, FALLBACK_WALLET, page, limit, statuses);
        if (fallbackResponse.success) {
          result.fallbackOrders = fallbackResponse.data;
        }
      } catch (error) {
        console.warn('Failed to fetch fallback orders:', error);
      }

      // Fetch user orders if address is provided
      if (address && address !== FALLBACK_WALLET) {
        try {
          const userResponse = await OneInchAPI.getUserLimitOrders(chainId, address, page, limit, statuses);
          if (userResponse.success) {
            result.userOrders = userResponse.data;
          } else {
            result.error = userResponse.error || 'Failed to fetch user orders';
          }
        } catch (error) {
          console.warn('Failed to fetch user orders:', error);
          result.error = String(error);
        }
      }

      // Determine if we're primarily using fallback
      result.isUsingFallback = !address || result.userOrders.length === 0;

      return result;
    },
    enabled: !!chainId,
    staleTime: 30000, // User orders are relatively stable
    refetchInterval: 60000, // Refetch every minute for status updates
  });
}