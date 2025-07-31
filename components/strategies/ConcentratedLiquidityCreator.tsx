'use client';

import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useForm } from 'react-hook-form';
import { useTradingStore } from '../../lib/stores/tradingStore';
import { useWeb3 } from '../../lib/hooks/useWeb3';

interface CLFormData {
  tokenA: string;
  tokenB: string;
  centerPrice: string;
  rangeWidth: number;
  totalLiquidity: string;
  gridLevels: number;
  autoRebalance: boolean;
  rebalanceThreshold: number;
}

interface Props {
  onClose: () => void;
}

export function ConcentratedLiquidityCreator({ onClose }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const { address } = useWeb3();
  const { addStrategy } = useTradingStore();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<CLFormData>({
    defaultValues: {
      tokenA: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
      tokenB: '0xa0b86a33e6996051cb9a4c3e47e63b0b0e4f3c1a', // USDC
      centerPrice: '2500',
      rangeWidth: 10,
      totalLiquidity: '10000000000000000000', // 10 WETH
      gridLevels: 5,
      autoRebalance: true,
      rebalanceThreshold: 15,
    },
  });

  const autoRebalance = watch('autoRebalance');
  const rangeWidth = watch('rangeWidth');
  const centerPrice = watch('centerPrice');

  const calculatePriceRange = () => {
    const center = parseFloat(centerPrice || '2500');
    const width = rangeWidth || 10;
    const lower = center * (1 - width / 100);
    const upper = center * (1 + width / 100);
    return { lower: lower.toFixed(2), upper: upper.toFixed(2) };
  };

  const onSubmit = async (data: CLFormData) => {
    if (!address) return;
    
    setIsCreating(true);
    try {
      const strategy = {
        id: `cl_${Date.now()}`,
        type: 'CONCENTRATED_LIQUIDITY' as const,
        name: `CL: WETH/USDC ±${data.rangeWidth}%`,
        description: `Concentrated liquidity position with ${data.gridLevels} levels on each side, auto-rebalance: ${data.autoRebalance}`,
        isActive: true,
        parameters: {
          tokenA: {
            address: data.tokenA,
            symbol: 'WETH',
            name: 'Wrapped Ether',
            decimals: 18,
          },
          tokenB: {
            address: data.tokenB,
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
          },
          centerPrice: data.centerPrice,
          rangeWidth: data.rangeWidth,
          totalLiquidity: data.totalLiquidity,
          gridLevels: data.gridLevels,
          maker: address,
          autoRebalance: data.autoRebalance,
          rebalanceThreshold: data.rebalanceThreshold,
          activeOrders: [],
          totalFeesEarned: '0',
          lastRebalanceTime: Date.now(),
          currentPrice: data.centerPrice,
          lowerPrice: parseFloat(data.centerPrice) * (1 - data.rangeWidth / 100),
          upperPrice: parseFloat(data.centerPrice) * (1 + data.rangeWidth / 100),
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      addStrategy(strategy);
      onClose();
    } catch (error) {
      console.error('Error creating concentrated liquidity strategy:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const priceRange = calculatePriceRange();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Token Pair */}
        <div className="space-y-4">
          <h4 className="font-medium">Liquidity Pair</h4>
          
          <div>
            <label className="block text-sm font-medium mb-2">Token A</label>
            <select
              {...register('tokenA', { required: 'Token A is required' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-800"
            >
              <option value="0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2">WETH</option>
              <option value="0x2260fac5e5542a773aa44fbcfedf7c193bc2c599">WBTC</option>
              <option value="0x111111111117dc0aa78b770fa6a738034120c302">1INCH</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Token B</label>
            <select
              {...register('tokenB', { required: 'Token B is required' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-800"
            >
              <option value="0xa0b86a33e6996051cb9a4c3e47e63b0b0e4f3c1a">USDC</option>
              <option value="0xdac17f958d2ee523a2206206994597c13d831ec7">USDT</option>
              <option value="0x6b175474e89094c44da98b954eedeac495271d0f">DAI</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Center Price</label>
            <input
              type="number"
              step="0.01"
              {...register('centerPrice', { 
                required: 'Center price is required',
                min: { value: 0.01, message: 'Must be greater than 0' }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-800"
              placeholder="2500"
            />
            {errors.centerPrice && (
              <p className="text-red-500 text-sm mt-1">{errors.centerPrice.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Current market price for the pair</p>
          </div>
        </div>

        {/* Liquidity Parameters */}
        <div className="space-y-4">
          <h4 className="font-medium">Liquidity Parameters</h4>
          
          <div>
            <label className="block text-sm font-medium mb-2">Range Width (%)</label>
            <input
              type="number"
              step="0.1"
              {...register('rangeWidth', { 
                required: 'Range width is required',
                min: { value: 1, message: 'Minimum 1%' },
                max: { value: 50, message: 'Maximum 50%' }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-800"
            />
            {errors.rangeWidth && (
              <p className="text-red-500 text-sm mt-1">{errors.rangeWidth.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Price range: ${priceRange.lower} - ${priceRange.upper}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Total Liquidity</label>
            <input
              {...register('totalLiquidity', { 
                required: 'Total liquidity is required',
                pattern: { value: /^\d+$/, message: 'Must be a valid number' }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-800"
              placeholder="10000000000000000000"
            />
            {errors.totalLiquidity && (
              <p className="text-red-500 text-sm mt-1">{errors.totalLiquidity.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Amount in smallest unit (10 WETH = 10^19)</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Grid Levels</label>
            <input
              type="number"
              {...register('gridLevels', { 
                required: 'Grid levels is required',
                min: { value: 3, message: 'Minimum 3 levels' },
                max: { value: 20, message: 'Maximum 20 levels' }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-800"
            />
            {errors.gridLevels && (
              <p className="text-red-500 text-sm mt-1">{errors.gridLevels.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Number of orders on each side of center price</p>
          </div>
        </div>
      </div>

      {/* Auto-Rebalancing */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              {...register('autoRebalance')}
              className="w-4 h-4 text-orange-600"
            />
            <label className="font-medium text-orange-800 dark:text-orange-200">
              Enable Auto-Rebalancing
            </label>
          </div>
          
          {autoRebalance && (
            <div>
              <label className="block text-sm font-medium mb-2">Rebalance Threshold (%)</label>
              <input
                type="number"
                step="0.1"
                {...register('rebalanceThreshold', {
                  min: { value: 5, message: 'Minimum 5%' },
                  max: { value: 50, message: 'Maximum 50%' }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-800"
                placeholder="15"
              />
              <p className="text-xs text-gray-500 mt-1">
                Rebalance when price moves this % from center
              </p>
            </div>
          )}
          
          <div className="text-sm text-orange-700 dark:text-orange-300 mt-2">
            Auto-rebalancing helps maintain optimal liquidity around current market price.
          </div>
        </CardContent>
      </Card>

      {/* Strategy Preview */}
      <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2 text-orange-800 dark:text-orange-200">Strategy Preview</h4>
          <div className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
            <p>• Concentrated liquidity similar to Uniswap V3</p>
            <p>• Grid of limit orders around center price</p>
            <p>• Earn fees from providing liquidity</p>
            <p>• Automatic rebalancing to stay in range</p>
            <p>• All orders in custom orderbook (not official 1inch API)</p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button
          type="submit"
          disabled={isCreating || !address}
          className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
        >
          {isCreating ? 'Creating Strategy...' : 'Create Liquidity Strategy'}
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