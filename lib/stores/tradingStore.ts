import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TradingStrategy, LimitOrder, Token, PortfolioData } from '../types';
import { ORDER_STATUS } from '../constants';

interface TradingState {
  // Strategies
  strategies: TradingStrategy[];
  activeStrategy: TradingStrategy | null;
  
  // Orders
  orders: LimitOrder[];
  
  // Portfolio
  portfolio: PortfolioData | null;
  
  // UI State
  selectedToken: Token | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addStrategy: (strategy: TradingStrategy) => void;
  updateStrategy: (strategyId: string, updates: Partial<TradingStrategy>) => void;
  removeStrategy: (strategyId: string) => void;
  setActiveStrategy: (strategy: TradingStrategy | null) => void;
  
  addOrder: (order: LimitOrder) => void;
  updateOrder: (orderId: string, updates: Partial<LimitOrder>) => void;
  removeOrder: (orderId: string) => void;
  
  setPortfolio: (portfolio: PortfolioData) => void;
  setSelectedToken: (token: Token | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed values
  getTotalPortfolioValue: () => number;
  getActiveStrategies: () => TradingStrategy[];
  getPendingOrders: () => LimitOrder[];
}

export const useTradingStore = create<TradingState>()(
  persist(
    (set, get) => ({
      // Initial state
      strategies: [],
      activeStrategy: null,
      orders: [],
      portfolio: null,
      selectedToken: null,
      isLoading: false,
      error: null,

      // Strategy actions
      addStrategy: (strategy) =>
        set((state) => ({
          strategies: [...state.strategies, strategy],
        })),

      updateStrategy: (strategyId, updates) =>
        set((state) => ({
          strategies: state.strategies.map((s) =>
            s.id === strategyId ? { ...s, ...updates } : s
          ),
          activeStrategy:
            state.activeStrategy?.id === strategyId
              ? { ...state.activeStrategy, ...updates }
              : state.activeStrategy,
        })),

      removeStrategy: (strategyId) =>
        set((state) => ({
          strategies: state.strategies.filter((s) => s.id !== strategyId),
          activeStrategy:
            state.activeStrategy?.id === strategyId ? null : state.activeStrategy,
        })),

      setActiveStrategy: (strategy) =>
        set(() => ({
          activeStrategy: strategy,
        })),

      // Order actions
      addOrder: (order) =>
        set((state) => ({
          orders: [...state.orders, order],
        })),

      updateOrder: (orderId, updates) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, ...updates } : o
          ),
        })),

      removeOrder: (orderId) =>
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== orderId),
        })),

      // Portfolio actions
      setPortfolio: (portfolio) =>
        set(() => ({
          portfolio,
        })),

      // UI actions
      setSelectedToken: (token) =>
        set(() => ({
          selectedToken: token,
        })),

      setLoading: (loading) =>
        set(() => ({
          isLoading: loading,
        })),

      setError: (error) =>
        set(() => ({
          error,
        })),

      // Computed values
      getTotalPortfolioValue: () => {
        const { portfolio } = get();
        return portfolio?.totalValueUSD || 0;
      },

      getActiveStrategies: () => {
        const { strategies } = get();
        return strategies.filter((s) => s.isActive);
      },

      getPendingOrders: () => {
        const { orders } = get();
        return orders.filter((o) => o.status === ORDER_STATUS.PENDING);
      },
    }),
    {
      name: 'trading-store',
      partialize: (state) => ({
        strategies: state.strategies,
        orders: state.orders,
        portfolio: state.portfolio,
      }),
    }
  )
);