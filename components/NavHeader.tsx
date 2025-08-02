'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletConnection } from './WalletConnection';
import { Button } from './ui/button';

export function NavHeader() {
  const pathname = usePathname();

  const navigation = [
    { name: 'Home', href: '/', icon: '🏠' },
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Strategies', href: '/strategies', icon: '🎯' },
    { name: 'Orders', href: '/orders', icon: '📋' },
    { name: 'Portfolio', href: '/portfolio', icon: '💼' },
    // { name: 'Analytics', href: '/analytics', icon: '📈' },
    { name: 'Demo', href: '/demo', icon: '🎬' },
  ];

  return (
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <span className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              1inch Trading Hub
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`flex items-center space-x-2 transition-all duration-200 ${
                      isActive 
                        ? "bg-blue-500 text-white hover:bg-blue-600 shadow-md" 
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center">
            <WalletConnection />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="flex flex-wrap gap-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className={`flex items-center space-x-1 ${
                      isActive 
                        ? "bg-blue-500 text-white" 
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    <span className="text-xs">{item.icon}</span>
                    <span className="text-xs">{item.name}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}