'use client';

import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useForm } from 'react-hook-form';
import { useTradingStore } from '../../lib/stores/tradingStore';
import { TWAPStrategy } from '../../lib/strategies/twap';
import { useWeb3 } from '../../lib/hooks/useWeb3';
import { Wallet } from 'ethers';

interface TWAPFormData {
  fromTokenAddress: string;
  toTokenAddress: string;
  totalAmount: string;
  numberOfOrders: number;
  intervalMinutes: number;
  slippageTolerance: number;
}

interface Props {
  onClose: () => void;
}

export function TWAPCreator({ onClose }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const { address } = useWeb3();
  const { addStrategy } = useTradingStore();
  
  const { register, handleSubmit, formState: { errors } } = useForm<TWAPFormData>({
    defaultValues: {
      fromTokenAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
      toTokenAddress: '0x111111111117dc0aa78b770fa6a738034120c302', // 1INCH
      totalAmount: '1000000000', // 1000 USDT (6 decimals)
      numberOfOrders: 10,
      intervalMinutes: 30,
      slippageTolerance: 1,
    },
  });

  const onSubmit = async (data: TWAPFormData) => {
    if (!address) return;
    
    setIsCreating(true);
    try {
      // Mock wallet for demo (in production, this would use the connected wallet)
      const mockWallet = new Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
      const twapStrategy = new TWAPStrategy(mockWallet, 1);
      
      const strategy = await twapStrategy.createTWAPStrategy({
        fromToken: {
          address: data.fromTokenAddress,
          symbol: 'USDT',
          name: 'Tether USD',
          decimals: 6,
        },
        toToken: {
          address: data.toTokenAddress,
          symbol: '1INCH',
          name: '1inch Token',
          decimals: 18,
        },
        totalAmount: data.totalAmount,
        numberOfOrders: data.numberOfOrders,
        intervalMinutes: data.intervalMinutes,
        slippageTolerance: data.slippageTolerance,
        maker: address,
      });

      addStrategy(strategy);
      onClose();
    } catch (error) {
      console.error('Error creating TWAP strategy:', error);
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
            <label className="block text-sm font-medium mb-2">From Token Address</label>
            <input
              {...register('fromTokenAddress', { required: 'From token is required' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              placeholder="0xdac17f958d2ee523a2206206994597c13d831ec7"
            />
            {errors.fromTokenAddress && (
              <p className="text-red-500 text-sm mt-1">{errors.fromTokenAddress.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">To Token Address</label>
            <input
              {...register('toTokenAddress', { required: 'To token is required' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              placeholder="0x111111111117dc0aa78b770fa6a738034120c302"
            />
            {errors.toTokenAddress && (
              <p className="text-red-500 text-sm mt-1">{errors.toTokenAddress.message}</p>
            )}
          </div>
        </div>

        {/* TWAP Parameters */}
        <div className="space-y-4">
          <h4 className="font-medium">TWAP Parameters</h4>
          
          <div>
            <label className="block text-sm font-medium mb-2">Total Amount</label>
            <input
              {...register('totalAmount', { 
                required: 'Total amount is required',
                pattern: { value: /^\d+$/, message: 'Must be a valid number' }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              placeholder="1000000000"
            />
            {errors.totalAmount && (
              <p className="text-red-500 text-sm mt-1">{errors.totalAmount.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Amount in smallest unit (e.g., wei for ETH)</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Number of Orders</label>
              <input
                type="number"
                {...register('numberOfOrders', { 
                  required: 'Number of orders is required',
                  min: { value: 2, message: 'Minimum 2 orders' },
                  max: { value: 100, message: 'Maximum 100 orders' }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              />
              {errors.numberOfOrders && (
                <p className="text-red-500 text-sm mt-1">{errors.numberOfOrders.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Interval (minutes)</label>
              <input
                type="number"
                {...register('intervalMinutes', { 
                  required: 'Interval is required',
                  min: { value: 1, message: 'Minimum 1 minute' }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              />
              {errors.intervalMinutes && (
                <p className="text-red-500 text-sm mt-1">{errors.intervalMinutes.message}</p>
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            />
            {errors.slippageTolerance && (
              <p className="text-red-500 text-sm mt-1">{errors.slippageTolerance.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Strategy Preview */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2 text-blue-800 dark:text-blue-200">Strategy Preview</h4>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <p>• Split large order into smaller chunks to reduce market impact</p>
            <p>• Execute orders at regular intervals to achieve time-weighted average price</p>
            <p>• Each order will be placed as a limit order in our custom orderbook</p>
            <p>• Automatic execution based on your specified schedule</p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button
          type="submit"
          disabled={isCreating || !address}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isCreating ? 'Creating Strategy...' : 'Create TWAP Strategy'}
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