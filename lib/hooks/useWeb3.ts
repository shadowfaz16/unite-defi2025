import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from 'wagmi';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { mainnet, polygon, arbitrum, bsc, avalanche, sepolia } from 'wagmi/chains';

export function useWeb3() {
  const { address, isConnected, chain, status } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  
  const { data: balance } = useBalance({
    address: address,
  });

  const connectWallet = (connectorType: 'injected' | 'walletconnect' | 'coinbase' = 'injected') => {
    const connectorMap = {
      injected: injected(),
      walletconnect: walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || '' }),
      coinbase: coinbaseWallet({ appName: '1inch Advanced Trading Hub' })
    };

    connect({ connector: connectorMap[connectorType] });
  };

  const getSupportedChains = () => [mainnet, polygon, arbitrum, bsc, avalanche, sepolia];

  return {
    address,
    isConnected,
    chain,
    balance,
    connect: connectWallet,
    disconnect,
    switchChain,
    isPending,
    isSwitchingChain,
    connectors,
    supportedChains: getSupportedChains(),
    status
  };
}