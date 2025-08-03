"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import Link from "next/link";
// import { GasPriceCard } from "../../../components/GasPriceCard";

export default function DashboardPage() {
  const quickActions = [
    {
      title: "Grid Trading",
      description: "Automated buy low/sell high strategy",
      icon: "📊",
      href: "/strategies?tab=grid",
      color: "from-blue-500 to-indigo-600",
      featured: true,
    },
    {
      title: "Multi-Market Arbitrage",
      description: "Auto-detect profitable price differences",
      icon: "⚡",
      href: "/strategies?tab=arbitrage",
      color: "from-purple-500 to-pink-600",
      featured: true,
    },
    {
      title: "Smart DCA Strategy",
      description: "Intelligent dollar-cost averaging",
      icon: "💰",
      href: "/strategies?tab=dca",
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "TWAP Orders",
      description: "Time-weighted price execution",
      icon: "⏱️",
      href: "/strategies?tab=twap",
      color: "from-cyan-500 to-blue-500",
    },
  ];


  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Trading Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor your portfolio and manage advanced trading strategies
        </p>
      </div>


      {/* Gas Price Information */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Network Information
          </h2>
        </div>
        <GasPriceCard chainId={1} autoRefresh={false} refreshInterval={30} />
      </div> */}

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className={`hover:shadow-lg transition-all duration-200 cursor-pointer ${
                action.featured ? 'ring-2 ring-orange-200 dark:ring-orange-800 hover:scale-105' : 'hover:scale-102'
              }`}>
                <CardHeader>
                  <CardTitle>
                    <div className="relative">
                      {action.featured && (
                        <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium z-10">
                          🔥 HOT
                        </div>
                      )}
                      <div
                        className={`w-12 h-12 mb-4 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center text-2xl`}
                      >
                        <span className="text-2xl">{action.icon}</span>
                      </div>
                    </div>
                    <span className="text-lg font-semibold">{action.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: "Grid", pair: "ETH/USDT", amount: "0.5 ETH", status: "Active" },
                { type: "Arbitrage", pair: "1INCH/USDT", amount: "1000 1INCH", status: "Active" },
                { type: "DCA", pair: "BTC/USDT", amount: "$500", status: "Active" },
                { type: "TWAP", pair: "WETH/USDT", amount: "2.5 WETH", status: "Completed" },
              ].map((order, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {order.type} - {order.pair}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {order.amount}
                    </div>
                  </div>
                  <Badge
                    variant={order.status === "Active" ? "default" : "secondary"}
                  >
                    {order.status}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/orders">
                <Button variant="outline" className="w-full">
                  View All Orders
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Strategies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { strategy: "ETH Grid Trading", performance: "+18.3%", status: "Running" },
                { strategy: "Multi-Market Arbitrage", performance: "+24.7%", status: "Running" },
                { strategy: "BTC Smart DCA", performance: "+12.5%", status: "Running" },
                { strategy: "WETH TWAP", performance: "+8.2%", status: "Completed" },
              ].map((strategy, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{strategy.strategy}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Performance: {strategy.performance}
                    </div>
                  </div>
                  <Badge
                    variant={strategy.status === "Running" ? "default" : "secondary"}
                  >
                    {strategy.status}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/strategies">
                <Button variant="outline" className="w-full">
                  Manage Strategies
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}