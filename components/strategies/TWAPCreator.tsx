'use client';

import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useForm } from 'react-hook-form';
import { useTradingStore } from '../../lib/stores/tradingStore';
import { TWAPStrategy } from '../../lib/strategies/twap';
import { useWeb3 } from '../../lib/hooks/useWeb3';
import { TokenSelector } from '../TokenSelector';
import { Wallet } from 'ethers';
import type { Token } from '../../lib/types';

interface TWAPFormData {
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
  const [fromToken, setFromToken] = useState<Token | undefined>();
  const [toToken, setToToken] = useState<Token | undefined>();
  const { address } = useWeb3();
  const { addStrategy } = useTradingStore();
  
  const { register, handleSubmit, formState: { errors } } = useForm<TWAPFormData>({
    defaultValues: {
      totalAmount: '1000', // User-friendly format (will be converted to wei/decimals)
      numberOfOrders: 10,
      intervalMinutes: 30,
      slippageTolerance: 1,
    },
  });

  // Helper function to convert user amount to token decimals
  const convertAmountToDecimals = (amount: string, token: Token): string => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) return '0';
    return (BigInt(Math.floor(parsedAmount * (10 ** token.decimals)))).toString();
  };

  // Helper function to get amount label based on selected tokens
  const getAmountLabel = (): string => {
    if (!fromToken) return 'Total Amount to Spend';
    return `Total Amount (${fromToken.symbol})`;
  };

  // Helper function to get default amount based on token
  const getDefaultAmount = (token: Token): string => {
    if (token.symbol === 'USDT' || token.symbol === 'USDC') return '1000';
    if (token.symbol === 'WETH') return '0.5';
    if (token.symbol === 'WBTC') return '0.02';
    if (token.symbol === '1INCH') return '2000';
    return '1000';
  };

  const onSubmit = async (data: TWAPFormData) => {
    if (!address || !fromToken || !toToken) return;
    
    setIsCreating(true);
    try {
      // Convert user-friendly amount to token decimals
      const totalAmountInDecimals = convertAmountToDecimals(data.totalAmount, fromToken);
      
      // Get the best available signer (connected wallet preferred, mock as fallback)
      const { WalletIntegration } = await import('../../lib/strategies/wallet-integration');
      const signer = await WalletIntegration.getBestAvailableSigner();
      const isRealWallet = await WalletIntegration.isUsingRealWallet();
      
      console.log(`🔐 Using ${isRealWallet ? 'REAL connected wallet' : 'mock wallet for demo'}`);
      
      const twapStrategy = new TWAPStrategy(signer as any, 1);
      
      const strategy = await twapStrategy.createTWAPStrategy({
        fromToken,
        toToken,
        totalAmount: totalAmountInDecimals,
        numberOfOrders: data.numberOfOrders,
        intervalMinutes: data.intervalMinutes,
        slippageTolerance: data.slippageTolerance,
        maker: address,
      });

      // Add to store first
      addStrategy(strategy);

      // Actually try to execute the first TWAP order using the strategy API
      console.log('🚀 Creating and executing TWAP strategy...', strategy);
      console.log('📊 Strategy parameters:', {
        fromToken: strategy.parameters.fromToken.symbol,
        toToken: strategy.parameters.toToken.symbol,
        totalAmount: strategy.parameters.totalAmount,
        numberOfOrders: strategy.parameters.numberOfOrders,
        intervalMinutes: strategy.parameters.intervalMinutes,
        nextExecutionTime: strategy.parameters.nextExecutionTime,
        currentTime: Date.now()
      });
      
      try {
        console.log('⚡ Executing first TWAP order...');
        // Execute the first order immediately to test the API
        const twapOrder = await twapStrategy.executeNextTWAPOrder(strategy);
        if (twapOrder) {
          console.log('✅ First TWAP order executed successfully:', twapOrder);
          console.log('💾 Order should be stored in localStorage with key: custom_twap_orders');
          
          // Check localStorage after order creation
          const storedOrders = JSON.parse(localStorage.getItem('custom_twap_orders') || '[]');
          console.log('📁 Current TWAP orders in storage:', storedOrders.length);
          console.log('📝 Stored order details:', storedOrders);
          
          alert(`TWAP Strategy Created! First order executed: ${twapOrder.id}\nCheck browser console for detailed logs.`);
        } else {
          console.log('⏳ TWAP strategy created, first order scheduled for later execution');
          console.log('🕐 Next execution time:', new Date(strategy.parameters.nextExecutionTime));
          alert('TWAP Strategy Created! Orders will be executed according to schedule.');
        }
      } catch (apiError) {
        console.error('❌ API execution error (strategy still saved):', apiError);
        console.error('📍 Error details:', {
          message: (apiError as Error).message,
          stack: (apiError as Error).stack
        });
        alert('TWAP Strategy Created! (Note: API execution had issues but strategy is saved)\nCheck browser console for error details.');
      }

      onClose();
    } catch (error) {
      console.error('Error creating TWAP strategy:', error);
      alert('Error creating TWAP strategy: ' + (error as Error).message);
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
            label="From Token (Spend)"
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

        {/* TWAP Parameters */}
        <div className="space-y-4">
          <h4 className="font-medium">TWAP Parameters</h4>
          
          <div>
            <label className="block text-sm font-medium mb-2">{getAmountLabel()}</label>
            <input
              type="number"
              step="any"
              {...register('totalAmount', { 
                required: 'Total amount is required',
                pattern: { value: /^\d*\.?\d+$/, message: 'Must be a valid number' },
                min: { value: 0.000001, message: 'Amount must be greater than 0' }
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              placeholder={fromToken ? getDefaultAmount(fromToken) : "1000"}
            />
            {errors.totalAmount && (
              <p className="text-red-500 text-sm mt-1">{errors.totalAmount.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {fromToken 
                ? `Enter total amount in ${fromToken.symbol} to be split across orders (e.g., ${getDefaultAmount(fromToken)} ${fromToken.symbol})`
                : 'Select tokens first to see amount format'
              }
            </p>
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
          disabled={isCreating || !address || !fromToken || !toToken}
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