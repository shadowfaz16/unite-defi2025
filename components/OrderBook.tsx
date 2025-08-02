'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useTradingStore } from '../lib/stores/tradingStore';
import { LimitOrder, TWAPOrder, DCAOrder } from '../lib/types';

// Extended order type with strategy type
interface CustomOrder extends Partial<LimitOrder & TWAPOrder & DCAOrder> {
  type: 'TWAP' | 'DCA' | 'OPTIONS' | 'CL';
}

export function OrderBook() {
  const { orders, strategies } = useTradingStore();
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);

  useEffect(() => {
    // Load custom orders from localStorage
    const loadCustomOrders = () => {
      const twapOrders = JSON.parse(localStorage.getItem('custom_twap_orders') || '[]');
      const dcaOrders = JSON.parse(localStorage.getItem('custom_dca_orders') || '[]');
      const optionsOrders = JSON.parse(localStorage.getItem('custom_options_orders') || '[]');
      const clOrders = JSON.parse(localStorage.getItem('custom_cl_orders') || '[]');
      
      const allOrders: CustomOrder[] = [
        ...twapOrders.map((o: unknown) => ({ ...o as TWAPOrder, type: 'TWAP' as const })),
        ...dcaOrders.map((o: unknown) => ({ ...o as DCAOrder, type: 'DCA' as const })),
        ...optionsOrders.map((o: unknown) => ({ ...o as LimitOrder, type: 'OPTIONS' as const })),
        ...clOrders.map((o: unknown) => ({ ...o as LimitOrder, type: 'CL' as const }))
      ];
      
      setCustomOrders(allOrders);
    };

    loadCustomOrders();
    
    // Set up interval to refresh orders
    const interval = setInterval(loadCustomOrders, 5000);
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

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const mockOrderBook = [
    { price: 2520.50, amount: 1.5, side: 'sell', total: 3780.75 },
    { price: 2519.75, amount: 0.8, side: 'sell', total: 2015.80 },
    { price: 2519.00, amount: 2.1, side: 'sell', total: 5289.90 },
    { price: 2518.25, amount: 1.2, side: 'sell', total: 3021.90 },
    // Current price: 2518.00
    { price: 2517.75, amount: 0.9, side: 'buy', total: 2265.98 },
    { price: 2517.00, amount: 1.7, side: 'buy', total: 4278.90 },
    { price: 2516.25, amount: 2.3, side: 'buy', total: 5787.38 },
    { price: 2515.50, amount: 1.1, side: 'buy', total: 2767.05 },
  ];

  return (
    <div className="space-y-6">
      {/* Live Order Book */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <span>📚</span>
              <span>Order Book (WETH/USDC)</span>
            </span>
            <div className="flex items-center space-x-2 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-gray-500">Live</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Header */}
            <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
              <div>Price (USDC)</div>
              <div className="text-right">Amount (WETH)</div>
              <div className="text-right">Total (USDC)</div>
            </div>

            {/* Sell Orders */}
            <div className="space-y-1">
              {mockOrderBook.filter(order => order.side === 'sell').map((order, index) => (
                <div key={`sell-${index}`} className="grid grid-cols-3 gap-4 text-sm py-1 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <div className="text-red-600 font-mono">{order.price.toFixed(2)}</div>
                  <div className="text-right font-mono">{order.amount.toFixed(3)}</div>
                  <div className="text-right font-mono">{order.total.toFixed(2)}</div>
                </div>
              ))}
            </div>

            {/* Current Price */}
            <div className="border-y py-2 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-center space-x-4">
                <span className="text-lg font-bold text-gray-900 dark:text-white">2518.00</span>
                <span className="text-sm text-green-600">+1.25%</span>
              </div>
            </div>

            {/* Buy Orders */}
            <div className="space-y-1">
              {mockOrderBook.filter(order => order.side === 'buy').map((order, index) => (
                <div key={`buy-${index}`} className="grid grid-cols-3 gap-4 text-sm py-1 hover:bg-green-50 dark:hover:bg-green-900/20">
                  <div className="text-green-600 font-mono">{order.price.toFixed(2)}</div>
                  <div className="text-right font-mono">{order.amount.toFixed(3)}</div>
                  <div className="text-right font-mono">{order.total.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <span>🎯</span>
              <span>Your Custom Orders</span>
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