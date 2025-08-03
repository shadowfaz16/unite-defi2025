import { http, createConfig, createStorage } from 'wagmi';
import { mainnet, polygon, arbitrum, bsc, avalanche, sepolia } from 'wagmi/chains';
import { injected, coinbaseWallet } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, polygon, arbitrum, bsc, avalanche, sepolia],
  connectors: [
    injected(),
    coinbaseWallet({ 
      appName: '1inch Advanced Trading Hub',
      appLogoUrl: 'https://your-domain.com/icon.png'
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [bsc.id]: http(),
    [avalanche.id]: http(),
    [sepolia.id]: http(),
  },
  // Enable localStorage persistence to maintain wallet connection across page refreshes
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    key: 'wagmi-wallet-state', // Custom key for wallet state
  }),
  // Enable SSR for proper hydration
  ssr: true,
  // Enable auto-discovery for better wallet connection
  multiInjectedProviderDiscovery: true,
  // Enable batch requests for better performance
  batch: {
    multicall: true,
  },
});