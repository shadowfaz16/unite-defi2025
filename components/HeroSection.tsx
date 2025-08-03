'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function HeroSection() {
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      title: "TWAP Orders",
      description: "Split large orders over time",
      icon: "⏱️",
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "DCA Strategy", 
      description: "Smart dollar-cost averaging",
      icon: "💰",
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Synthetic Options",
      description: "Call/Put options with Greeks",
      icon: "🎯", 
      color: "from-purple-500 to-violet-500"
    },
    {
      title: "Concentrated Liquidity",
      description: "Uniswap V3-style automation",
      icon: "🌊",
      color: "from-orange-500 to-red-500"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="relative overflow-hidden bg-background">
      {/* Subtle background pattern */}
      {/* <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20"></div> */}
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="text-center space-y-8">
          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-3">
            <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
              🏆 1inch Unite DeFi 2025
            </Badge>
            <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
              🎯 Both Tracks Addressed
            </Badge>
            <Badge className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
              ✅ Production Ready
            </Badge>
          </div>

          {/* Main heading */}
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="block text-foreground">1inch Advanced</span>
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                Trading Hub
              </span>
            </h1>
            
            <p className="max-w-3xl mx-auto text-xl sm:text-2xl text-muted-foreground leading-relaxed">
              The most comprehensive DeFi trading platform with advanced strategies, 
              extensive 1inch API integration, and institutional-grade features.
            </p>
          </div>

          {/* Feature showcase */}
          {/* <div className="flex justify-center">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6 shadow-lg">
              <CardContent className="flex items-center gap-4 pb-0">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${features[currentFeature].color} flex items-center justify-center text-2xl shadow-lg`}>
                  {features[currentFeature].icon}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-foreground">
                    {features[currentFeature].title}
                  </h3>
                  <p className="text-muted-foreground">
                    {features[currentFeature].description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div> */}

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/dashboard">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg"
              >
                <span className="mr-2">🚀</span>
                Launch Trading Hub
              </Button>
            </Link>
            <Link href="/demo">
              <Button 
                variant="outline" 
                size="lg"
                className="border-border text-foreground hover:bg-accent"
              >
                <span className="mr-2">🎬</span>
                View Demo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto pt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">6</div>
              <div className="text-muted-foreground">1inch APIs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">4+</div>
              <div className="text-muted-foreground">Advanced Strategies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">5+</div>
              <div className="text-muted-foreground">Supported Chains</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">100%</div>
              <div className="text-muted-foreground">MEV Protected</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}