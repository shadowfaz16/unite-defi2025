"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import Link from "next/link";
import { GasPriceCard } from "../../../components/GasPriceCard";

export default function DashboardPage() {
  const quickActions = [
    {
      title: "Create TWAP Order",
      description: "Split large orders over time",
      icon: "⏱️",
      href: "/strategies?tab=twap",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Setup DCA Strategy",
      description: "Automate dollar-cost averaging",
      icon: "💰",
      href: "/strategies?tab=dca",
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Trade Options",
      description: "Synthetic call/put options",
      icon: "🎯",
      href: "/strategies?tab=options",
      color: "from-purple-500 to-violet-500",
    },
    {
      title: "Manage Liquidity",
      description: "Concentrated liquidity positions",
      icon: "🌊",
      href: "/strategies?tab=liquidity",
      color: "from-orange-500 to-red-500",
    },
  ];

  const portfolioStats = [
    {
      label: "Total Value",
      value: "$12,450.00",
      change: "+$234.50",
      positive: true,
    },
    { label: "Active Orders", value: "8", change: "+3", positive: true },
    { label: "Strategies Running", value: "4", change: "0", positive: null },
    { label: "24h P&L", value: "+$156.75", change: "+1.2%", positive: true },
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

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {portfolioStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </span>
                  {stat.positive !== null && (
                    <Badge
                      variant={stat.positive ? "default" : "destructive"}
                      className={
                        stat.positive
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }
                    >
                      {stat.change}
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gas Price Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Network Information
          </h2>
        </div>
        <GasPriceCard chainId={1} autoRefresh={true} refreshInterval={30} />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>
                    <div
                      className={`w-12 h-12 mb-4 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center text-2xl`}
                    >
                      <span className="text-2xl">{action.icon}</span>
                    </div>
                    <span className="text-lg font-semibold">{action.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400">
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
                { type: "TWAP", pair: "ETH/USDC", amount: "2.5 ETH", status: "Active" },
                { type: "DCA", pair: "BTC/USDC", amount: "$500", status: "Completed" },
                { type: "Limit", pair: "LINK/ETH", amount: "100 LINK", status: "Pending" },
                { type: "Options", pair: "ETH Call", amount: "1 Contract", status: "Active" },
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
                { strategy: "ETH DCA", performance: "+12.5%", status: "Running" },
                { strategy: "BTC TWAP", performance: "+8.2%", status: "Running" },
                { strategy: "LINK Options", performance: "-2.1%", status: "Paused" },
                { strategy: "Concentrated LP", performance: "+15.7%", status: "Running" },
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