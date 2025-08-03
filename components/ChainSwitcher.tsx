'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useWeb3 } from '../lib/hooks/useWeb3';
import { ChevronDown, Check } from 'lucide-react';

export function ChainSwitcher() {
  const { chain, switchChain, supportedChains, isSwitchingChain, isConnected } = useWeb3();
  const [showChains, setShowChains] = useState(false);

  if (!isConnected) {
    return null;
  }

  const getChainDisplayName = (chainName: string) => {
    const nameMap: { [key: string]: string } = {
      'Ethereum': 'Ethereum',
      'Polygon': 'Polygon',
      'Arbitrum One': 'Arbitrum',
      'BNB Smart Chain': 'BSC',
      'Avalanche': 'Avalanche',
      'Sepolia': 'Sepolia'
    };
    return nameMap[chainName] || chainName;
  };

  const getChainIcon = (chainName: string) => {
    const iconMap: { [key: string]: string } = {
      'Ethereum': '⟠',
      'Polygon': '🔮',
      'Arbitrum One': '🔵',
      'BNB Smart Chain': '🟡',
      'Avalanche': '🔺',
      'Sepolia': '🧪'
    };
    return iconMap[chainName] || '🔗';
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowChains(!showChains)}
        disabled={isSwitchingChain}
        className="min-w-[120px] justify-between"
      >
        <span className="flex items-center">
          <span className="mr-2">{getChainIcon(chain?.name || '')}</span>
          {getChainDisplayName(chain?.name || 'Unknown')}
        </span>
        <ChevronDown className="h-4 w-4 ml-2" />
      </Button>

      {showChains && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowChains(false)}
          />
          <Card className="absolute right-0 top-full mt-2 w-56 z-50 shadow-xl border-border bg-card">
            <CardContent className="p-2">
              <div className="space-y-1">
                {supportedChains.map((supportedChain) => {
                  const isCurrentChain = chain?.id === supportedChain.id;
                  return (
                    <Button
                      key={supportedChain.id}
                      variant={isCurrentChain ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => {
                        if (!isCurrentChain) {
                          switchChain({ chainId: supportedChain.id });
                        }
                        setShowChains(false);
                      }}
                      disabled={isSwitchingChain || isCurrentChain}
                    >
                      <span className="flex items-center">
                        <span className="mr-2">{getChainIcon(supportedChain.name)}</span>
                        {getChainDisplayName(supportedChain.name)}
                      </span>
                      {isCurrentChain && <Check className="h-4 w-4" />}
                    </Button>
                  );
                })}
              </div>
              
              <div className="mt-3 pt-2 border-t border-border text-xs text-muted-foreground">
                {isSwitchingChain ? 'Switching...' : 'Select network'}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}