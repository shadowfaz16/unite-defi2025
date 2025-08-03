"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useWeb3 } from "../lib/hooks/useWeb3";
import {
  useWalletBalances,
  usePortfolioAnalytics,
  useCrossChainPortfolio,
  usePortfolioValue,
} from "../lib/hooks/useOneInchAPIs";
import { TransactionHistory } from "./TransactionHistory";

export function PortfolioOverview() {
  const { address, chain } = useWeb3();
  const chainId = chain?.id || 1;

  const { data: balances, isLoading: balancesLoading } = useWalletBalances(
    chainId,
    address
  );
  const { data: analytics, isLoading: analyticsLoading } =
    usePortfolioAnalytics(chainId, address);
  const { data: crossChain, isLoading: crossChainLoading } =
    useCrossChainPortfolio(address);

  if (!address) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
          Connect Your Wallet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Connect your wallet to view your portfolio across multiple chains
        </p>
      </div>
    );
  }

  const isLoading = balancesLoading || analyticsLoading || crossChainLoading;

  return (
    <div className="space-y-10">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardTitle className="">
            <div className="space-y-2">
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                ${crossChain ? crossChain.totalValueUSD.toLocaleString() : "0"}
              </p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Total Value
              </p>
            </div>
          </CardTitle>
        </Card>

        <Card className="p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardTitle className="">
            <div className="space-y-2">
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                +${analytics?.pnl24h.toFixed(2) || "0.00"}
              </p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                24h P&L
              </p>
            </div>{" "}
          </CardTitle>
        </Card>

        <Card className="p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardTitle className="">
            <div className="space-y-2">
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {crossChain ? crossChain.chainCount : "0"}
              </p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Active Chains
              </p>
            </div>{" "}
          </CardTitle>
        </Card>

        <Card className="p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardTitle className="">
            <div className="space-y-2">
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {analytics?.diversificationScore || "0"}%
              </p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Diversification
              </p>
            </div>{" "}
          </CardTitle>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Chain Holdings */}
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Holdings on {chain?.name || "Current Chain"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : balances?.success && balances.data.length > 0 ? (
              <div className="space-y-4">
                {balances.data.slice(0, 5).map((balance, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 text-sm font-semibold">
                        {balance.token.symbol?.charAt(0) || "?"}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {balance.token.symbol || "Unknown"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {parseFloat(balance.balance).toFixed(4)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        ${balance.balanceUSD.toFixed(2)}
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                        +2.5%
                      </div>
                    </div>
                  </div>
                ))}

                {balances.data.length > 5 && (
                  <Button variant="outline" className="w-full mt-4">
                    View All {balances.data.length} Assets
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <p className="font-medium mb-2">No assets found</p>
                <p className="text-sm">
                  Make sure you&apos;re on the right network
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cross-Chain Summary */}
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Cross-Chain Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {crossChainLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            ) : crossChain ? (
              <div className="space-y-4">
                {Object.entries(crossChain.valuesByChain || {})
                  .filter(([_, value]) => value > 0) // Only show chains with value
                  .map(([chainId, chainValue]) => {
                    const balances = crossChain.balancesByChain?.[parseInt(chainId)] || [];
                    const chainNames: Record<string, string> = {
                      "1": "Ethereum",
                      "137": "Polygon",
                      "56": "BSC",
                      "43114": "Avalanche",
                    };

                    return (
                      <div
                        key={chainId}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 text-xs font-semibold">
                            {chainNames[chainId]?.charAt(0) || "?"}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {chainNames[chainId] || "Unknown"}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {balances.length} assets
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            ${chainValue.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {crossChain.totalValueUSD > 0 ? (
                              (chainValue / crossChain.totalValueUSD * 100).toFixed(1)
                            ) : (
                              "0"
                            )}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <p className="font-medium mb-2">No cross-chain data</p>
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
