'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { TWAPCreator } from './strategies/TWAPCreator';
import { DCACreator } from './strategies/DCACreator';
import { OptionsCreator } from './strategies/OptionsCreator';
import { ConcentratedLiquidityCreator } from './strategies/ConcentratedLiquidityCreator';
import { GridTradingCreator } from './strategies/GridTradingCreator';
import { ArbitrageCreator } from './strategies/ArbitrageCreator';
import { useTradingStore } from '../lib/stores/tradingStore';
import { ChevronDown, ChevronRight, Settings, Trash2, Play, Pause } from 'lucide-react';

export function StrategyPanel() {
  const [activeCreator, setActiveCreator] = useState<string | null>(null);
  const [expandedStrategies, setExpandedStrategies] = useState<Set<string>>(new Set());
  const { strategies, getActiveStrategies, updateStrategy, removeStrategy } = useTradingStore();
  
  const activeStrategies = getActiveStrategies()
    .sort((a, b) => b.createdAt - a.createdAt); // Sort by newest first

  const toggleStrategyExpansion = (strategyId: string) => {
    const newExpanded = new Set(expandedStrategies);
    if (newExpanded.has(strategyId)) {
      newExpanded.delete(strategyId);
    } else {
      newExpanded.add(strategyId);
    }
    setExpandedStrategies(newExpanded);
  };

  const toggleStrategyStatus = (strategyId: string, currentStatus: boolean) => {
    updateStrategy(strategyId, { isActive: !currentStatus });
  };

  const deleteStrategy = (strategyId: string) => {
    if (confirm('Are you sure you want to delete this strategy?')) {
      removeStrategy(strategyId);
    }
  };

  const strategyTypes = [
    {
      id: 'grid',
      name: 'Grid Trading',
      description: 'Automated buy low/sell high strategy with profit capture',
      icon: '📊',
      color: 'from-blue-500 to-indigo-600',
      featured: true,
    },
    {
      id: 'arbitrage',
      name: 'Multi-Market Arbitrage',
      description: 'Auto-detect price differences and execute across markets',
      icon: '⚡',
      color: 'from-purple-500 to-pink-600',
      featured: true,
    },
    {
      id: 'dca',
      name: 'Smart DCA',
      description: 'Dollar Cost Averaging with intelligent price conditions',
      icon: '💰',
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: 'twap',
      name: 'TWAP Orders',
      description: 'Time-Weighted Average Price for large order execution',
      icon: '⏱️',
      color: 'from-cyan-500 to-blue-600',
    },
    {
      id: 'options',
      name: 'Synthetic Options',
      description: 'Advanced call/put options using limit orders',
      icon: '🎯',
      color: 'from-violet-500 to-purple-600',
    },
    {
      id: 'liquidity',
      name: 'Concentrated Liquidity',
      description: 'Uniswap V3-style automated liquidity management',
      icon: '🌊',
      color: 'from-orange-500 to-red-600',
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
            <div className="space-y-6">
              {/* Featured Strategies */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-lg font-semibold">🔥 Featured Strategies</span>
                  <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded text-xs font-medium">
                    JUDGES PICK
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {strategyTypes.filter(s => s.featured).map((strategy) => (
                    <div
                      key={strategy.id}
                      className="group cursor-pointer"
                      onClick={() => setActiveCreator(strategy.id)}
                    >
                      <div className={`p-6 rounded-xl bg-gradient-to-br ${strategy.color} hover:scale-105 transition-transform duration-200 text-white relative overflow-hidden`}>
                        <div className="absolute top-2 right-2">
                          <span className="bg-white/20 px-2 py-1 rounded text-xs font-medium">
                            ⭐ FEATURED
                          </span>
                        </div>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-2xl mb-2">{strategy.icon}</div>
                            <h3 className="font-semibold text-lg mb-2">{strategy.name}</h3>
                            <p className="text-sm opacity-90">{strategy.description}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity mt-8 cursor-pointer"
                          >
                            Create
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Other Strategies */}
              <div>
                <h3 className="text-lg font-semibold mb-4">📈 Classic Strategies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {strategyTypes.filter(s => !s.featured).map((strategy) => (
                    <div
                      key={strategy.id}
                      className="group cursor-pointer"
                      onClick={() => setActiveCreator(strategy.id)}
                    >
                      <div className={`p-4 rounded-xl bg-gradient-to-br ${strategy.color} hover:scale-105 transition-transform duration-200 text-white`}>
                        <div className="text-center">
                          <div className="text-2xl mb-2">{strategy.icon}</div>
                          <h3 className="font-semibold text-base mb-2">{strategy.name}</h3>
                          <p className="text-xs opacity-90">{strategy.description}</p>
                          <Button 
                            size="sm" 
                            variant="secondary" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity mt-3 w-full bg-white hover:bg-gray-100 cursor-pointer"
                          >
                            Create
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
              
              {activeCreator === 'grid' && <GridTradingCreator onClose={() => setActiveCreator(null)} />}
              {activeCreator === 'arbitrage' && <ArbitrageCreator onClose={() => setActiveCreator(null)} />}
              {activeCreator === 'dca' && <DCACreator onClose={() => setActiveCreator(null)} />}
              {activeCreator === 'twap' && <TWAPCreator onClose={() => setActiveCreator(null)} />}
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
              {activeStrategies.map((strategy) => {
                const isExpanded = expandedStrategies.has(strategy.id);
                const isActive = strategy.isActive;
                
                return (
                  <div
                    key={strategy.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {/* Strategy Header - Clickable */}
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => toggleStrategyExpansion(strategy.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                          <div className="flex items-center space-x-2">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">{strategy.name}</h4>
                            <p className="text-sm text-gray-500">{strategy.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                            {strategy.type}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStrategyStatus(strategy.id, isActive);
                            }}
                          >
                            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteStrategy(strategy.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
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
                          <span className={`ml-1 font-medium ${isActive ? 'text-green-600' : 'text-gray-600'}`}>
                            {isActive ? 'Active' : 'Paused'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <span className="ml-1 font-medium">{strategy.type}</span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
                        <div className="space-y-4">
                          {/* Strategy Parameters */}
                          <div>
                            <h5 className="font-medium text-sm mb-2 flex items-center space-x-2">
                              <Settings className="w-4 h-4" />
                              <span>Strategy Parameters</span>
                            </h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              {Object.entries(strategy.parameters).map(([key, value]) => {
                                // Handle token objects specially
                                let displayValue = String(value);
                                
                                // Handle different token parameter names
                                if (['fromToken', 'toToken', 'baseToken', 'quoteToken'].includes(key)) {
                                  if (value && typeof value === 'object' && 'symbol' in value) {
                                    displayValue = value.symbol;
                                  }
                                }
                                
                                // Handle amount per order with proper decimal formatting
                                if (key === 'amountPerOrder' && strategy.parameters.fromToken) {
                                  const fromToken = strategy.parameters.fromToken;
                                  if (fromToken && typeof fromToken === 'object' && 'decimals' in fromToken) {
                                    const decimals = fromToken.decimals || 18;
                                    const amount = BigInt(value);
                                    const divisor = BigInt(10 ** decimals);
                                    const wholePart = amount / divisor;
                                    const fractionalPart = amount % divisor;
                                    
                                    let formattedAmount = wholePart.toString();
                                    if (fractionalPart > 0) {
                                      const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
                                      // Remove trailing zeros
                                      const trimmedFractional = fractionalStr.replace(/0+$/, '');
                                      if (trimmedFractional) {
                                        formattedAmount += '.' + trimmedFractional;
                                      }
                                    }
                                    
                                    displayValue = `${formattedAmount} ${fromToken.symbol || ''}`;
                                  }
                                }
                                
                                // Handle total capital with proper decimal formatting
                                if (key === 'totalCapital' && (strategy.parameters.baseToken || strategy.parameters.fromToken)) {
                                  const token = strategy.parameters.baseToken || strategy.parameters.fromToken;
                                  if (token && typeof token === 'object' && 'decimals' in token) {
                                    const decimals = token.decimals || 18;
                                    const amount = BigInt(value);
                                    const divisor = BigInt(10 ** decimals);
                                    const wholePart = amount / divisor;
                                    const fractionalPart = amount % divisor;
                                    
                                    let formattedAmount = wholePart.toString();
                                    if (fractionalPart > 0) {
                                      const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
                                      // Remove trailing zeros
                                      const trimmedFractional = fractionalStr.replace(/0+$/, '');
                                      if (trimmedFractional) {
                                        formattedAmount += '.' + trimmedFractional;
                                      }
                                    }
                                    
                                    displayValue = `${formattedAmount} ${token.symbol || ''}`;
                                  }
                                }
                                
                                // Handle price values with proper formatting
                                if (['lowerPrice', 'upperPrice', 'currentGridCenter', 'profitPercentage'].includes(key)) {
                                  if (typeof value === 'number') {
                                    displayValue = value.toFixed(2);
                                  }
                                }
                                
                                // Handle boolean values
                                if (typeof value === 'boolean') {
                                  displayValue = value ? 'Yes' : 'No';
                                }
                                
                                // Handle maker address formatting
                                if (key === 'maker' && typeof value === 'string' && value.startsWith('0x')) {
                                  const address = value;
                                  displayValue = `${address.slice(0, 6)}...${address.slice(-4)}`;
                                }
                                
                                // Handle timestamp values
                                if (key === 'lastRebalanceTime' && typeof value === 'number') {
                                  displayValue = new Date(value).toLocaleString();
                                }
                                
                                // Handle numeric values that should be displayed as numbers
                                if (['gridLevels', 'totalOrders', 'executedOrders', 'totalTrades', 'successfulTrades', 'filledOrders'].includes(key)) {
                                  if (typeof value === 'number' || typeof value === 'string') {
                                    displayValue = String(value);
                                  }
                                }
                                
                                // Handle total profit with proper formatting
                                if (key === 'totalProfit' && typeof value === 'number') {
                                  displayValue = value.toFixed(4);
                                }
                                
                                return (
                                  <div key={key} className="bg-white dark:bg-gray-800 p-2 rounded border">
                                    <div className="text-gray-500 text-xs">{key}</div>
                                    <div className="font-medium">{displayValue}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Strategy Timeline */}
                          <div>
                            <h5 className="font-medium text-sm mb-2">Timeline</h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Created:</span>
                                <span>{new Date(strategy.createdAt).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Last Updated:</span>
                                <span>{new Date(strategy.updatedAt).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Age:</span>
                                <span>{Math.floor((Date.now() - strategy.createdAt) / (1000 * 60 * 60 * 24))} days</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}