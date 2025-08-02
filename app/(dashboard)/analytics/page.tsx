'use client';

import { PageLayout } from '../../../components/PageLayout';
import { PriceChart } from '../../../components/PriceChart';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

export default function AnalyticsPage() {
  const performanceMetrics = [
    { metric: 'Total Return', value: '+15.4%', period: 'All Time', trend: 'up' },
    { metric: 'Sharpe Ratio', value: '1.85', period: '30 Days', trend: 'up' },
    { metric: 'Max Drawdown', value: '-3.2%', period: '30 Days', trend: 'neutral' },
    { metric: 'Win Rate', value: '78%', period: 'All Time', trend: 'up' }
  ];

  const strategyBreakdown = [
    { strategy: 'TWAP Orders', allocation: '35%', performance: '+12.5%', volume: '$45,200' },
    { strategy: 'DCA Strategy', allocation: '25%', performance: '+8.2%', volume: '$32,100' },
    { strategy: 'Options Trading', allocation: '20%', performance: '+18.7%', volume: '$25,800' },
    { strategy: 'Concentrated Liquidity', allocation: '20%', performance: '+10.3%', volume: '$28,400' }
  ];

  return (
    <PageLayout
      title="Analytics Dashboard"
      description="Comprehensive performance analytics and market insights"
      requiresWallet={true}
    >
      <div className="space-y-8">
        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {performanceMetrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{metric.metric}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{metric.period}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    metric.trend === 'up' ? 'bg-green-500' :
                    metric.trend === 'down' ? 'bg-red-500' : 'bg-gray-500'
                  }`}></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Price Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <PriceChart />
          </CardContent>
        </Card>

        {/* Strategy Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Strategy Performance Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {strategyBreakdown.map((strategy, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{strategy.strategy}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {strategy.allocation} allocation • {strategy.volume} volume
                    </p>
                  </div>
                  <Badge 
                    className={
                      strategy.performance.startsWith('+') 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }
                  >
                    {strategy.performance}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trading Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Trading Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Trades</span>
                  <span className="font-medium">156</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Successful Trades</span>
                  <span className="font-medium">122 (78%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Average Trade Size</span>
                  <span className="font-medium">$842</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Largest Win</span>
                  <span className="font-medium text-green-600">+$2,450</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Largest Loss</span>
                  <span className="font-medium text-red-600">-$320</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Value at Risk (95%)</span>
                  <span className="font-medium">$1,250</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Beta</span>
                  <span className="font-medium">0.85</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Volatility (30d)</span>
                  <span className="font-medium">12.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Correlation to ETH</span>
                  <span className="font-medium">0.72</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Portfolio Diversification</span>
                  <span className="font-medium">High</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}