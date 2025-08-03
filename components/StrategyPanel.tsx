'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { TWAPCreator } from './strategies/TWAPCreator';
import { DCACreator } from './strategies/DCACreator';
import { OptionsCreator } from './strategies/OptionsCreator';
import { ConcentratedLiquidityCreator } from './strategies/ConcentratedLiquidityCreator';
import { TestStrategyPanel } from './TestStrategyPanel';
import { useTradingStore } from '../lib/stores/tradingStore';

export function StrategyPanel() {
  const [activeCreator, setActiveCreator] = useState<string | null>(null);
  const { strategies, getActiveStrategies } = useTradingStore();
  
  const activeStrategies = getActiveStrategies();

  const strategyTypes = [
    {
      id: 'twap',
      name: 'TWAP Orders',
      description: 'Time-Weighted Average Price splitting large orders over time',
      icon: '⏱️',
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'dca',
      name: 'DCA Strategy',
      description: 'Dollar Cost Averaging with smart price conditions',
      icon: '💰',
      color: 'from-green-500 to-green-600',
    },
    {
      id: 'options',
      name: 'Synthetic Options',
      description: 'Call/Put options using conditional limit orders',
      icon: '🎯',
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 'liquidity',
      name: 'Concentrated Liquidity',
      description: 'Uniswap V3-style liquidity provision with auto-rebalancing',
      icon: '🌊',
      color: 'from-orange-500 to-orange-600',
    },
    {
      id: 'test',
      name: 'Test Strategy',
      description: 'Test limit order creation with custom parameters (1 USDT -> 0.1 1INCH)',
      icon: '🧪',
      color: 'from-yellow-500 to-yellow-600',
    }
  ];

  return (
    <div className="space-y-6">
      {/* Strategy Creation Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🚀</span>
            <span>Create Advanced Strategy</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!activeCreator ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strategyTypes.map((strategy) => (
                <div
                  key={strategy.id}
                  className="group cursor-pointer"
                  onClick={() => setActiveCreator(strategy.id)}
                >
                  <div className={`p-6 rounded-xl bg-gradient-to-br ${strategy.color} hover:scale-105 transition-transform duration-200 text-white`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-2xl mb-2">{strategy.icon}</div>
                        <h3 className="font-semibold text-lg mb-2">{strategy.name}</h3>
                        <p className="text-sm opacity-90">{strategy.description}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Create {strategyTypes.find(s => s.id === activeCreator)?.name}
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveCreator(null)}
                >
                  ← Back
                </Button>
              </div>
              
              {activeCreator === 'test' && <TestStrategyPanel onTestComplete={() => setActiveCreator(null)} />}
              {activeCreator === 'twap' && <TWAPCreator onClose={() => setActiveCreator(null)} />}
              {activeCreator === 'dca' && <DCACreator onClose={() => setActiveCreator(null)} />}
              {activeCreator === 'options' && <OptionsCreator onClose={() => setActiveCreator(null)} />}
              {activeCreator === 'liquidity' && <ConcentratedLiquidityCreator onClose={() => setActiveCreator(null)} />}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Strategies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <span>📊</span>
              <span>Active Strategies</span>
            </span>
            <span className="text-sm font-normal text-gray-500">
              {activeStrategies.length} active
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeStrategies.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">🎯</div>
              <p>No active strategies</p>
              <p className="text-sm">Create your first advanced trading strategy above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeStrategies.map((strategy) => (
                <div
                  key={strategy.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <div>
                        <h4 className="font-medium">{strategy.name}</h4>
                        <p className="text-sm text-gray-500">{strategy.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        {strategy.type}
                      </span>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-1 font-medium">
                        {new Date(strategy.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className="ml-1 font-medium text-green-600">Active</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="ml-1 font-medium">{strategy.type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}