'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useForm } from 'react-hook-form';
import { useTradingStore } from '../../lib/stores/tradingStore';
import { useWeb3 } from '../../lib/hooks/useWeb3';
import { TokenSelector } from '../TokenSelector';
import type { Token } from '../../lib/types';

interface DCAFormData {
  fromToken: Token;
  toToken: Token;
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
  const [fromToken, setFromToken] = useState<Token | undefined>();
  const [toToken, setToToken] = useState<Token | undefined>();
  const { address } = useWeb3();
  const { addStrategy } = useTradingStore();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<DCAFormData>({
    defaultValues: {
      amountPerOrder: '100', // User-friendly format (will be converted to wei/decimals)
      intervalHours: 24,
      totalOrders: 30,
      slippageTolerance: 1,
      enableSmartConditions: false,
    },
  });

  const enableSmartConditions = watch('enableSmartConditions');

  // Update amount placeholder when fromToken changes
  useEffect(() => {
    if (fromToken) {
      const form = document.querySelector('input[name="amountPerOrder"]') as HTMLInputElement;
      if (form && !form.value) {
        form.placeholder = getDefaultAmount(fromToken);
      }
    }
  }, [fromToken]);

  // Helper function to convert user amount to token decimals
  const convertAmountToDecimals = (amount: string, token: Token): string => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) return '0';
    return (BigInt(Math.floor(parsedAmount * (10 ** token.decimals)))).toString();
  };

  // Helper function to get amount label based on selected tokens
  const getAmountLabel = (): string => {
    if (!fromToken) return 'Amount per Order';
    return `Amount per Order (${fromToken.symbol})`;
  };

  // Helper function to get default amount based on token
  const getDefaultAmount = (token: Token): string => {
    if (token.symbol === 'USDT' || token.symbol === 'USDC') return '100';
    if (token.symbol === 'WETH') return '0.05';
    if (token.symbol === 'WBTC') return '0.002';
    if (token.symbol === '1INCH') return '200';
    return '100';
  };

  const onSubmit = async (data: DCAFormData) => {
    if (!address || !fromToken || !toToken) return;
    
    setIsCreating(true);
    try {
      // Convert user-friendly amount to token decimals
      const amountInDecimals = convertAmountToDecimals(data.amountPerOrder, fromToken);
      
      const strategy = {
        id: `dca_${Date.now()}`,
        type: 'DCA' as const,
        name: `DCA: ${data.amountPerOrder} ${fromToken.symbol} → ${toToken.symbol}`,
        description: `Buy ${toToken.symbol} with ${data.amountPerOrder} ${fromToken.symbol} every ${data.intervalHours} hours for ${data.totalOrders} times`,
        isActive: true,
        parameters: {
          fromToken,
          toToken,
          amountPerOrder: amountInDecimals,
          intervalHours: data.intervalHours,
          totalOrders: data.totalOrders,
          slippageTolerance: data.slippageTolerance,
          maker: address,
          executedOrders: 0,
          nextExecutionTime: Date.now() - 1000, // Set to past so first order executes immediately
          totalInvested: '0',
          smartConditions: enableSmartConditions ? {
            maxPriceThreshold: data.maxPriceThreshold,
            minPriceDropPercent: data.minPriceDropPercent,
          } : undefined,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Add to store first
      addStrategy(strategy);

      // Actually try to execute the first DCA order using the strategy API
      console.log('🚀 Creating and executing DCA strategy...', strategy);
      console.log('📊 Strategy parameters:', {
        fromToken: strategy.parameters.fromToken.symbol,
        toToken: strategy.parameters.toToken.symbol,
        amountPerOrder: strategy.parameters.amountPerOrder,
        intervalHours: strategy.parameters.intervalHours,
        nextExecutionTime: strategy.parameters.nextExecutionTime,
        currentTime: Date.now()
      });
      
      try {
        console.log('🔧 Initializing DCA strategy with wallet...');
        // Import and use the DCA strategy class
        const { DCAStrategy } = await import('../../lib/strategies/dca');
        const { WalletIntegration } = await import('../../lib/strategies/wallet-integration');
        
        // Get the best available signer (connected wallet preferred, mock as fallback)
        const signer = await WalletIntegration.getBestAvailableSigner();
        const isRealWallet = await WalletIntegration.isUsingRealWallet();
        
        console.log(`🔐 Using ${isRealWallet ? 'REAL connected wallet' : 'mock wallet for demo'}`);
        
        const dcaStrategy = new DCAStrategy(signer as any, 1);
        
        console.log('⚡ Executing first DCA order...');
        // Execute the first order immediately to test the API
        const dcaOrder = await dcaStrategy.executeNextDCAOrder(strategy);
        if (dcaOrder) {
          console.log('✅ First DCA order executed successfully:', dcaOrder);
          console.log('💾 Order should be stored in localStorage with key: custom_dca_orders');
          
          // Check localStorage after order creation
          const storedOrders = JSON.parse(localStorage.getItem('custom_dca_orders') || '[]');
          console.log('📁 Current DCA orders in storage:', storedOrders.length);
          console.log('📝 Stored order details:', storedOrders);
          
          alert(`DCA Strategy Created! First order executed: ${dcaOrder.id}\nCheck browser console for detailed logs.`);
        } else {
          console.log('⏳ DCA strategy created, first order scheduled for later execution');
          console.log('🕐 Next execution time:', new Date(strategy.parameters.nextExecutionTime));
          alert('DCA Strategy Created! Orders will be executed according to schedule.');
        }
      } catch (apiError) {
        console.error('❌ API execution error (strategy still saved):', apiError);
        console.error('📍 Error details:', {
          message: (apiError as Error).message,
          stack: (apiError as Error).stack
        });
        alert('DCA Strategy Created! (Note: API execution had issues but strategy is saved)\nCheck browser console for error details.');
      }

      onClose();
    } catch (error) {
      console.error('Error creating DCA strategy:', error);
      alert('Error creating DCA strategy: ' + (error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Token Pair Selection */}
        <div className="space-y-4">
          <h4 className="font-medium">Token Pair</h4>
          
          <TokenSelector
            label="From Token (Pay with)"
            selectedToken={fromToken}
            onTokenSelect={setFromToken}
            excludeTokens={toToken ? [toToken.address] : []}
            showUSDTFirst={true}
          />

          <TokenSelector
            label="To Token (Buy)"
            selectedToken={toToken}
            onTokenSelect={setToToken}
            excludeTokens={fromToken ? [fromToken.address] : []}
          />
        </div>

        {/* DCA Parameters */}
        <div className="space-y-4">
          <h4 className="font-medium">DCA Parameters</h4>
          
          <div>
            <label className="block text-sm font-medium mb-2">{getAmountLabel()}</label>
            <input
              type="number"
              step="any"
              {...register('amountPerOrder', { 
                required: 'Amount per order is required',
                pattern: { value: /^\d*\.?\d+$/, message: 'Must be a valid number' },
                min: { value: 0.000001, message: 'Amount must be greater than 0' }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800"
              placeholder={fromToken ? getDefaultAmount(fromToken) : "100"}
            />
            {errors.amountPerOrder && (
              <p className="text-red-500 text-sm mt-1">{errors.amountPerOrder.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {fromToken 
                ? `Enter amount in ${fromToken.symbol} (e.g., ${getDefaultAmount(fromToken)} ${fromToken.symbol})`
                : 'Select tokens first to see amount format'
              }
            </p>
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
            Smart conditions help you &quot;buy the dip&quot; by only executing DCA when favorable conditions are met.
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
          disabled={isCreating || !address || !fromToken || !toToken}
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