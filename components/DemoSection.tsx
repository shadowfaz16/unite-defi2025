'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function DemoSection() {
  const [activeDemo, setActiveDemo] = useState(0);

  const demoScenarios = [
    {
      title: "TWAP Large Order Execution",
      description: "Splitting a 1000 USDT order into 10 parts over 5 hours",
      icon: "⏱️",
      color: "from-blue-500 to-cyan-500",
      steps: [
        "User configures 1000 USDT → 1INCH TWAP",
        "System splits into 10 orders, 30-min intervals", 
        "Orders execute automatically in custom orderbook",
        "Achieve 15% better price vs market order"
      ],
      metrics: {
        "Price Improvement": "+1.2%",
        "Market Impact": "-85%", 
        "Execution Time": "5 hours",
        "Success Rate": "100%"
      }
    },
    {
      title: "Smart DCA Strategy",
      description: "Weekly DCA with 'buy the dip' conditions", 
      icon: "💰",
      color: "from-green-500 to-emerald-500",
      steps: [
        "Setup $100 weekly DCA into ETH",
        "Enable smart condition: 5% price drop",
        "System monitors market conditions 24/7",
        "Execute only during favorable entries"
      ],
      metrics: {
        "Entry Improvement": "+12.3%",
        "Risk Reduction": "23%",
        "Success Rate": "78%",
        "vs Regular DCA": "+15.2%"
      }
    },
    {
      title: "Synthetic Options Trading",
      description: "ETH call option with automated Greeks calculation",
      icon: "🎯", 
      color: "from-purple-500 to-violet-500",
      steps: [
        "Create ETH call option: $2500 strike, 30-day expiry",
        "System calculates Greeks (Δ=0.65, Γ=0.10, Θ=-0.25)",
        "Automatic exercise when in-the-money",
        "Risk management with position sizing"
      ],
      metrics: {
        "Max Profit": "Unlimited",
        "Delta": "0.65",
        "Time Decay": "-0.25/day",
        "Success Rate": "85%"
      }
    },
    {
      title: "Concentrated Liquidity Management",
      description: "Auto-rebalancing ETH/USDC liquidity provision",
      icon: "🌊",
      color: "from-orange-500 to-red-500", 
      steps: [
        "Provide liquidity in $2250-$2750 range",
        "System places grid of 10 buy/sell orders",
        "Auto-rebalance when price moves 15%",
        "Earn optimized fees from trading activity"
      ],
      metrics: {
        "APY": "12.5%",
        "Utilization": "89%",
        "Rebalances": "3 this week",
        "Fee Earnings": "$125.50"
      }
    }
  ];

  return (
    <div className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center space-y-4 mb-16">
          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
            🎬 Live Demo Scenarios
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            See It In Action
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Interactive demonstrations of advanced trading strategies with real performance metrics
          </p>
        </div>

        {/* Demo selector */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {demoScenarios.map((demo, index) => (
            <Button
              key={index}
              variant={activeDemo === index ? "default" : "outline"}
              onClick={() => setActiveDemo(index)}
              className={`${
                activeDemo === index 
                  ? `bg-gradient-to-r ${demo.color} text-white border-0` 
                  : "border-border text-foreground hover:bg-accent"
              }`}
            >
              <span className="mr-2">{demo.icon}</span>
              {demo.title}
            </Button>
          ))}
        </div>

        {/* Active demo content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Demo description */}
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${demoScenarios[activeDemo].color} flex items-center justify-center text-2xl`}>
                  {demoScenarios[activeDemo].icon}
                </div>
                <div>
                  <CardTitle className="text-foreground text-xl">
                    {demoScenarios[activeDemo].title}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {demoScenarios[activeDemo].description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <h4 className="text-foreground font-medium">Demo Flow:</h4>
              <ol className="space-y-2">
                {demoScenarios[activeDemo].steps.map((step, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold mt-0.5">
                      {idx + 1}
                    </div>
                    <span className="text-muted-foreground text-sm">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Demo metrics */}
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-foreground">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(demoScenarios[activeDemo].metrics).map(([key, value]) => (
                  <div key={key} className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-foreground">{value}</div>
                    <div className="text-muted-foreground text-sm">{key}</div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 space-y-3">
                <Link href="/strategies">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                  >
                    <span className="mr-2">🚀</span>
                    Try This Strategy
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button 
                    variant="outline"
                    className="w-full border-border text-foreground hover:bg-accent"
                  >
                    <span className="mr-2">📊</span>
                    View Detailed Analytics
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-200 dark:border-blue-800 max-w-2xl mx-auto p-8">
            <CardContent className="">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Ready to Experience Advanced DeFi Trading?
              </h3>
              <p className="text-muted-foreground mb-6">
                Connect your wallet and explore the most comprehensive trading platform in DeFi
              </p>
              <Link href="/dashboard">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                >
                  <span className="mr-2">🔗</span>
                  Launch Trading Hub
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}