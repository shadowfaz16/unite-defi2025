"use client"

import * as React from "react"
import {
  BarChart3,
  Home,
  Target,
  FileText,
  Briefcase,
  TrendingUp,
  Play,
  TrendingDown,
  Zap,
  DollarSign,
  LineChart,
  ArrowLeftRight,
} from "lucide-react"

import { NavSimple } from "@/components/nav-simple"
import { NavStrategies } from "@/components/nav-strategies"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { GasPriceCard } from "./GasPriceCard"

// Trading Hub navigation data
const data = {
  teams: [
    {
      name: "1inch Trading Hub",
      logo: DollarSign,
      plan: "Advanced",
    },
  ],
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: Home,
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: BarChart3,
      isActive: true,
    },
    {
      title: "Swap",
      url: "/swap",
      icon: ArrowLeftRight,
    },
    {
      title: "Portfolio",
      url: "/portfolio",
      icon: Briefcase,
    },
    {
      title: "API Orders",
      url: "/orders",
      icon: FileText,
    },
    {
      title: "Charts",
      url: "/charts",
      icon: LineChart,
    },
  ],
  strategies: [
    {
      name: "Strategies",
      url: "/strategies",
      icon: Target,
    },
    {
      name: "Demo",
      url: "/demo",
      icon: Play,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavSimple items={data.navMain} />
        <NavStrategies strategies={data.strategies} />
      </SidebarContent>
      <SidebarFooter>
        <GasPriceCard chainId={1} autoRefresh={false} refreshInterval={30} />
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
