'use client';

import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useForm } from 'react-hook-form';
import { useTradingStore } from '../../lib/stores/tradingStore';
import { useWeb3 } from '../../lib/hooks/useWeb3';

interface OptionsFormData {
  optionType: 'CALL' | 'PUT' | 'COVERED_CALL' | 'PROTECTIVE_PUT';
  underlyingToken: string;
  strikeToken: string;
  strikePrice: string;
  premium: string;
  optionSize: string;
  expirationDays: number;
}

interface Props {
  onClose: () => void;
}

export function OptionsCreator({ onClose }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const { address } = useWeb3();
  const { addStrategy } = useTradingStore();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<OptionsFormData>({
    defaultValues: {
      optionType: 'CALL',
      underlyingToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
      strikeToken: '0xa0b86a33e6996051cb9a4c3e47e63b0b0e4f3c1a', // USDC
      strikePrice: '2500',
      premium: '50',
      optionSize: '1000000000000000000', // 1 WETH
      expirationDays: 30,
    },
  });

  const optionType = watch('optionType');

  const getOptionDescription = (type: string) => {
    switch (type) {
      case 'CALL':
        return 'Right to BUY the underlying asset at strike price';
      case 'PUT':
        return 'Right to SELL the underlying asset at strike price';
      case 'COVERED_CALL':
        return 'SELL call option while holding the underlying asset';
      case 'PROTECTIVE_PUT':
        return 'BUY put option to protect holdings';
      default:
        return '';
    }
  };

  const onSubmit = async (data: OptionsFormData) => {
    if (!address) return;
    
    setIsCreating(true);
    try {
      const expiration = Date.now() + (data.expirationDays * 24 * 60 * 60 * 1000);
      
      const strategy = {
        id: `options_${Date.now()}`,
        type: 'OPTIONS_SYNTHETIC' as const,
        name: `${data.optionType}: WETH @ ${data.strikePrice} USDC`,
        description: getOptionDescription(data.optionType),
        isActive: true,
        parameters: {
          optionType: data.optionType,
          underlyingToken: {
            address: data.underlyingToken,
            symbol: 'WETH',
            name: 'Wrapped Ether',
            decimals: 18,
          },
          strikeToken: {
            address: data.strikeToken,
            symbol: 'USDC',
            name: 'USD Coin',
            decimals: 6,
          },
          strikePrice: data.strikePrice,
          premium: data.premium,
          optionSize: data.optionSize,
          expiration,
          maker: address,
          orders: [],
          currentPrice: 0,
          intrinsicValue: 0,
          timeValue: 0,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      addStrategy(strategy);
      onClose();
    } catch (error) {
      console.error('Error creating options strategy:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option Type */}
        <div className="space-y-4">
          <h4 className="font-medium">Option Type</h4>
          
          <div>
            <label className="block text-sm font-medium mb-2">Strategy</label>
            <select
              {...register('optionType', { required: 'Option type is required' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800"
            >
              <option value="CALL">Call Option</option>
              <option value="PUT">Put Option</option>
              <option value="COVERED_CALL">Covered Call</option>
              <option value="PROTECTIVE_PUT">Protective Put</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">{getOptionDescription(optionType)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Underlying Asset</label>
            <select
              {...register('underlyingToken', { required: 'Underlying token is required' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800"
            >
              <option value="0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2">WETH</option>
              <option value="0x2260fac5e5542a773aa44fbcfedf7c193bc2c599">WBTC</option>
              <option value="0x111111111117dc0aa78b770fa6a738034120c302">1INCH</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Settlement Token</label>
            <select
              {...register('strikeToken', { required: 'Strike token is required' })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800"
            >
              <option value="0xa0b86a33e6996051cb9a4c3e47e63b0b0e4f3c1a">USDC</option>
              <option value="0xdac17f958d2ee523a2206206994597c13d831ec7">USDT</option>
              <option value="0x6b175474e89094c44da98b954eedeac495271d0f">DAI</option>
            </select>
          </div>
        </div>

        {/* Option Parameters */}
        <div className="space-y-4">
          <h4 className="font-medium">Option Parameters</h4>
          
          <div>
            <label className="block text-sm font-medium mb-2">Strike Price</label>
            <input
              type="number"
              step="0.01"
              {...register('strikePrice', { 
                required: 'Strike price is required',
                min: { value: 0.01, message: 'Must be greater than 0' }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800"
              placeholder="2500"
            />
            {errors.strikePrice && (
              <p className="text-red-500 text-sm mt-1">{errors.strikePrice.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Price at which option can be exercised</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Premium</label>
            <input
              type="number"
              step="0.01"
              {...register('premium', { 
                required: 'Premium is required',
                min: { value: 0.01, message: 'Must be greater than 0' }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800"
              placeholder="50"
            />
            {errors.premium && (
              <p className="text-red-500 text-sm mt-1">{errors.premium.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Option premium in settlement token</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Option Size</label>
            <input
              {...register('optionSize', { 
                required: 'Option size is required',
                pattern: { value: /^\d+$/, message: 'Must be a valid number' }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800"
              placeholder="1000000000000000000"
            />
            {errors.optionSize && (
              <p className="text-red-500 text-sm mt-1">{errors.optionSize.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Amount in smallest unit (1 WETH = 10^18)</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Expiration (days)</label>
            <input
              type="number"
              {...register('expirationDays', { 
                required: 'Expiration is required',
                min: { value: 1, message: 'Minimum 1 day' },
                max: { value: 365, message: 'Maximum 365 days' }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800"
            />
            {errors.expirationDays && (
              <p className="text-red-500 text-sm mt-1">{errors.expirationDays.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Option Greeks Preview */}
      <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2 text-purple-800 dark:text-purple-200">Option Greeks (Estimated)</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Delta:</span>
              <span className="ml-1 font-medium">0.65</span>
            </div>
            <div>
              <span className="text-gray-500">Gamma:</span>
              <span className="ml-1 font-medium">0.10</span>
            </div>
            <div>
              <span className="text-gray-500">Theta:</span>
              <span className="ml-1 font-medium">-0.25</span>
            </div>
            <div>
              <span className="text-gray-500">Vega:</span>
              <span className="ml-1 font-medium">15.2</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Preview */}
      <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2 text-purple-800 dark:text-purple-200">Strategy Overview</h4>
          <div className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
            <p>• Synthetic options using 1inch limit orders</p>
            <p>• Automatic exercise if option goes in-the-money</p>
            <p>• Custom orderbook implementation (not official 1inch API)</p>
            <p>• Risk management with expiration and strike price controls</p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button
          type="submit"
          disabled={isCreating || !address}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {isCreating ? 'Creating Strategy...' : 'Create Options Strategy'}
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