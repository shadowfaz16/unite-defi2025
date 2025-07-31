'use client';

import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useForm } from 'react-hook-form';
import { useTradingStore } from '../../lib/stores/tradingStore';
import { useWeb3 } from '../../lib/hooks/useWeb3';

interface DCAFormData {
  fromTokenAddress: string;
  toTokenAddress: string;
  amountPerOrder: string;
  intervalHours: number;
  totalOrders: number;
  slippageTolerance: number;
  enableSmartConditions: boolean;
  maxPriceThreshold?: number;
  minPriceDropPercent?: number;
}

interface Props {
  onClose: () => void;
}

export function DCACreator({ onClose }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const { address } = useWeb3();
  const { addStrategy } = useTradingStore();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<DCAFormData>({
    defaultValues: {
      fromTokenAddress: '0xa0b86a33e6996051cb9a4c3e47e63b0b0e4f3c1a', // USDC
      toTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
      amountPerOrder: '100000000', // 100 USDC (6 decimals)
      intervalHours: 24,
      totalOrders: 30,
      slippageTolerance: 1,
      enableSmartConditions: false,
    },
  });

  const enableSmartConditions = watch('enableSmartConditions');

  const onSubmit = async (data: DCAFormData) => {
    if (!address) return;
    
    setIsCreating(true);
    try {
      const strategy = {
        id: `dca_${Date.now()}`,
        type: 'DCA' as const,
        name: `DCA: ${data.amountPerOrder} USDC → WETH`,
        description: `Buy WETH with ${data.amountPerOrder} USDC every ${data.intervalHours} hours for ${data.totalOrders} times`,
        isActive: true,
        parameters: {
          fromToken: {
            address: data.fromTokenAddress,
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
          },
          toToken: {
            address: data.toTokenAddress,
            symbol: 'WETH',
            name: 'Wrapped Ether',
            decimals: 18,
          },
          amountPerOrder: data.amountPerOrder,
          intervalHours: data.intervalHours,
          totalOrders: data.totalOrders,
          slippageTolerance: data.slippageTolerance,
          maker: address,
          executedOrders: 0,
          nextExecutionTime: Date.now() + (data.intervalHours * 60 * 60 * 1000),
          totalInvested: '0',
          smartConditions: enableSmartConditions ? {
            maxPriceThreshold: data.maxPriceThreshold,
            minPriceDropPercent: data.minPriceDropPercent,
          } : undefined,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      addStrategy(strategy);
      onClose();
    } catch (error) {
      console.error('Error creating DCA strategy:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Token Pair */}
        <div className="space-y-4">
          <h4 className="font-medium">Token Pair</h4>
          
          <div>
            <label className="block text-sm font-medium mb-2">From Token (Pay with)</label>
            <select
              {...register('fromTokenAddress', { required: 'From token is required' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800"
            >
              <option value="0xa0b86a33e6996051cb9a4c3e47e63b0b0e4f3c1a">USDC</option>
              <option value="0xdac17f958d2ee523a2206206994597c13d831ec7">USDT</option>
              <option value="0x6b175474e89094c44da98b954eedeac495271d0f">DAI</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">To Token (Buy)</label>
            <select
              {...register('toTokenAddress', { required: 'To token is required' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800"
            >
              <option value="0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2">WETH</option>
              <option value="0x2260fac5e5542a773aa44fbcfedf7c193bc2c599">WBTC</option>
              <option value="0x111111111117dc0aa78b770fa6a738034120c302">1INCH</option>
              <option value="0x1f9840a85d5af5bf1d1762f925bdaddc4201f984">UNI</option>
            </select>
          </div>
        </div>

        {/* DCA Parameters */}
        <div className="space-y-4">
          <h4 className="font-medium">DCA Parameters</h4>
          
          <div>
            <label className="block text-sm font-medium mb-2">Amount per Order</label>
            <input
              {...register('amountPerOrder', { 
                required: 'Amount per order is required',
                pattern: { value: /^\d+$/, message: 'Must be a valid number' }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800"
              placeholder="100000000"
            />
            {errors.amountPerOrder && (
              <p className="text-red-500 text-sm mt-1">{errors.amountPerOrder.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Amount in smallest unit (100 USDC = 100000000)</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Interval (hours)</label>
              <input
                type="number"
                {...register('intervalHours', { 
                  required: 'Interval is required',
                  min: { value: 1, message: 'Minimum 1 hour' }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800"
              />
              {errors.intervalHours && (
                <p className="text-red-500 text-sm mt-1">{errors.intervalHours.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Total Orders</label>
              <input
                type="number"
                {...register('totalOrders', { 
                  required: 'Total orders is required',
                  min: { value: 2, message: 'Minimum 2 orders' },
                  max: { value: 365, message: 'Maximum 365 orders' }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800"
              />
              {errors.totalOrders && (
                <p className="text-red-500 text-sm mt-1">{errors.totalOrders.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Slippage Tolerance (%)</label>
            <input
              type="number"
              step="0.1"
              {...register('slippageTolerance', { 
                required: 'Slippage tolerance is required',
                min: { value: 0.1, message: 'Minimum 0.1%' },
                max: { value: 10, message: 'Maximum 10%' }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Smart Conditions */}
      <Card className="border-green-200 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              {...register('enableSmartConditions')}
              className="w-4 h-4 text-green-600"
            />
            <label className="font-medium text-green-800 dark:text-green-200">
              Enable Smart DCA Conditions
            </label>
          </div>
          
          {enableSmartConditions && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Max Price Threshold</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('maxPriceThreshold')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800"
                  placeholder="2500"
                />
                <p className="text-xs text-gray-500 mt-1">Only buy if price is below this threshold</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Min Price Drop (%)</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('minPriceDropPercent')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800"
                  placeholder="5"
                />
                <p className="text-xs text-gray-500 mt-1">Only buy if price dropped by this % since last order</p>
              </div>
            </div>
          )}
          
          <div className="text-sm text-green-700 dark:text-green-300 mt-2">
            Smart conditions help you "buy the dip" by only executing DCA when favorable conditions are met.
          </div>
        </CardContent>
      </Card>

      {/* Strategy Preview */}
      <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2 text-green-800 dark:text-green-200">Strategy Preview</h4>
          <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <p>• Regular automated purchases to reduce timing risk</p>
            <p>• Average out price volatility over time</p>
            <p>• Optional smart conditions for better entry points</p>
            <p>• All orders placed in custom orderbook (not official 1inch API)</p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button
          type="submit"
          disabled={isCreating || !address}
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          {isCreating ? 'Creating Strategy...' : 'Create DCA Strategy'}
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