'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { Token } from '../lib/types';

interface Props {
  label: string;
  selectedToken?: Token;
  onTokenSelect: (token: Token) => void;
  disabled?: boolean;
  excludeTokens?: string[]; // Token addresses to exclude
  showUSDTFirst?: boolean; // Whether to highlight USDT as primary option
}

// Popular tokens on Ethereum with real addresses
const POPULAR_TOKENS: Token[] = [
  {
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logoURI: 'https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png'
  },
  {
    address: '0xa0b86a33e6996051cb9a4c3e47e63b0b0e4f3c1a',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI: 'https://tokens.1inch.io/0xa0b86a33e6996051cb9a4c3e47e63b0b0e4f3c1a.png'
  },
  {
    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    logoURI: 'https://tokens.1inch.io/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png'
  },
  {
    address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    symbol: 'WBTC',
    name: 'Wrapped BTC',
    decimals: 8,
    logoURI: 'https://tokens.1inch.io/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png'
  },
  {
    address: '0x111111111117dc0aa78b770fa6a738034120c302',
    symbol: '1INCH',
    name: '1inch Token',
    decimals: 18,
    logoURI: 'https://tokens.1inch.io/0x111111111117dc0aa78b770fa6a738034120c302.png'
  },
  {
    address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    symbol: 'UNI',
    name: 'Uniswap',
    decimals: 18,
    logoURI: 'https://tokens.1inch.io/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984.png'
  },
  {
    address: '0x514910771af9ca656af840dff83e8264ecf986ca',
    symbol: 'LINK',
    name: 'ChainLink Token',
    decimals: 18,
    logoURI: 'https://tokens.1inch.io/0x514910771af9ca656af840dff83e8264ecf986ca.png'
  },
  {
    address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
    symbol: 'MATIC',
    name: 'Polygon',
    decimals: 18,
    logoURI: 'https://tokens.1inch.io/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png'
  },
  {
    address: '0x6b175474e89094c44da98b954eedeac495271d0f',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    logoURI: 'https://tokens.1inch.io/0x6b175474e89094c44da98b954eedeac495271d0f.png'
  },
  {
    address: '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11',
    symbol: 'CRV',
    name: 'Curve DAO Token',
    decimals: 18,
    logoURI: 'https://tokens.1inch.io/0xa478c2975ab1ea89e8196811f51a7b7ade33eb11.png'
  }
];

// Popular trading pairs against USDT
const POPULAR_PAIRS = [
  { base: 'WETH', quote: 'USDT', label: 'ETH/USDT', volume: '$2.1B' },
  { base: 'WBTC', quote: 'USDT', label: 'BTC/USDT', volume: '$890M' },
  { base: '1INCH', quote: 'USDT', label: '1INCH/USDT', volume: '$45M' },
  { base: 'UNI', quote: 'USDT', label: 'UNI/USDT', volume: '$120M' },
  { base: 'LINK', quote: 'USDT', label: 'LINK/USDT', volume: '$95M' },
  { base: 'MATIC', quote: 'USDT', label: 'MATIC/USDT', volume: '$78M' },
];

export function TokenSelector({ 
  label, 
  selectedToken, 
  onTokenSelect, 
  disabled = false,
  excludeTokens = [],
  showUSDTFirst = false 
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTokens, setFilteredTokens] = useState(POPULAR_TOKENS);

  // Filter tokens based on search and exclusions
  useEffect(() => {
    let tokens = POPULAR_TOKENS.filter(token => 
      !excludeTokens.includes(token.address)
    );

    if (searchTerm) {
      tokens = tokens.filter(token =>
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort USDT first if showUSDTFirst is true
    if (showUSDTFirst) {
      tokens.sort((a, b) => {
        if (a.symbol === 'USDT') return -1;
        if (b.symbol === 'USDT') return 1;
        return 0;
      });
    }

    setFilteredTokens(tokens);
  }, [searchTerm, excludeTokens, showUSDTFirst]);

  const handleTokenSelect = (token: Token) => {
    onTokenSelect(token);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getTokenBySymbol = (symbol: string): Token | undefined => {
    return POPULAR_TOKENS.find(token => token.symbol === symbol);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      
      {/* Quick Pair Selection for USDT pairs */}
      {showUSDTFirst && !selectedToken && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Popular pairs against USDT:</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_PAIRS.slice(0, 6).map((pair) => {
              const baseToken = getTokenBySymbol(pair.base);
              if (!baseToken || excludeTokens.includes(baseToken.address)) return null;
              
              return (
                <Button
                  key={pair.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTokenSelect(baseToken)}
                  className="text-xs h-8 px-3 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-800"
                  disabled={disabled}
                >
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">{pair.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {pair.volume}
                    </Badge>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Selection Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full justify-between h-12 px-4"
      >
        {selectedToken ? (
          <div className="flex items-center space-x-3">
            {selectedToken.logoURI && (
              <img 
                src={selectedToken.logoURI} 
                alt={selectedToken.symbol}
                className="w-6 h-6 rounded-full"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div className="text-left">
              <div className="font-medium">{selectedToken.symbol}</div>
              <div className="text-xs text-gray-500">{selectedToken.name}</div>
            </div>
          </div>
        ) : (
          <span className="text-gray-500">Select a token...</span>
        )}
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {/* Token List Dropdown */}
      {isOpen && (
        <Card className="absolute z-50 w-full max-w-md mt-1 border shadow-lg">
          <CardContent className="p-4">
            {/* Search Input */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800"
                autoFocus
              />
            </div>

            {/* Popular Tokens */}
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {filteredTokens.map((token) => (
                <Button
                  key={token.address}
                  variant="ghost"
                  onClick={() => handleTokenSelect(token)}
                  className="w-full justify-start h-12 px-3 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <div className="flex items-center space-x-3 w-full">
                    {token.logoURI && (
                      <img 
                        src={token.logoURI} 
                        alt={token.symbol}
                        className="w-8 h-8 rounded-full flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="text-left flex-1">
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-xs text-gray-500 truncate">{token.name}</div>
                    </div>
                    {token.symbol === 'USDT' && (
                      <Badge variant="secondary" className="text-xs">
                        Quote
                      </Badge>
                    )}
                  </div>
                </Button>
              ))}
              
              {filteredTokens.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No tokens found
                </div>
              )}
            </div>

            {/* Add Custom Token Option */}
            {searchTerm && filteredTokens.length === 0 && (
              <div className="border-t pt-4 mt-4">
                <p className="text-sm text-gray-500 mb-2">
                  Can&apos;t find your token? You can add it manually by entering the contract address.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // This would open a modal to add custom token
                    console.log('Add custom token feature coming soon');
                  }}
                  className="w-full"
                >
                  Add Custom Token
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}