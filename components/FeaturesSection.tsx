'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export function FeaturesSection() {
  const strategies = [
    {
      icon: "⏱️",
      title: "TWAP Orders",
      description: "Time-Weighted Average Price splitting for large orders",
      features: ["Reduce market impact", "Configurable intervals", "Custom order counts", "Real-time tracking"],
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50/50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-800"
    },
    {
      icon: "💰", 
      title: "DCA Strategy",
      description: "Smart Dollar Cost Averaging with market conditions",
      features: ["Buy the dip automation", "Price threshold controls", "Regular interval purchasing", "Performance tracking"],
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50/50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-800"
    },
    {
      icon: "🎯",
      title: "Synthetic Options", 
      description: "Call/Put options using conditional limit orders",
      features: ["Greeks calculation", "Strike price controls", "Automatic exercise", "Risk management"],
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-50/50 dark:bg-purple-950/20",
      borderColor: "border-purple-200 dark:border-purple-800"
    },
    {
      icon: "🌊",
      title: "Concentrated Liquidity",
      description: "Uniswap V3-style automated market making",
      features: ["Auto-rebalancing", "Grid-based orders", "Fee optimization", "Impermanent loss tracking"],
      color: "from-orange-500 to-red-500", 
      bgColor: "bg-orange-50/50 dark:bg-orange-950/20",
      borderColor: "border-orange-200 dark:border-orange-800"
    }
  ];

  const apiIntegrations = [
    {
      name: "Chart API",
      description: "MEV-protected gasless swaps",
      icon: "🛡️",
      benefit: "100% sandwich attack protection"
    },
    {
      name: "Balance API", 
      description: "Multi-chain portfolio tracking",
      icon: "💎",
      benefit: "Real-time across 5+ chains"
    },
    {
      name: "Spot Price API",
      description: "Live price feeds",
      icon: "📊", 
      benefit: "Sub-second latency"
    },
    {
      name: "Portfolio API",
      description: "Historical performance",
      icon: "📈",
      benefit: "Complete P&L analysis"
    },
    {
      name: "Token API",
      description: "Metadata resolution", 
      icon: "🏷️",
      benefit: "Comprehensive token data"
    },
    {
      name: "History API",
      description: "Transaction broadcasting",
      icon: "📡",
      benefit: "Secure on-chain execution"
    }
  ];

  return (
    <div className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Advanced Strategies Section */}
        <div className="text-center space-y-4 mb-16">
          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
            🎯 Track 1: Expand Limit Order Protocol
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Advanced Trading Strategies
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Revolutionary DeFi primitives built on 1inch Limit Order Protocol with custom orderbook implementation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          {strategies.map((strategy, index) => (
            <Card key={index} className={`${strategy.bgColor} ${strategy.borderColor} border-2 hover:scale-105 transition-transform duration-300 shadow-lg`}>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${strategy.color} flex items-center justify-center text-2xl shadow-lg`}>
                    {strategy.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl text-foreground">{strategy.title}</CardTitle>
                    <p className="text-muted-foreground text-sm">
                      {strategy.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {strategy.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* API Integration Section */}
        <div className="text-center space-y-4 mb-16">
          <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
            🔗 Track 2: Full Application using 1inch APIs
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Comprehensive API Integration
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Leveraging the full power of 1inch ecosystem with 6+ API integrations for a complete DeFi experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apiIntegrations.map((api, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300 border-border bg-card p-3">
              <CardContent className="pb-0">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-muted to-muted/80 rounded-lg flex items-center justify-center text-xl">
                    {api.icon}
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-foreground">
                      {api.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {api.description}
                    </p>
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                      ✓ {api.benefit}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}