'use client';

import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useForm } from 'react-hook-form';
import { useTradingStore } from '../../lib/stores/tradingStore';
import { useWeb3 } from '../../lib/hooks/useWeb3';
import { TokenSelector } from '../TokenSelector';
import { ArbitrageStrategy } from '../../lib/strategies/arbitrage';
import type { Token, ArbitrageMarket } from '../../lib/types';

interface ArbitrageFormData {
  baseToken: Token;
  quoteToken: Token;
  minProfitPercent: number;
  maxSlippage: number;
  maxPositionSize: string;
  autoExecute: boolean;
  selectedMarkets: string[];
}

interface Props {
  onClose: () => void;
}

export function ArbitrageCreator({ onClose }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [baseToken, setBaseToken] = useState<Token | undefined>();
  const [quoteToken, setQuoteToken] = useState<Token | undefined>();
  const { address } = useWeb3();
  const { addStrategy } = useTradingStore();
  
  const { register, handleSubmit, watch, formState: { errors }, setValue, getValues } = useForm<ArbitrageFormData>({
    defaultValues: {
      minProfitPercent: 0.3,
      maxSlippage: 1.0,
      maxPositionSize: '500000000', // 500 USDT (6 decimals)
      autoExecute: true,
      selectedMarkets: ['uniswap_v3', 'sushiswap', 'oneinch_limit'],
    },
  });

  const minProfitPercent = watch('minProfitPercent');
  const maxPositionSize = watch('maxPositionSize');
  const autoExecute = watch('autoExecute');
  const selectedMarkets = watch('selectedMarkets');

  // Available markets for arbitrage
  const availableMarkets = ArbitrageStrategy.getDefaultMarkets();

  const onSubmit = async (data: ArbitrageFormData) => {
    if (!address || !baseToken || !quoteToken) return;
    
    setIsCreating(true);
    try {
      const markets = availableMarkets.filter(market => 
        data.selectedMarkets.includes(market.id)
      );

      const strategy = {
        id: `arbitrage_${Date.now()}`,
        type: 'ARBITRAGE' as const,
        name: `Arbitrage: ${baseToken.symbol}/${quoteToken.symbol}`,
        description: `Multi-market arbitrage with min ${data.minProfitPercent}% profit across ${markets.length} markets`,
        isActive: true,
        parameters: {
          baseToken,
          quoteToken,
          minProfitPercent: data.minProfitPercent,
          maxSlippage: data.maxSlippage,
          maxPositionSize: data.maxPositionSize,
          autoExecute: data.autoExecute,
          markets,
          maker: address,
          opportunities: [],
          executedTrades: 0,
          totalProfit: 0,
          failedTrades: 0,
          lastScanTime: Date.now(),
          scanCount: 0,
          avgScanTime: 0
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      addStrategy(strategy);
      onClose();
    } catch (error) {
      console.error('Error creating Arbitrage strategy:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const toggleMarket = (marketId: string) => {
    const current = selectedMarkets;
    const updated = current.includes(marketId)
      ? current.filter(id => id !== marketId)
      : [...current, marketId];
    setValue('selectedMarkets', updated);
  };

  // Quick setup presets
  const applyPreset = (preset: 'fast' | 'balanced' | 'conservative') => {
    switch (preset) {
      case 'fast':
        setValue('minProfitPercent', 0.2);
        setValue('maxSlippage', 1.5);
        setValue('autoExecute', true);
        setValue('selectedMarkets', ['uniswap_v3', 'sushiswap', 'oneinch_limit']);
        break;
      case 'balanced':
        setValue('minProfitPercent', 0.5);
        setValue('maxSlippage', 1.0);
        setValue('autoExecute', true);
        setValue('selectedMarkets', ['uniswap_v3', 'sushiswap', 'oneinch_limit', 'curve']);
        break;
      case 'conservative':
        setValue('minProfitPercent', 1.0);
        setValue('maxSlippage', 0.5);
        setValue('autoExecute', false);
        setValue('selectedMarkets', ['uniswap_v3', 'oneinch_limit']);
        break;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Token Pair Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <TokenSelector
            label="Base Token (Asset to Arbitrage)"
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
      <Card className="border-purple-200 dark:border-purple-800">
        <CardContent className="p-4">
          <h4 className="font-medium mb-3 text-purple-800 dark:text-purple-200">Arbitrage Presets</h4>
          <div className="grid grid-cols-3 gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset('fast')}
              className="flex flex-col h-auto p-3 border-orange-200 dark:border-orange-800"
            >
              <span className="font-medium text-orange-700 dark:text-orange-300">Fast</span>
              <span className="text-xs text-gray-500">0.2% min profit</span>
              <Badge variant="secondary" className="mt-1 text-xs">High Frequency</Badge>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset('balanced')}
              className="flex flex-col h-auto p-3 border-blue-200 dark:border-blue-800"
            >
              <span className="font-medium text-blue-700 dark:text-blue-300">Balanced</span>
              <span className="text-xs text-gray-500">0.5% min profit</span>
              <Badge variant="secondary" className="mt-1 text-xs">Recommended</Badge>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset('conservative')}
              className="flex flex-col h-auto p-3 border-green-200 dark:border-green-800"
            >
              <span className="font-medium text-green-700 dark:text-green-300">Conservative</span>
              <span className="text-xs text-gray-500">1.0% min profit</span>
              <Badge variant="secondary" className="mt-1 text-xs">Manual</Badge>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Arbitrage Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium">Profit Parameters</h4>
          
          <div>
            <label className="block text-sm font-medium mb-2">Minimum Profit (%)</label>
            <input
              type="number"
              step="0.1"
              {...register('minProfitPercent', { 
                required: 'Minimum profit is required',
                min: { value: 0.1, message: 'Minimum 0.1%' },
                max: { value: 10, message: 'Maximum 10%' }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800"
            />
            {errors.minProfitPercent && (
              <p className="text-red-500 text-sm mt-1">{errors.minProfitPercent.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">Only execute trades with at least this profit margin</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Max Slippage (%)</label>
            <input
              type="number"
              step="0.1"
              {...register('maxSlippage', { 
                required: 'Max slippage is required',
                min: { value: 0.1, message: 'Minimum 0.1%' },
                max: { value: 5, message: 'Maximum 5%' }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum acceptable slippage per trade</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Max Position Size</label>
            <input
              {...register('maxPositionSize', { 
                required: 'Max position size is required',
                pattern: { value: /^\d+$/, message: 'Must be a valid number' }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800"
              placeholder="500000000"
            />
            <p className="text-xs text-gray-500 mt-1">Max amount per arbitrage (500 USDT = 500000000)</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Market Selection</h4>
          
          <div className="space-y-3">
            {availableMarkets.map((market) => (
              <div
                key={market.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedMarkets.includes(market.id)
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                }`}
                onClick={() => toggleMarket(market.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedMarkets.includes(market.id)}
                      onChange={() => toggleMarket(market.id)}
                      className="w-4 h-4 text-purple-600"
                    />
                    <div>
                      <p className="font-medium">{market.name}</p>
                      <p className="text-xs text-gray-500">Fee: {market.fee}% • Min: {market.minSize}</p>
                    </div>
                  </div>
                  <Badge variant={market.type === 'DEX' ? 'default' : 'secondary'}>
                    {market.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              {...register('autoExecute')}
              className="w-4 h-4 text-purple-600"
            />
            <label className="text-sm font-medium">
              Auto-execute profitable opportunities
            </label>
          </div>
          <p className="text-xs text-gray-500">
            When enabled, trades execute automatically when opportunities are found
          </p>
        </div>
      </div>

      {/* Strategy Preview */}
      <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
        <CardContent className="p-4">
          <h4 className="font-medium mb-3 text-purple-800 dark:text-purple-200">Arbitrage Strategy Preview</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Target Markets</p>
              <p className="font-medium">{selectedMarkets.length} markets selected</p>
              <p className="text-xs text-gray-500">More markets = more opportunities</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Profit Threshold</p>
              <p className="font-medium">{minProfitPercent}% minimum</p>
              <p className="text-xs text-gray-500">Lower = more trades</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Execution Mode</p>
              <p className="font-medium">{autoExecute ? 'Automatic' : 'Manual'}</p>
              <p className="text-xs text-gray-500">
                {autoExecute ? 'Trades execute instantly' : 'Review before execution'}
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border">
            <p className="text-sm text-purple-700 dark:text-purple-300">
              ⚡ <strong>How it works:</strong> The arbitrage bot continuously scans {selectedMarkets.length} markets 
              for price differences. When a {minProfitPercent}%+ profit opportunity is found, it {autoExecute ? 'automatically' : 'alerts you to'} 
              execute simultaneous buy/sell orders to capture the price difference.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button
          type="submit"
          disabled={isCreating || !address || !baseToken || !quoteToken || selectedMarkets.length < 2}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {isCreating ? 'Creating Arbitrage Strategy...' : 'Create Arbitrage Strategy'}
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