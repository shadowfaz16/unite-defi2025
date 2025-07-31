'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useWeb3 } from '../lib/hooks/useWeb3';

export function WalletConnection() {
  const { address, isConnected, chain, balance, connect, disconnect, isPending } = useWeb3();
  const [showConnectors, setShowConnectors] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal: any) => {
    if (!bal) return '0';
    return `${parseFloat(bal.formatted).toFixed(4)} ${bal.symbol}`;
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex flex-col items-end text-sm">
          <span className="font-medium">{formatAddress(address)}</span>
          <span className="text-gray-500">{formatBalance(balance)}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium">{chain?.name || 'Unknown'}</span>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => disconnect()}
          className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button 
        onClick={() => setShowConnectors(!showConnectors)}
        disabled={isPending}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      >
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </Button>

      {showConnectors && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowConnectors(false)}
          />
          <Card className="absolute right-0 top-full mt-2 w-64 z-50 shadow-xl border">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Connect Wallet</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    connect('injected');
                    setShowConnectors(false);
                  }}
                >
                  <span className="mr-2">🦊</span>
                  MetaMask / Browser Wallet
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    connect('walletconnect');
                    setShowConnectors(false);
                  }}
                >
                  <span className="mr-2">🔗</span>
                  WalletConnect
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    connect('coinbase');
                    setShowConnectors(false);
                  }}
                >
                  <span className="mr-2">🟦</span>
                  Coinbase Wallet
                </Button>
              </div>
              
              <div className="mt-3 text-xs text-gray-500">
                Supported networks: Ethereum, Polygon, BSC, Avalanche, Arbitrum
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}