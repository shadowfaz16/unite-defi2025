"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  Wallet,
  Copy,
  ExternalLink,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useWeb3 } from "@/lib/hooks/useWeb3"
import { useWalletReconnect } from "@/lib/hooks/useWalletReconnect"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { address, isConnected, chain, balance, connect, disconnect, isPending } = useWeb3()
  const [showConnectors, setShowConnectors] = useState(false)
  
  // Ensure wallet reconnects on page load if previously connected
  useWalletReconnect()

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatBalance = (bal: any) => {
    if (!bal) return '0 ETH'
    return `${parseFloat(bal.formatted).toFixed(4)} ${bal.symbol}`
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
    }
  }

  const openInExplorer = () => {
    if (address && chain) {
      const explorerUrl = chain.blockExplorers?.default?.url
      if (explorerUrl) {
        window.open(`${explorerUrl}/address/${address}`, '_blank')
      }
    }
  }

  if (isConnected && address) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                  <Wallet className="size-4 text-white" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{formatAddress(address)}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {formatBalance(balance)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <ChevronsUpDown className="ml-1 size-4" />
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-3 px-2 py-1.5 text-left text-sm">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
                    <Wallet className="size-4 text-white" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{formatAddress(address)}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {chain?.name || 'Unknown Network'}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem className="flex items-center justify-between">
                  <span>Balance</span>
                  <span className="font-medium">{formatBalance(balance)}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center justify-between">
                  <span>Network</span>
                  <span className="font-medium">{chain?.name || 'Unknown'}</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={copyAddress}>
                  <Copy className="size-4" />
                  Copy Address
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openInExplorer}>
                  <ExternalLink className="size-4" />
                  View in Explorer
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => disconnect()} className="text-red-600">
                <LogOut className="size-4" />
                Disconnect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="relative">
          <SidebarMenuButton
            size="lg"
            onClick={() => setShowConnectors(!showConnectors)}
            disabled={isPending}
            className="w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
              <Wallet className="size-4 text-white" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {isPending ? 'Connecting...' : 'Connect Wallet'}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                Click to connect
              </span>
            </div>
          </SidebarMenuButton>

          {showConnectors && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowConnectors(false)}
              />
              <Card className="absolute bottom-full left-0 right-0 mb-2 z-50 shadow-xl border">
                <CardContent className="p-3">
                  <h3 className="font-semibold mb-3 text-sm">Connect Wallet</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-sm h-8"
                      onClick={() => {
                        connect('injected')
                        setShowConnectors(false)
                      }}
                    >
                      <span className="mr-2">🦊</span>
                      MetaMask / Browser
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-sm h-8"
                      onClick={() => {
                        connect('walletconnect')
                        setShowConnectors(false)
                      }}
                    >
                      <span className="mr-2">🔗</span>
                      WalletConnect
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-sm h-8"
                      onClick={() => {
                        connect('coinbase')
                        setShowConnectors(false)
                      }}
                    >
                      <span className="mr-2">🟦</span>
                      Coinbase
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
