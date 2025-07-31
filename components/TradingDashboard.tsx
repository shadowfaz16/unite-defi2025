'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { WalletConnection } from './WalletConnection';
import { PortfolioOverview } from './PortfolioOverview';
import { StrategyPanel } from './StrategyPanel';
import { OrderBook } from './OrderBook';
import { PriceChart } from './PriceChart';
import { DemoShowcase } from './DemoShowcase';
import { LandingPage } from './LandingPage';
import { useWeb3 } from '../lib/hooks/useWeb3';

export function TradingDashboard() {
  const [activeTab, setActiveTab] = useState<'home' | 'strategies' | 'orders' | 'portfolio' | 'analytics' | 'demo'>('home');
  const { isConnected } = useWeb3();

  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'demo', label: 'Demo Showcase', icon: '🎬' },
    { id: 'strategies', label: 'Advanced Strategies', icon: '🎯' },
    { id: 'orders', label: 'Order Management', icon: '📊' },
    { id: 'portfolio', label: 'Portfolio', icon: '💼' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
  ] as const;

  return (
    <div className="bg-gradient-to-br dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                1inch Advanced Trading Hub
              </div>
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span>Live</span>
              </div>
            </div>
            <WalletConnection />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' ? (
          <LandingPage />
        ) : !isConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to Advanced Trading
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
                Experience cutting-edge trading strategies with 1inch Limit Order Protocol. 
                Create TWAP orders, DCA strategies, synthetic options, and concentrated liquidity positions.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="text-center p-6">
                  <div className="text-3xl mb-3">⚡</div>
                  <h3 className="font-semibold mb-2">Advanced Strategies</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    TWAP, DCA, Options, and Concentrated Liquidity
                  </p>
                </Card>
                <Card className="text-center p-6">
                  <div className="text-3xl mb-3">🔗</div>
                  <h3 className="font-semibold mb-2">Multi-API Integration</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Fusion, Balance, Portfolio, and Price APIs
                  </p>
                </Card>
                <Card className="text-center p-6">
                  <div className="text-3xl mb-3">🛡️</div>
                  <h3 className="font-semibold mb-2">MEV Protection</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gas-free swaps with sandwich attack protection
                  </p>
                </Card>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Connect your wallet to get started
              </p>
              <WalletConnection />
            </div>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="flex space-x-1 mb-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content Areas */}
            <div className="space-y-8">
              {activeTab === 'demo' && (
                <DemoShowcase />
              )}

              {activeTab === 'strategies' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <StrategyPanel />
                  </div>
                  <div className="space-y-6">
                    <PriceChart />
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Quick Stats</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Active Strategies:</span>
                            <span className="font-semibold">3</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Total Volume:</span>
                            <span className="font-semibold">$12,450</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">24h PnL:</span>
                            <span className="font-semibold text-green-600">+$234.56</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <OrderBook />
                  <Card>
                    <CardHeader>
                      <CardTitle>Order History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="text-center text-gray-500 py-8">
                          Order history will appear here
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'portfolio' && (
                <PortfolioOverview />
              )}

              {activeTab === 'analytics' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center text-gray-500 py-8">
                        Analytics dashboard coming soon
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Risk Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center text-gray-500 py-8">
                        Risk analysis tools coming soon
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}