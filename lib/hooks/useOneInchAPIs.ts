import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OneInchAPI } from '../api/oneinch';
import type { TokenBalance, PriceData, SwapQuote, ApiResponse } from '../types';

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

// Hook for portfolio analytics
export function usePortfolioAnalytics(chainId: number, address: string | undefined) {
  const { data: balances } = useWalletBalances(chainId, address);
  const { data: history } = usePortfolioHistory(chainId, address, '7d');

  return useQuery({
    queryKey: ['portfolioAnalytics', chainId, address, balances, history],
    queryFn: async () => {
      if (!balances?.success || !history?.success) {
        return null;
      }

      const totalValue = balances.data.reduce((sum, balance) => sum + balance.balanceUSD, 0);
      
      // Calculate 24h, 7d changes (mock calculation for demo)
      const pnl24h = totalValue * 0.02; // 2% gain
      const pnl7d = totalValue * 0.05; // 5% gain
      const pnl30d = totalValue * 0.12; // 12% gain

      return {
        totalValueUSD: totalValue,
        balances: balances.data,
        pnl24h,
        pnl7d,
        pnl30d,
        topPerformingAsset: balances.data[0]?.token.symbol || 'N/A',
        diversificationScore: Math.min(balances.data.length * 20, 100) // Mock score
      };
    },
    enabled: !!balances?.success && !!history?.success,
    staleTime: 30000,
  });
}

// Hook for cross-chain data aggregation
export function useCrossChainPortfolio(
  address: string | undefined,
  chains: number[] = [1, 137, 56, 43114] // Ethereum, Polygon, BSC, Avalanche
) {
  return useQuery({
    queryKey: ['crossChainPortfolio', address, chains],
    queryFn: async () => {
      if (!address) return null;

      const chainPromises = chains.map(chainId =>
        OneInchAPI.getWalletBalances(chainId, address)
      );
      
      const results = await Promise.all(chainPromises);
      
      let totalValueUSD = 0;
      const balancesByChain: Record<number, TokenBalance[]> = {};
      
      results.forEach((result, index) => {
        const chainId = chains[index];
        if (result.success) {
          balancesByChain[chainId] = result.data;
          totalValueUSD += result.data.reduce((sum, balance) => sum + balance.balanceUSD, 0);
        }
      });

      return {
        totalValueUSD,
        balancesByChain,
        chainCount: Object.keys(balancesByChain).length,
        topChainByValue: Object.entries(balancesByChain)
          .sort(([,a], [,b]) => 
            b.reduce((sum, balance) => sum + balance.balanceUSD, 0) - 
            a.reduce((sum, balance) => sum + balance.balanceUSD, 0)
          )[0]?.[0] || '1'
      };
    },
    enabled: !!address,
    staleTime: 60000, // Cross-chain data updates less frequently
    refetchInterval: 60000,
  });
}