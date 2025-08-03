'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartData } from '../lib/types';
import { OneInchAPI } from '../lib/api/oneinch';
import { TOKEN_ADDRESSES } from '../lib/constants';
import { RealOrderBook } from './RealOrderBook';

// Available tokens to compare with USDT
const AVAILABLE_TOKENS = [
  {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    emoji: '💎'
  },
  {
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    emoji: '₿'
  },
  {
    address: '0x111111111117dC0aa78b770fA6A738034120C302',
    symbol: '1INCH',
    name: '1inch Token',
    emoji: '🦄'
  },
  {
    address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    symbol: 'LINK',
    name: 'Chainlink',
    emoji: '🔗'
  },
  {
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    symbol: 'UNI',
    name: 'Uniswap',
    emoji: '🦄'
  },
  {
    address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    symbol: 'AAVE',
    name: 'Aave Token',
    emoji: '👻'
  },
  {
    address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
    symbol: 'MKR',
    name: 'Maker',
    emoji: '🏗️'
  },
  {
    address: '0xD533a949740bb3306d119CC777fa900bA034cd52',
    symbol: 'CRV',
    name: 'Curve DAO Token',
    emoji: '🌙'
  },
  {
    address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
    symbol: 'COMP',
    name: 'Compound',
    emoji: '💰'
  },
  {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    emoji: '💎'
  },
  {
    address: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
    symbol: 'YFI',
    name: 'yearn.finance',
    emoji: '🔥'
  },
  {
    address: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
    symbol: 'FRAX',
    name: 'Frax',
    emoji: '🧊'
  }
];

const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

export function RealTimeCharts() {
  const [period, setPeriod] = useState<'24H' | '1W' | '1M' | '1Y' | 'AllTime'>('24H');
  const [selectedToken, setSelectedToken] = useState(AVAILABLE_TOKENS[0]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching chart data for ${selectedToken.symbol} vs USDT, period: ${period}`);
        
        const result = await OneInchAPI.getChartData(
          selectedToken.address,
          USDT_ADDRESS,
          period,
          1 // Ethereum mainnet
        );

        if (result.success) {
          setChartData(result.data);
          console.log(`✅ Successfully loaded ${result.data.length} data points`);
        } else {
          setError(result.error || 'Failed to fetch chart data');
          console.error('❌ Failed to fetch chart data:', result.error);
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
        console.error('❌ Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [period, selectedToken]);

  const currentPrice = chartData[chartData.length - 1]?.price || 0;
  const previousPrice = chartData[chartData.length - 2]?.price || currentPrice;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice !== 0 ? (priceChange / previousPrice) * 100 : 0;

  const periods = [
    { label: '24H', value: '24H' as const },
    { label: '1W', value: '1W' as const },
    { label: '1M', value: '1M' as const },
    { label: '1Y', value: '1Y' as const },
    { label: 'All', value: 'AllTime' as const },
  ];

  // Calculate min and max for better chart scaling
  const prices = chartData.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const chartMin = minPrice - priceRange * 0.05;
  const chartMax = maxPrice + priceRange * 0.05;

  return (
    <div className="space-y-6">
      {/* Token Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Token to Compare with USDT</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 justify-start">
            {AVAILABLE_TOKENS.map((token) => (
              <Button
                key={token.address}
                variant={selectedToken.address === token.address ? 'default' : 'outline'}
                className="h-14 w-14 p-0 rounded-full flex flex-col items-center justify-center relative group hover:scale-105 transition-transform"
                onClick={() => setSelectedToken(token)}
              >
                <span className="text-lg leading-none">{token.emoji}</span>
                <span className="text-xs font-medium leading-none">{token.symbol}</span>
                {/* Tooltip on hover */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {token.name}
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chart and Orderbook */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="xl:col-span-2">
          <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <span>{selectedToken.emoji}</span>
              <span>{selectedToken.symbol}/USDT</span>
            </CardTitle>
            <div className="flex space-x-1">
              {periods.map((p) => (
                <Button
                  key={p.value}
                  variant={period === p.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPeriod(p.value)}
                  className="text-xs"
                  disabled={loading}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">
                {loading ? '...' : currentPrice >= 1.0 ? currentPrice.toFixed(2) : currentPrice.toFixed(6)}
              </span>
              {!loading && chartData.length > 0 && (
                <span className={`text-sm font-medium ${
                  priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {priceChange >= 0 ? '+' : ''}{priceChange >= 1.0 ? priceChange.toFixed(2) : priceChange.toFixed(6)} ({priceChangePercent.toFixed(2)}%)
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              Error: {error}
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <div className="h-80">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading chart data...</p>
                </div>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    domain={[chartMin, chartMax]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      // For values >= 1.0, show 2 decimal places
                      // For values < 1.0, show 6 decimal places for precision
                      return value >= 1.0 ? value.toFixed(2) : value.toFixed(6);
                    }}
                    width={80}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [
                      value >= 1.0 ? value.toFixed(2) : value.toFixed(6), 
                      `${selectedToken.symbol}/USDT`
                    ]}
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
            )}
          </div>

          {/* Price Statistics */}
          {!loading && chartData.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Highest:</span>
                  <span className="font-medium">{maxPrice >= 1.0 ? maxPrice.toFixed(2) : maxPrice.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Lowest:</span>
                  <span className="font-medium">{minPrice >= 1.0 ? minPrice.toFixed(2) : minPrice.toFixed(6)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Data Points:</span>
                  <span className="font-medium">{chartData.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Period:</span>
                  <span className="font-medium">{period}</span>
                </div>
              </div>
            </div>
          )}

          {/* Technical Info */}
          {!loading && chartData.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Data Source:</span>
                <div className="flex space-x-4">
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>1inch Charts API</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Real-time Data</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <span>Ethereum Mainnet</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
        </div>

        {/* Orderbook */}
        <div className="xl:col-span-1">
          <RealOrderBook
            makerAsset={selectedToken.address}
            takerAsset={USDT_ADDRESS}
            makerSymbol={selectedToken.symbol}
            takerSymbol="USDT"
            chainId={1}
          />
        </div>
      </div>
    </div>
  );
}