"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { OneInchAPI } from '../lib/api/oneinch';
import type { GasPriceData } from '../lib/types';

interface GasPriceCardProps {
  chainId?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

export function GasPriceCard({ 
  chainId = 1, 
  autoRefresh = true, 
  refreshInterval = 30 
}: GasPriceCardProps) {
  const [gasData, setGasData] = useState<GasPriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchGasPrice = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await OneInchAPI.getGasPrice(chainId);
      
      if (response.success) {
        setGasData(response.data);
        setLastUpdated(new Date());
        console.log('Gas price data updated:', response.data);
      } else {
        setError(response.error || 'Failed to fetch gas prices');
        console.error('Failed to fetch gas prices:', response.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching gas prices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGasPrice();
  }, [chainId]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchGasPrice, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, chainId]);

  const formatGwei = (wei: string): string => {
    try {
      const gwei = Math.round(parseInt(wei) / 1e9 * 100) / 100;
      return gwei.toFixed(1);
    } catch {
      return '0.0';
    }
  };

  const getGasPriceCategory = (type: string) => {
    const categories = {
      low: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Slow' },
      medium: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Standard' },
      high: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', label: 'Fast' },
      instant: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'Instant' }
    };
    return categories[type as keyof typeof categories] || categories.medium;
  };

  if (loading && !gasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">⛽</span>
            Gas Prices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading gas prices...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">⛽</span>
            Gas Prices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchGasPrice}
              disabled={loading}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!gasData) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⛽</span>
              Gas Prices
            </div>
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchGasPrice}
                disabled={loading}
                className="h-6 w-6 p-0"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent"></div>
                ) : (
                  <span className="text-sm">🔄</span>
                )}
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Base Fee */}
          <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Base Fee</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {formatGwei(gasData.baseFee)} gwei
            </span>
          </div>

          {/* Gas Price Options */}
          {Object.entries(gasData).map(([type, price]) => {
            if (type === 'baseFee' || !price || typeof price !== 'object') return null;
            
            const category = getGasPriceCategory(type);
            
            return (
              <div key={type} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                  <Badge className={category.color}>
                    {category.label}
                  </Badge>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatGwei(price.maxFeePerGas)} gwei
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Priority: {formatGwei(price.maxPriorityFeePerGas)} gwei
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Est. Cost*
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    ${((parseInt(price.maxFeePerGas) * 21000) / 1e18 * 2500).toFixed(3)}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 pt-2 border-t">
            *Estimated cost for simple transfer at current ETH price
          </div>
        </div>
      </CardContent>
    </Card>
  );
}