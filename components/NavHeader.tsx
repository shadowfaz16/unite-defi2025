'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletConnection } from './WalletConnection';
import { Button } from './ui/button';
import { ThemeToggle } from './ui/theme-toggle';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export function NavHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/', icon: '🏠' },
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Strategies', href: '/strategies', icon: '🎯' },
    { name: 'Orders', href: '/orders', icon: '📋' },
    { name: 'Portfolio', href: '/portfolio', icon: '💼' },
    { name: 'Demo', href: '/demo', icon: '🎬' },
  ];

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <span className="text-xl font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                1inch Trading Hub
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`flex items-center space-x-2 px-4 py-2 transition-all duration-200 hover:scale-105`}
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-2">
            <ThemeToggle />
            <WalletConnection />
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border py-4 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.name} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={`w-full justify-start flex items-center space-x-3 px-4 py-3 transition-all duration-200 hover:scale-[1.02]`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span className="font-medium">{item.name}</span>
                    </Button>
                  </Link>
                );
              })}
              
              {/* Mobile Wallet Connection */}
              <div className="pt-4 border-t border-border">
                <WalletConnection />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}