'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useUserLimitOrders } from '../lib/hooks/useOneInchAPIs';
import { useWeb3 } from '../lib/hooks/useWeb3';
import { LimitOrder, TWAPOrder, DCAOrder, GetLimitOrdersV4Response } from '../lib/types';

// Extended order type with strategy type
interface CustomOrder extends Partial<LimitOrder & TWAPOrder & DCAOrder> {
  type: 'TWAP' | 'DCA' | 'OPTIONS' | 'CL';
}

export function OrderBook() {
  const { address } = useWeb3();
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  
  // Fetch real limit orders from 1inch API
  const { 
    data: limitOrdersResponse, 
    isLoading: isLoadingOrders, 
    error: ordersError,
    refetch: refetchOrders 
  } = useUserLimitOrders(1, address); // Ethereum mainnet

  useEffect(() => {
    // Load custom orders from localStorage
    const loadCustomOrders = () => {
      const twapOrders = JSON.parse(localStorage.getItem('custom_twap_orders') || '[]');
      const dcaOrders = JSON.parse(localStorage.getItem('custom_dca_orders') || '[]');
      const optionsOrders = JSON.parse(localStorage.getItem('custom_options_orders') || '[]');
      const clOrders = JSON.parse(localStorage.getItem('custom_cl_orders') || '[]');
      const gridOrders = JSON.parse(localStorage.getItem('custom_orders_grid_buy') || '[]');
      const arbitrageOrders = JSON.parse(localStorage.getItem('custom_orders_arbitrage_buy') || '[]');
      
      const allOrders: CustomOrder[] = [
        ...twapOrders.map((o: unknown) => ({ ...o as TWAPOrder, type: 'TWAP' as const })),
        ...dcaOrders.map((o: unknown) => ({ ...o as DCAOrder, type: 'DCA' as const })),
        ...optionsOrders.map((o: unknown) => ({ ...o as LimitOrder, type: 'OPTIONS' as const })),
        ...clOrders.map((o: unknown) => ({ ...o as LimitOrder, type: 'CL' as const }))
      ];
      
      console.log('OrderBook: Loaded orders from localStorage:');
      console.log('  - TWAP orders:', twapOrders.length);
      console.log('  - DCA orders:', dcaOrders.length);
      console.log('  - Options orders:', optionsOrders.length);
      console.log('  - CL orders:', clOrders.length);
      console.log('  - Total custom orders:', allOrders.length);
      
      setCustomOrders(allOrders);
    };

    loadCustomOrders();
    
    // Set up interval to refresh orders
    const interval = setInterval(loadCustomOrders, 5000);
    
    // Add debugging
    console.log('OrderBook: Loading custom orders...');
    console.log('OrderBook: Current custom orders:', customOrders.length);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900';
      case 'filled': return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'cancelled': return 'text-red-600 bg-red-100 dark:bg-red-900';
      case 'expired': return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    }
  };

  const formatTimestamp = (timestamp: number | string) => {
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleString();
    }
    return new Date(timestamp).toLocaleString();
  };

  // Helper function to get order status from 1inch data
  const getOrderStatus = (order: GetLimitOrdersV4Response) => {
    if (order.orderInvalidReason) {
      if (order.orderInvalidReason.includes('cancelled')) return 'cancelled';
      if (order.orderInvalidReason.includes('expired')) return 'expired';
      return 'invalid';
    }
    
    const remaining = BigInt(order.remainingMakerAmount);
    const total = BigInt(order.data.makingAmount);
    
    if (remaining === BigInt(0)) return 'filled';
    if (remaining < total) return 'partially_filled';
    return 'active';
  };

  // Get token info including symbol and decimals
  const getTokenInfo = (address: string) => {
    const tokenMap: Record<string, { symbol: string; decimals: number }> = {
      // Stablecoins
      '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: 'USDT', decimals: 6 },
      '0xa0b86a33e6996051cb9a4c3e47e63b0b0e4f3c1a': { symbol: 'USDC', decimals: 6 },
      '0x6b175474e89094c44da98b954eedeac495271d0f': { symbol: 'DAI', decimals: 18 },
      '0x4fabb145d64652a948d72533023f6e7a623c7c53': { symbol: 'BUSD', decimals: 18 },
      '0x853d955acef822db058eb8505911ed77f175b99e': { symbol: 'FRAX', decimals: 18 },
      
      // Major tokens
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { symbol: 'WETH', decimals: 18 },
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': { symbol: 'WBTC', decimals: 8 },
      '0x111111111117dc0aa78b770fa6a738034120c302': { symbol: '1INCH', decimals: 18 },
      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': { symbol: 'UNI', decimals: 18 },
      '0x514910771af9ca656af840dff83e8264ecf986ca': { symbol: 'LINK', decimals: 18 },
      '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0': { symbol: 'MATIC', decimals: 18 },
      '0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b': { symbol: 'CRO', decimals: 8 },
      '0xae7ab96520de3a18e5e111b5eaab095312d7fe84': { symbol: 'stETH', decimals: 18 },
      
      // DeFi tokens
      '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': { symbol: 'AAVE', decimals: 18 },
      '0xc00e94cb662c3520282e6f5717214004a7f26888': { symbol: 'COMP', decimals: 18 },
      '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2': { symbol: 'MKR', decimals: 18 },
      '0x6f259637dcd74c767781e37bc6133cd6a68aa161': { symbol: 'HT', decimals: 18 },
      '0xa3bed4e1c75d00fa6f4e5e6922db7261b5e9acd2': { symbol: 'MTA', decimals: 18 },
      '0xd533a949740bb3306d119cc777fa900ba034cd52': { symbol: 'CRV', decimals: 18 },
      
      // ETH variations
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': { symbol: 'ETH', decimals: 18 },
      '0x0000000000000000000000000000000000000000': { symbol: 'ETH', decimals: 18 },
    };
    
    const normalized = address.toLowerCase();
    return tokenMap[normalized] || { 
      symbol: `${address.slice(0, 6)}...${address.slice(-4)}`, 
      decimals: 18 
    };
  };

  // Get token symbols from addresses (simplified mapping)
  const getTokenSymbol = (address: string) => {
    return getTokenInfo(address).symbol;
  };

  // Helper function to format token amounts with correct decimals
  const formatTokenAmount = (amount: string, tokenAddress: string) => {
    try {
      const { decimals } = getTokenInfo(tokenAddress);
      const value = BigInt(amount);
      const divisor = BigInt(10) ** BigInt(decimals);
      const result = Number(value) / Number(divisor);
      
      if (result === 0) return '0.00';
      
      // Format large numbers with K/M suffixes instead of scientific notation
      if (result >= 1000000) {
        return `${(result / 1000000).toFixed(2)}M`;
      } else if (result >= 1000) {
        return `${(result / 1000).toFixed(2)}K`;
      } else if (result >= 1) {
        return result.toLocaleString('en-US', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 4 
        });
      } else if (result >= 0.01) {
        return result.toFixed(4);
      } else if (result >= 0.000001) {
        return result.toFixed(6);
      } else {
        return result.toExponential(2);
      }
    } catch (e) {
      console.error('Error formatting amount:', e, { amount, tokenAddress });
      return 'N/A';
    }
  };

  const userOrders = limitOrdersResponse?.userOrders || [];
  const fallbackOrders = limitOrdersResponse?.fallbackOrders || [];
  const isUsingFallback = limitOrdersResponse?.isUsingFallback || false;

  // Helper function to render order rows
  const renderOrderRow = (order: GetLimitOrdersV4Response, key: string) => {
    const status = getOrderStatus(order);
    const makerSymbol = getTokenSymbol(order.data.makerAsset);
    const takerSymbol = getTokenSymbol(order.data.takerAsset);
    
    return (
      <div 
        key={key} 
        className="grid grid-cols-6 gap-4 text-sm py-3 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div className="font-mono text-xs">
          {makerSymbol}/{takerSymbol}
        </div>
        <div>
          <Badge variant={makerSymbol === 'USDT' || makerSymbol === 'USDC' ? 'default' : 'secondary'}>
            {makerSymbol === 'USDT' || makerSymbol === 'USDC' ? 'BUY' : 'SELL'}
          </Badge>
        </div>
        <div className="font-mono text-xs">
          {formatTokenAmount(order.remainingMakerAmount, order.data.makerAsset)} {makerSymbol}
        </div>
        <div className="font-mono text-xs">
          {formatTokenAmount(order.data.takingAmount, order.data.takerAsset)} {takerSymbol}
        </div>
        <div>
          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
            status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
            status === 'filled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
            status === 'partially_filled' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
            status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
            'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          }`}>
            {status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {formatTimestamp(order.createDateTime)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* User's Live Limit Orders */}
      {address && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span>👤</span>
                <span>Your Limit Orders</span>
              </span>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">
                  {userOrders.length} orders
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-500">Your Wallet</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? (
              <div className="text-center py-8">
                <div className="text-2xl mb-2">⏳</div>
                <p>Loading your orders...</p>
              </div>
            ) : ordersError ? (
              <div className="text-center py-8 text-red-500">
                <div className="text-2xl mb-2">❌</div>
                <p>Error loading your orders</p>
                <p className="text-sm">{String(ordersError)}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => refetchOrders()}
                >
                  Retry
                </Button>
              </div>
            ) : userOrders.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">📊</div>
                <p>No active limit orders</p>
                <p className="text-sm">Create trading strategies to see your orders here</p>
                <p className="text-xs text-gray-400 mt-2">Address: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header */}
                <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
                  <div>Pair</div>
                  <div>Type</div>
                  <div>Making Amount</div>
                  <div>Taking Amount</div>
                  <div>Status</div>
                  <div>Created</div>
                </div>

                {/* Orders */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {userOrders.map((order, index) => renderOrderRow(order, `user-${order.orderHash}-${index}`))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    Showing {userOrders.length} orders for {address?.slice(0, 6)}...{address?.slice(-4)}
                  </div>
                  <div className="space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => refetchOrders()}
                      disabled={isLoadingOrders}
                    >
                      {isLoadingOrders ? '...' : 'Refresh'}
                    </Button>
                    <Button variant="outline" size="sm">
                      Export CSV
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Demo Limit Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <span>🎯</span>
              <span>Demo Limit Orders</span>
            </span>
            <div className="flex items-center space-x-3">
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                Live Demo Data
              </Badge>
              <span className="text-sm text-gray-500">
                {fallbackOrders.length} orders
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-500">1inch API</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingOrders ? (
            <div className="text-center py-8">
              <div className="text-2xl mb-2">⏳</div>
              <p>Loading demo orders...</p>
            </div>
          ) : fallbackOrders.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">📊</div>
              <p>No demo orders available</p>
              <p className="text-sm">Demo data temporarily unavailable</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
                <div>Pair</div>
                <div>Type</div>
                <div>Making Amount</div>
                <div>Taking Amount</div>
                <div>Status</div>
                <div>Created</div>
              </div>

              {/* Orders */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {fallbackOrders.map((order, index) => renderOrderRow(order, `demo-${order.orderHash}-${index}`))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Demo data from 0xfff9...ae2d7 • Real 1inch Protocol orders
                </div>
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => refetchOrders()}
                    disabled={isLoadingOrders}
                  >
                    {isLoadingOrders ? '...' : 'Refresh'}
                  </Button>
                  <Button variant="outline" size="sm">
                    Export CSV
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Strategy Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <span>🧪</span>
              <span>Strategy Orders (Demo)</span>
            </span>
            <span className="text-sm text-gray-500">
              {customOrders.length} orders
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customOrders.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">📋</div>
              <p>No custom orders yet</p>
              <p className="text-sm">Create advanced strategies to see orders here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
                <div>Type</div>
                <div>Pair</div>
                <div>Amount</div>
                <div>Status</div>
                <div>Created</div>
              </div>

              {/* Orders */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {customOrders.map((order, index) => (
                  <div key={index} className="grid grid-cols-5 gap-4 text-sm py-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        order.type === 'TWAP' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        order.type === 'DCA' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        order.type === 'OPTIONS' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                      }`}>
                        {order.type}
                      </span>
                    </div>
                    <div className="font-mono text-xs">
                      {order.makerAsset && order.takerAsset ? 
                        `${order.makerAsset.symbol || 'Unknown'}/${order.takerAsset.symbol || 'Unknown'}` :
                        'Unknown'
                      }
                    </div>
                    <div className="font-mono text-xs">
                      {order.makingAmount ? 
                        parseFloat(order.makingAmount).toExponential(2) :
                        'N/A'
                      }
                    </div>
                    <div>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor('pending')}`}>
                        Pending
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTimestamp(order.createdAt || Date.now())}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Showing {customOrders.length} orders
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm">
                    Refresh
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}