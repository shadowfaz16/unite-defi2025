'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function PriceChart() {
  const [timeframe, setTimeframe] = useState<'1H' | '4H' | '1D' | '1W'>('1H');
  const [priceData, setPriceData] = useState<any[]>([]);

  useEffect(() => {
    // Generate mock price data
    const generateMockData = () => {
      const now = Date.now();
      const intervals = timeframe === '1H' ? 60 : timeframe === '4H' ? 240 : timeframe === '1D' ? 1440 : 10080;
      const dataPoints = 50;
      
      let basePrice = 2500;
      const data = [];
      
      for (let i = dataPoints; i >= 0; i--) {
        const timestamp = now - (i * intervals * 60 * 1000);
        const volatility = 0.02; // 2% volatility
        const change = (Math.random() - 0.5) * volatility * basePrice;
        basePrice = Math.max(basePrice + change, 2000); // Minimum price of 2000
        
        data.push({
          timestamp,
          time: new Date(timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          price: parseFloat(basePrice.toFixed(2)),
          volume: Math.random() * 1000000 + 500000
        });
      }
      
      return data;
    };

    setPriceData(generateMockData());
  }, [timeframe]);

  const currentPrice = priceData[priceData.length - 1]?.price || 2500;
  const previousPrice = priceData[priceData.length - 2]?.price || 2500;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = (priceChange / previousPrice) * 100;

  const timeframes = [
    { label: '1H', value: '1H' as const },
    { label: '4H', value: '4H' as const },
    { label: '1D', value: '1D' as const },
    { label: '1W', value: '1W' as const },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <span>📈</span>
            <span>WETH/USDC</span>
          </CardTitle>
          <div className="flex space-x-1">
            {timeframes.map((tf) => (
              <Button
                key={tf.value}
                variant={timeframe === tf.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe(tf.value)}
                className="text-xs"
              >
                {tf.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold">${currentPrice.toFixed(2)}</span>
            <span className={`text-sm font-medium ${
              priceChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={['dataMin - 10', 'dataMax + 10']}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '12px'
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Price Levels */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">24h High:</span>
              <span className="font-medium">${(currentPrice * 1.02).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">24h Low:</span>
              <span className="font-medium">${(currentPrice * 0.98).toFixed(2)}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">24h Volume:</span>
              <span className="font-medium">$12.5M</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Market Cap:</span>
              <span className="font-medium">$301.2B</span>
            </div>
          </div>
        </div>

        {/* Technical Indicators */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Technical Analysis:</span>
            <div className="flex space-x-4">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>RSI: 65</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>MACD: Bullish</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span>Support: $2,450</span>
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}