'use client';

import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useForm } from 'react-hook-form';
import { useTradingStore } from '../../lib/stores/tradingStore';
import { useWeb3 } from '../../lib/hooks/useWeb3';
import { TokenSelector } from '../TokenSelector';
import type { Token } from '../../lib/types';

interface GridTradingFormData {
  baseToken: Token;
  quoteToken: Token;
  lowerPrice: number;
  upperPrice: number;
  gridLevels: number;
  totalCapital: string;
  autoRebalance: boolean;
  profitPercentage: number;
}

interface Props {
  onClose: () => void;
}

export function GridTradingCreator({ onClose }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [baseToken, setBaseToken] = useState<Token | undefined>();
  const [quoteToken, setQuoteToken] = useState<Token | undefined>();
  const { address } = useWeb3();
  const { addStrategy } = useTradingStore();
  
  const { register, handleSubmit, watch, formState: { errors }, setValue, getValues } = useForm<GridTradingFormData>({
    defaultValues: {
      lowerPrice: 2000,
      upperPrice: 2800,
      gridLevels: 10,
      totalCapital: '1000000000', // 1000 USDT (6 decimals)
      autoRebalance: true,
      profitPercentage: 0.5,
    },
  });

  const lowerPrice = watch('lowerPrice');
  const upperPrice = watch('upperPrice');
  const gridLevels = watch('gridLevels');
  const totalCapital = watch('totalCapital');

  // Calculate grid metrics
  const priceRange = upperPrice - lowerPrice;
  const priceStep = priceRange / (gridLevels - 1);
  const capitalPerLevel = parseFloat(totalCapital) / (10 ** (quoteToken?.decimals || 6)) / gridLevels;

  const onSubmit = async (data: GridTradingFormData) => {
    if (!address || !baseToken || !quoteToken) return;
    
    setIsCreating(true);
    try {
      const strategy = {
        id: `grid_${Date.now()}`,
        type: 'GRID_TRADING' as const,
        name: `Grid: ${baseToken.symbol}/${quoteToken.symbol} [${data.lowerPrice}-${data.upperPrice}]`,
        description: `Grid trading with ${data.gridLevels} levels. Range: $${data.lowerPrice.toFixed(0)} - $${data.upperPrice.toFixed(0)}`,
        isActive: true,
        parameters: {
          baseToken,
          quoteToken,
          lowerPrice: data.lowerPrice,
          upperPrice: data.upperPrice,
          gridLevels: data.gridLevels,
          totalCapital: data.totalCapital,
          autoRebalance: data.autoRebalance,
          profitPercentage: data.profitPercentage,
          maker: address,
          gridOrders: [],
          totalTrades: 0,
          successfulTrades: 0,
          totalProfit: 0,
          currentGridCenter: (data.lowerPrice + data.upperPrice) / 2,
          lastRebalanceTime: Date.now(),
          filledOrders: [],
          pendingOrders: []
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      addStrategy(strategy);
      onClose();
    } catch (error) {
      console.error('Error creating Grid Trading strategy:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Quick setup presets
  const applyPreset = (preset: 'conservative' | 'moderate' | 'aggressive') => {
    switch (preset) {
      case 'conservative':
        setValue('lowerPrice', 2200);
        setValue('upperPrice', 2600);
        setValue('gridLevels', 8);
        setValue('profitPercentage', 0.3);
        break;
      case 'moderate':
        setValue('lowerPrice', 2000);
        setValue('upperPrice', 2800);
        setValue('gridLevels', 12);
        setValue('profitPercentage', 0.5);
        break;
      case 'aggressive':
        setValue('lowerPrice', 1800);
        setValue('upperPrice', 3000);
        setValue('gridLevels', 20);
        setValue('profitPercentage', 0.8);
        break;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Token Pair Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <TokenSelector
            label="Base Token (Asset to Trade)"
            selectedToken={baseToken}
            onTokenSelect={setBaseToken}
            excludeTokens={quoteToken ? [quoteToken.address] : []}
          />
        </div>
        
        <div>
          <TokenSelector
            label="Quote Token (Usually USDT)"
            selectedToken={quoteToken}
            onTokenSelect={setQuoteToken}
            excludeTokens={baseToken ? [baseToken.address] : []}
            showUSDTFirst={true}
          />
        </div>
      </div>

      {/* Quick Presets */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <h4 className="font-medium mb-3 text-blue-800 dark:text-blue-200">Quick Setup Presets</h4>
          <div className="grid grid-cols-3 gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset('conservative')}
              className="flex flex-col h-auto p-3 border-green-200 dark:border-green-800"
            >
              <span className="font-medium text-green-700 dark:text-green-300">Conservative</span>
              <span className="text-xs text-gray-500">8 levels, ±10%</span>
              <Badge variant="secondary" className="mt-1 text-xs">Low Risk</Badge>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset('moderate')}
              className="flex flex-col h-auto p-3 border-yellow-200 dark:border-yellow-800"
            >
              <span className="font-medium text-yellow-700 dark:text-yellow-300">Moderate</span>
              <span className="text-xs text-gray-500">12 levels, ±20%</span>
              <Badge variant="secondary" className="mt-1 text-xs">Medium Risk</Badge>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset('aggressive')}
              className="flex flex-col h-auto p-3 border-red-200 dark:border-red-800"
            >
              <span className="font-medium text-red-700 dark:text-red-300">Aggressive</span>
              <span className="text-xs text-gray-500">20 levels, ±25%</span>
              <Badge variant="secondary" className="mt-1 text-xs">High Risk</Badge>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium">Price Range</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Lower Price ($)</label>
              <input
                type="number"
                step="0.01"
                {...register('lowerPrice', { 
                  required: 'Lower price is required',
                  min: { value: 0.01, message: 'Must be greater than 0' }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              />
              {errors.lowerPrice && (
                <p className="text-red-500 text-sm mt-1">{errors.lowerPrice.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Upper Price ($)</label>
              <input
                type="number"
                step="0.01"
                {...register('upperPrice', { 
                  required: 'Upper price is required',
                  validate: value => value > lowerPrice || 'Must be greater than lower price'
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              />
              {errors.upperPrice && (
                <p className="text-red-500 text-sm mt-1">{errors.upperPrice.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Grid Levels</label>
            <input
              type="number"
              {...register('gridLevels', { 
                required: 'Grid levels is required',
                min: { value: 3, message: 'Minimum 3 levels' },
                max: { value: 50, message: 'Maximum 50 levels' }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            />
            {errors.gridLevels && (
              <p className="text-red-500 text-sm mt-1">{errors.gridLevels.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">More levels = more trades but smaller profits</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Capital & Settings</h4>
          
          <div>
            <label className="block text-sm font-medium mb-2">Total Capital</label>
            <input
              {...register('totalCapital', { 
                required: 'Total capital is required',
                pattern: { value: /^\d+$/, message: 'Must be a valid number' }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              placeholder="1000000000"
            />
            {errors.totalCapital && (
              <p className="text-red-500 text-sm mt-1">{errors.totalCapital.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Amount in smallest unit (1000 USDT = 1000000000)</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Profit per Trade (%)</label>
            <input
              type="number"
              step="0.1"
              {...register('profitPercentage', { 
                required: 'Profit percentage is required',
                min: { value: 0.1, message: 'Minimum 0.1%' },
                max: { value: 5, message: 'Maximum 5%' }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum profit margin per trade</p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register('autoRebalance')}
              className="w-4 h-4 text-blue-600"
            />
            <label className="text-sm font-medium">
              Auto-rebalance when price moves outside range
            </label>
          </div>
        </div>
      </div>

      {/* Grid Preview */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <h4 className="font-medium mb-3 text-blue-800 dark:text-blue-200">Grid Preview</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Price Range</p>
              <p className="font-medium">${lowerPrice.toFixed(2)} - ${upperPrice.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Range: ${priceRange.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Price Step</p>
              <p className="font-medium">${priceStep.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Between levels</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Capital per Level</p>
              <p className="font-medium">${capitalPerLevel.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Per grid order</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 <strong>How it works:</strong> The grid places {gridLevels} buy and sell orders across your price range. 
              When orders fill, new opposite orders are created automatically to capture profits from price volatility.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button
          type="submit"
          disabled={isCreating || !address || !baseToken || !quoteToken}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {isCreating ? 'Creating Grid Strategy...' : 'Create Grid Strategy'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}