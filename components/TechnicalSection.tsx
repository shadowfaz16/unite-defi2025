'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export function TechnicalSection() {
  const technicalHighlights = [
    {
      title: "Custom Orderbook Implementation",
      description: "Fully compliant with hackathon requirements - orders stored separately from official 1inch API",
      icon: "📚",
      details: [
        "LocalStorage-based demo implementation",
        "Production-ready database schema",
        "Real-time order status tracking",
        "Cross-strategy order management"
      ]
    },
    {
      title: "Advanced Strategy Engine", 
      description: "Autonomous execution system with sophisticated risk management",
      icon: "⚡",
      details: [
        "Time-based scheduling engine", 
        "Price condition monitoring",
        "Automatic order generation",
        "Portfolio rebalancing logic"
      ]
    },
    {
      title: "Multi-Chain Architecture",
      description: "Unified interface across major blockchain networks",
      icon: "🔗",
      details: [
        "Ethereum, Polygon, BSC, Avalanche",
        "Real-time cross-chain data sync",
        "Network-specific optimizations",
        "Unified wallet management"
      ]
    },
    {
      title: "Professional Infrastructure",
      description: "Production-grade implementation with institutional features",
      icon: "🏗️", 
      details: [
        "TypeScript + Next.js 15",
        "Real-time data with React Query",
        "State management with Zustand",
        "Professional UI/UX design"
      ]
    }
  ];

  const competitiveAdvantages = [
    {
      title: "Most Comprehensive Solution",
      description: "Only project addressing both hackathon tracks with this depth",
      metrics: ["4 Advanced Strategies", "6+ API Integrations", "5+ Supported Chains"]
    },
    {
      title: "Production-Ready Platform", 
      description: "Institutional-grade features ready for real-world deployment",
      metrics: ["Professional UI/UX", "Comprehensive Analytics", "Risk Management"]
    },
    {
      title: "Real Innovation",
      description: "Novel DeFi primitives that don't exist in current ecosystem",
      metrics: ["Synthetic Options", "Smart DCA", "Auto-Rebalancing CL"]
    }
  ];

  return (
    <div className="py-24 bg-white dark:bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Technical Excellence */}
        <div className="text-center space-y-4 mb-16">
          <Badge className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
            ⚡ Technical Excellence
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
            Built for Production
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Professional-grade architecture with cutting-edge technology stack and comprehensive feature set
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {technicalHighlights.map((highlight, index) => (
            <Card key={index} className="border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-lg flex items-center justify-center text-xl">
                    {highlight.icon}
                  </div>
                  <CardTitle className="text-lg">{highlight.title}</CardTitle>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {highlight.description}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {highlight.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center space-x-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Competitive Advantages */}
        <div className="text-center space-y-4 mb-12">
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800">
            🏆 Competitive Advantages
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
            Why This Project Wins
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {competitiveAdvantages.map((advantage, index) => (
            <Card key={index} className="text-center border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
              <CardHeader>
                <CardTitle className="text-lg text-green-800 dark:text-green-200">
                  {advantage.title}
                </CardTitle>
                <p className="text-green-600 dark:text-green-400 text-sm">
                  {advantage.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {advantage.metrics.map((metric, idx) => (
                    <Badge key={idx} variant="outline" className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-300">
                      {metric}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}