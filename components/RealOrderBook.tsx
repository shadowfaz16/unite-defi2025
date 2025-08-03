'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useOrderBook, useTokenPrice } from '../lib/hooks/useOneInchAPIs';
import { GetLimitOrdersV4Response } from '../lib/types';
import { formatDistanceToNow } from 'date-fns';

interface RealOrderBookProps {
  makerAsset: string;
  takerAsset: string;
  makerSymbol: string;
  takerSymbol: string;
  chainId?: number;
}

export function RealOrderBook({ 
  makerAsset, 
  takerAsset, 
  makerSymbol, 
  takerSymbol, 
  chainId = 1 
}: RealOrderBookProps) {
  const [limit, setLimit] = useState(15);
  
  const { data: orderBookData, isLoading, error } = useOrderBook(chainId, makerAsset, takerAsset, limit);
  const { data: spotPriceData } = useTokenPrice(chainId, makerAsset); // Primary price source

  const formatAmount = (amount: string, decimals: number = 18) => {
    const value = parseFloat(amount) / Math.pow(10, decimals);
    if (value === 0) return '0';
    if (value < 0.001) return '<0.001';
    if (value < 1) return value.toFixed(4);
    if (value < 1000) return value.toFixed(2);
    if (value < 1000000) return `${(value / 1000).toFixed(1)}K`;
    return `${(value / 1000000).toFixed(1)}M`;
  };

  const calculateOrderPrice = (order: GetLimitOrdersV4Response, isSellOrder: boolean) => {
    const makingAmount = parseFloat(order.remainingMakerAmount);
    const takingAmount = parseFloat(order.data.takingAmount);
    
    if (makingAmount === 0 || takingAmount === 0) return 0;
    
    if (isSellOrder) {
      // Sell order: offering WETH for USDT
      // Price = USDT per WETH = takingAmount(USDT) / makingAmount(WETH)
      const wethAmount = makingAmount / Math.pow(10, makerDecimals); // WETH (18 decimals)
      const usdtAmount = takingAmount / Math.pow(10, takerDecimals); // USDT (6 decimals)
      const price = usdtAmount / wethAmount;
      return isNaN(price) || !isFinite(price) ? 0 : price;
    } else {
      // Buy order: offering USDT for WETH  
      // Price = USDT per WETH = makingAmount(USDT) / takingAmount(WETH)
      const usdtAmount = makingAmount / Math.pow(10, takerDecimals); // USDT (6 decimals) 
      const wethAmount = takingAmount / Math.pow(10, makerDecimals); // WETH (18 decimals)
      const price = usdtAmount / wethAmount;
      return isNaN(price) || !isFinite(price) ? 0 : price;
    }
  };

  const getDecimalsForToken = (tokenAddress: string) => {
    // Common token decimals
    const tokenDecimals: Record<string, number> = {
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 18, // WETH
      '0xdac17f958d2ee523a2206206994597c13d831ec7': 6,  // USDT
      '0xa0b86a33e6996051cb9a4c3e47e63b0b0e4f3c1a': 6,  // USDC
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 8,  // WBTC
      '0x514910771af9ca656af840dff83e8264ecf986ca': 18, // LINK
      '0x111111111117dc0aa78b770fa6a738034120c302': 18, // 1INCH
    };
    return tokenDecimals[tokenAddress.toLowerCase()] || 18;
  };

  const makerDecimals = getDecimalsForToken(makerAsset);
  const takerDecimals = getDecimalsForToken(takerAsset);

  const processOrders = (orders: GetLimitOrdersV4Response[], side: 'buy' | 'sell') => {
    return orders
      .filter(order => order.orderInvalidReason === null) // Only valid orders
      .sort((a, b) => new Date(b.createDateTime).getTime() - new Date(a.createDateTime).getTime()) // Most recent first
      .slice(0, limit / 2) // Show half of limit for each side
      .map(order => {
        const price = calculateOrderPrice(order, side === 'sell');
        
        // For display purposes:
        // Sell orders: show WETH amount being offered (makingAmount)
        // Buy orders: show WETH amount being sought (takingAmount)
        const displayAmount = side === 'sell' 
          ? formatAmount(order.remainingMakerAmount, makerDecimals) // WETH being offered
          : formatAmount(order.data.takingAmount, makerDecimals);   // WETH being sought
        
        return {
          ...order,
          displayAmount: displayAmount,
          displayPrice: price > 0 ? (price >= 1 ? price.toFixed(4) : price.toFixed(6)) : '0',
          numericPrice: price,
          timestamp: new Date(order.createDateTime).getTime()
        };
      })
      .sort((a, b) => {
        // Sort by price for display: Buy orders: highest price first, Sell orders: lowest price first
        return side === 'buy' ? b.numericPrice - a.numericPrice : a.numericPrice - b.numericPrice;
      });
  };

  const buyOrders = orderBookData?.success ? processOrders(orderBookData.data.buy, 'buy') : [];
  const sellOrders = orderBookData?.success ? processOrders(orderBookData.data.sell, 'sell') : [];

  // Calculate best bid (highest buy price) and best ask (lowest sell price)
  const bestBid = buyOrders.length > 0 ? buyOrders[0].numericPrice : 0;
  const bestAsk = sellOrders.length > 0 ? sellOrders[0].numericPrice : 0;

  // Use spot price as primary source (same as charts)
  const currentPrice = spotPriceData?.success && spotPriceData.data.priceUSD 
    ? (spotPriceData.data.priceUSD >= 1 ? spotPriceData.data.priceUSD.toFixed(4) : spotPriceData.data.priceUSD.toFixed(6))
    : '---';

  // Calculate spread from orderbook if available
  const calculatedSpread = bestBid > 0 && bestAsk > 0 && bestAsk > bestBid
    ? (bestAsk - bestBid).toFixed(6)
    : '---';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <span>📚</span>
            <span>Live Order Book ({makerSymbol}/{takerSymbol})</span>
          </span>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Spread: <span className="font-mono">{calculatedSpread}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-gray-500">Live</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">
            <div className="text-4xl mb-2">❌</div>
            <p>Failed to load orderbook</p>
            <p className="text-sm text-gray-500 mt-1">{String(error)}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
              <div>Price ({takerSymbol})</div>
              <div className="text-right">Amount ({makerSymbol})</div>
              <div className="text-right">Age</div>
            </div>

            {/* Sell Orders */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-red-600 mb-2 flex items-center">
                <span className="mr-2">📈</span>
                Sell Orders ({sellOrders.length})
              </div>
              {sellOrders.length > 0 ? (
                sellOrders.map((order, index) => (
                  <div 
                    key={order.orderHash} 
                    className="grid grid-cols-3 gap-4 text-sm py-1 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors"
                    title={`Order Hash: ${order.orderHash}`}
                  >
                    <div className="text-red-600 font-mono font-medium">{order.displayPrice}</div>
                    <div className="text-right font-mono">{order.displayAmount}</div>
                    <div className="text-right text-xs text-gray-500">
                      {formatDistanceToNow(order.timestamp, { addSuffix: true })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-2 text-sm">No sell orders</div>
              )}
            </div>

            {/* Current Price */}
            <div className="border-y py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
              <div className="flex items-center justify-center space-x-4">
                {bestBid > 0 && bestAsk > 0 && (
                  <div className="text-center">
                    <div className="text-xs text-gray-500">
                      Bid: <span className="font-mono text-green-600">{bestBid >= 1 ? bestBid.toFixed(4) : bestBid.toFixed(6)}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Ask: <span className="font-mono text-red-600">{bestAsk >= 1 ? bestAsk.toFixed(4) : bestAsk.toFixed(6)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Buy Orders */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-green-600 mb-2 flex items-center">
                <span className="mr-2">📉</span>
                Buy Orders ({buyOrders.length})
              </div>
              {buyOrders.length > 0 ? (
                buyOrders.map((order, index) => (
                  <div 
                    key={order.orderHash} 
                    className="grid grid-cols-3 gap-4 text-sm py-1 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer transition-colors"
                    title={`Order Hash: ${order.orderHash}`}
                  >
                    <div className="text-green-600 font-mono font-medium">{order.displayPrice}</div>
                    <div className="text-right font-mono">{order.displayAmount}</div>
                    <div className="text-right text-xs text-gray-500">
                      {formatDistanceToNow(order.timestamp, { addSuffix: true })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-2 text-sm">No buy orders</div>
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-500">
                Showing {Math.min(buyOrders.length + sellOrders.length, limit)} orders
              </div>
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLimit(limit === 15 ? 30 : 15)}
                >
                  {limit === 15 ? 'Show More' : 'Show Less'}
                </Button>
              </div>
            </div>

            {/* Status */}
            <div className="text-center text-xs text-gray-500">
              <div className="flex items-center justify-center space-x-4">
                <Badge variant="secondary" className="text-xs">
                  📊 1inch Orderbook API
                </Badge>
                <span>Updates every 15s</span>
                {currentPrice !== '---' && (
                  <Badge variant="outline" className="text-xs">
                    💲 Spot Price API
                  </Badge>
                )}
              </div>
              {orderBookData?.success && (
                <div className="mt-1 text-xs text-gray-400">
                  Buy: {buyOrders.length} orders | Sell: {sellOrders.length} orders
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}