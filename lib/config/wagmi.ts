import { http, createConfig, createStorage } from 'wagmi';
import { mainnet, polygon, arbitrum, bsc, avalanche } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, polygon, arbitrum, bsc, avalanche],
  connectors: [
    injected(),
    walletConnect({ 
      projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'your-project-id',
      metadata: {
        name: '1inch Advanced Trading Hub',
        description: 'Advanced trading strategies for 1inch Protocol',
        url: 'https://your-domain.com',
        icons: ['https://your-domain.com/icon.png']
      }
    }),
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
  },
  // Enable localStorage persistence to maintain wallet connection across page refreshes
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }),
  // Enable SSR for proper hydration
  ssr: true,
  // Enable auto-discovery for better wallet connection
  multiInjectedProviderDiscovery: true,
});