'use client';

import { ReactNode } from 'react';
import { useWeb3 } from '../lib/hooks/useWeb3';
import { Card } from './ui/card';
import { WalletConnection } from './WalletConnection';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  requiresWallet?: boolean;
}

export function PageLayout({ 
  children, 
  title, 
  description, 
  requiresWallet = false 
}: PageLayoutProps) {
  const { isConnected } = useWeb3();

  if (requiresWallet && !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {title || "Connect Your Wallet"}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
                {description || "Please connect your wallet to access advanced trading features"}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="text-center p-6">
                  <div className="text-3xl mb-3">⚡</div>
                  <h3 className="font-semibold mb-2">Advanced Strategies</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    TWAP, DCA, Options, and Concentrated Liquidity
                  </p>
                </Card>
                <Card className="text-center p-6">
                  <div className="text-3xl mb-3">🔗</div>
                  <h3 className="font-semibold mb-2">Multi-API Integration</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Fusion, Balance, Portfolio, and Price APIs
                  </p>
                </Card>
                <Card className="text-center p-6">
                  <div className="text-3xl mb-3">🛡️</div>
                  <h3 className="font-semibold mb-2">MEV Protection</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gas-free swaps with sandwich attack protection
                  </p>
                </Card>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Connect your wallet to get started
              </p>
              <WalletConnection />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(title || description) && (
          <div className="mb-8">
            {title && (
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-gray-600 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}