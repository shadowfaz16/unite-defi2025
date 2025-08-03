"use client"

import { useState, useEffect } from 'react'
import { SwapInterface } from '@/components/SwapInterface'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function SwapPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Swap</h1>
        <p className="text-muted-foreground">
          Swap tokens instantly using 1inch Classic Swap API
        </p>
      </div>
      
      <Separator />
      
      <div className="flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Token Swap</CardTitle>
            <CardDescription>
              Swap USDT and WETH on Ethereum mainnet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SwapInterface />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 