'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { WalletConnection } from './WalletConnection';

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
    <div className="relative">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="text-center space-y-8">
          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-3">
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
              🏆 1inch Unite DeFi 2025
            </Badge>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              🎯 Both Tracks Addressed
            </Badge>
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
              ✅ Production Ready
            </Badge>
          </div>

          {/* Main heading */}
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="block text-white">1inch Advanced</span>
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Trading Hub
              </span>
            </h1>
            
            <p className="max-w-3xl mx-auto text-xl sm:text-2xl text-slate-300 leading-relaxed">
              The most comprehensive DeFi trading platform with advanced strategies, 
              extensive 1inch API integration, and institutional-grade features.
            </p>
          </div>

          {/* Feature showcase */}
          <div className="flex justify-center">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
              <CardContent className="flex items-center space-x-4 p-0">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${features[currentFeature].color} flex items-center justify-center text-2xl`}>
                  {features[currentFeature].icon}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white">
                    {features[currentFeature].title}
                  </h3>
                  <p className="text-slate-300">
                    {features[currentFeature].description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <WalletConnection />
            <Button 
              variant="outline" 
              size="lg"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md"
            >
              <span className="mr-2">🎬</span>
              View Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto pt-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">6+</div>
              <div className="text-slate-400">1inch APIs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">4</div>
              <div className="text-slate-400">Advanced Strategies</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">5+</div>
              <div className="text-slate-400">Supported Chains</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">100%</div>
              <div className="text-slate-400">MEV Protected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-slate-50 to-transparent dark:from-slate-900"></div>
    </div>
  );
}