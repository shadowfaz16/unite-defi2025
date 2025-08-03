'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useWeb3 } from '../lib/hooks/useWeb3';
import { useWalletBalances, usePortfolioAnalytics, useCrossChainPortfolio } from '../lib/hooks/useOneInchAPIs';
import { TransactionHistory } from './TransactionHistory';

export function PortfolioOverview() {
  const { address, chain } = useWeb3();
  const chainId = chain?.id || 1;
  
  const { data: balances, isLoading: balancesLoading } = useWalletBalances(chainId, address);
  const { data: analytics, isLoading: analyticsLoading } = usePortfolioAnalytics(chainId, address);
  const { data: crossChain, isLoading: crossChainLoading } = useCrossChainPortfolio(address);

  if (!address) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">👛</div>
        <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your wallet to view your portfolio across multiple chains
        </p>
      </div>
    );
  }

  const isLoading = balancesLoading || analyticsLoading || crossChainLoading;

  return (
    <div className="space-y-8">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Value</p>
                <p className="text-2xl font-bold">
                  ${crossChain ? crossChain.totalValueUSD.toLocaleString() : '0'}
                </p>
              </div>
              <div className="text-3xl opacity-80">💰</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">24h P&L</p>
                <p className="text-2xl font-bold">
                  +${analytics?.pnl24h.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="text-3xl opacity-80">📈</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Active Chains</p>
                <p className="text-2xl font-bold">
                  {crossChain ? crossChain.chainCount : '0'}
                </p>
              </div>
              <div className="text-3xl opacity-80">🔗</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Diversification</p>
                <p className="text-2xl font-bold">
                  {analytics?.diversificationScore || '0'}%
                </p>
              </div>
              <div className="text-3xl opacity-80">🎯</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Chain Holdings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>💎</span>
              <span>Holdings on {chain?.name || 'Current Chain'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : balances?.success && balances.data.length > 0 ? (
              <div className="space-y-4">
                {balances.data.slice(0, 5).map((balance, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {balance.token.symbol?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-medium">{balance.token.symbol || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">
                          {parseFloat(balance.balance).toFixed(4)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${balance.balanceUSD.toFixed(2)}</div>
                      <div className="text-sm text-green-600">+2.5%</div>
                    </div>
                  </div>
                ))}
                
                {balances.data.length > 5 && (
                  <Button variant="outline" className="w-full">
                    View All {balances.data.length} Assets
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">💰</div>
                <p>No assets found</p>
                <p className="text-sm">Make sure you&apos;re on the right network</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cross-Chain Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🌐</span>
              <span>Cross-Chain Portfolio</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {crossChainLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            ) : crossChain ? (
              <div className="space-y-4">
                {Object.entries(crossChain.balancesByChain).map(([chainId, balances]) => {
                  const chainValue = balances.reduce((sum, balance) => sum + balance.balanceUSD, 0);
                  const chainNames: Record<string, string> = {
                    '1': 'Ethereum',
                    '137': 'Polygon',
                    '56': 'BSC',
                    '43114': 'Avalanche'
                  };
                  
                  return (
                    <div key={chainId} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {chainNames[chainId]?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-medium">{chainNames[chainId] || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{balances.length} assets</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${chainValue.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">
                          {((chainValue / crossChain.totalValueUSD) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">🔗</div>
                <p>No cross-chain data</p>
                <p className="text-sm">Loading portfolio across networks...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <TransactionHistory limit={10} />
    </div>
  );
}