'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useWeb3 } from '../lib/hooks/useWeb3';
import { useTransactionHistory } from '../lib/hooks/useOneInchAPIs';
import { TransactionHistoryEvent } from '../lib/types';
import { formatDistanceToNow } from 'date-fns';

interface TransactionHistoryProps {
  limit?: number;
}

export function TransactionHistory({ limit = 10 }: TransactionHistoryProps) {
  const { address, chain } = useWeb3();
  const chainId = chain?.id || 1;
  const [showAll, setShowAll] = useState(false);
  
  const { data: historyData, isLoading, error } = useTransactionHistory(address, chainId, limit);

  const initialDisplayCount = 5;
  const transactions = historyData?.success ? historyData.data.items : [];
  const displayedTransactions = showAll ? transactions : transactions.slice(0, initialDisplayCount);
  const hasMoreTransactions = transactions.length > initialDisplayCount;

  if (!address) {
    return null;
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'swap':
      case 'swapexactinput':
      case 'swapexactoutput':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'send':
      case 'transfer':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'receive':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'approve':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'limitorderfill':
      case 'limitordercreate':
      case 'limitordercancel':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getDirectionIcon = (direction?: string, type?: string) => {
    if (direction === 'in' || type?.toLowerCase() === 'receive') return '↓';
    if (direction === 'out' || type?.toLowerCase() === 'send') return '↑';
    if (type?.toLowerCase().includes('swap')) return '↔️';
    if (type?.toLowerCase() === 'approve') return '✓';
    return '•';
  };

  const formatAmount = (amount: string, decimals: number = 18) => {
    const value = parseFloat(amount) / Math.pow(10, decimals);
    if (value === 0) return '0';
    if (value < 0.001) return '<0.001';
    if (value < 1) return value.toFixed(4);
    if (value < 1000) return value.toFixed(2);
    if (value < 1000000) return `${(value / 1000).toFixed(1)}K`;
    return `${(value / 1000000).toFixed(1)}M`;
  };

  const getTokenSymbol = (address: string) => {
    // Common token addresses and their symbols
    const tokenMap: Record<string, string> = {
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 'ETH',
      '0xa0b86a33e6776d8b3b60bb1b2c0e7edb4d06fb9e': 'USDC',
      '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT',
      '0x6b175474e89094c44da98b954eedeac495271d0f': 'DAI',
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'WBTC',
    };
    
    return tokenMap[address.toLowerCase()] || `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTransactionTitle = (transaction: TransactionHistoryEvent) => {
    const { type } = transaction.details;
    const mainAction = transaction.details.tokenActions[0];
    
    if (!mainAction) return type;

    const tokenSymbol = getTokenSymbol(mainAction.address);
    const amount = formatAmount(mainAction.amount);

    switch (type.toLowerCase()) {
      case 'swapexactinput':
      case 'swapexactoutput':
        const swapIn = transaction.details.tokenActions.find(a => a.direction === 'Out');
        const swapOut = transaction.details.tokenActions.find(a => a.direction === 'In');
        if (swapIn && swapOut) {
          return `Swap ${formatAmount(swapIn.amount)} ${getTokenSymbol(swapIn.address)} → ${formatAmount(swapOut.amount)} ${getTokenSymbol(swapOut.address)}`;
        }
        return `Swap ${amount} ${tokenSymbol}`;
      case 'send':
      case 'transfer':
        return `Send ${amount} ${tokenSymbol}`;
      case 'receive':
        return `Receive ${amount} ${tokenSymbol}`;
      case 'approve':
        return `Approve ${tokenSymbol}`;
      case 'limitorderfill':
        return `Limit Order Filled`;
      case 'limitordercreate':
        return `Limit Order Created`;
      case 'limitordercancel':
        return `Limit Order Cancelled`;
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>📜</span>
          <span>Transaction History</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3 p-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">
            <div className="text-4xl mb-2">❌</div>
            <p>Failed to load transaction history</p>
            {/* <p className="text-sm text-gray-500 mt-1">{error as string}</p> */}
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-3">
            {displayedTransactions.map((transaction) => (
              <div 
                key={transaction.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => window.open(`https://etherscan.io/tx/${transaction.details.txHash}`, '_blank')}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-lg">
                    {getDirectionIcon(transaction.direction, transaction.details.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">
                        {formatTransactionTitle(transaction)}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getTransactionTypeColor(transaction.details.type)}`}
                      >
                        {transaction.details.type}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                      <span>
                        {formatDistanceToNow(new Date(transaction.timeMs), { addSuffix: true })}
                      </span>
                      <span>•</span>
                      <span className={transaction.details.status === 'completed' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.details.status}
                      </span>
                      <span>•</span>
                      <span>Block {transaction.details.blockNumber}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Gas</div>
                  <div className="text-xs font-medium">
                    {formatAmount(transaction.details.feeInSmallestNative)} ETH
                  </div>
                </div>
              </div>
            ))}
            
            {/* Show More Button */}
            {hasMoreTransactions && !showAll && (
              <div className="text-center pt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAll(true)}
                  className="w-full"
                >
                  Show More ({transactions.length - initialDisplayCount} more)
                </Button>
              </div>
            )}

            {/* Show Less Button */}
            {showAll && hasMoreTransactions && (
              <div className="text-center pt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAll(false)}
                  className="w-full"
                >
                  Show Less
                </Button>
              </div>
            )}
            
            {/* View on Etherscan */}
            <div className="text-center pt-2 border-t border-gray-200 dark:border-gray-700">
              <button 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                onClick={() => window.open(`https://etherscan.io/address/${address}`, '_blank')}
              >
                View all transactions on Etherscan →
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">📭</div>
            <p>No transaction history found</p>
            <p className="text-sm">Start trading to see your transaction history here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}