import { ethers } from 'ethers';

/**
 * Utility functions for wallet integration with strategies
 */
export class WalletIntegration {
  
  /**
   * Get a signer from the connected wallet
   * This replaces the mock wallet approach for production use
   */
  static async getConnectedWalletSigner(): Promise<ethers.JsonRpcSigner | null> {
    try {
      // Check if MetaMask or other wallet is available
      if (typeof window !== 'undefined' && window.ethereum) {
        // Connect to the wallet
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Create provider and signer
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        console.log('✅ Connected wallet signer obtained:', await signer.getAddress());
        return signer;
      } else {
        console.warn('⚠️ No wallet found, falling back to mock wallet');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting connected wallet:', error);
      return null;
    }
  }

  /**
   * Get mock wallet for demo/testing purposes
   */
  static getMockWallet(): ethers.Wallet {
    console.warn('⚠️ Using mock wallet for demo purposes');
    return new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
  }

  /**
   * Get the best available signer (connected wallet preferred, mock as fallback)
   */
  static async getBestAvailableSigner(): Promise<ethers.Signer> {
    const connectedSigner = await this.getConnectedWalletSigner();
    
    if (connectedSigner) {
      console.log('🔗 Using connected wallet for signing');
      return connectedSigner;
    } else {
      console.log('🎭 Using mock wallet for demo purposes');
      return this.getMockWallet();
    }
  }

  /**
   * Check if we're using a real connected wallet
   */
  static async isUsingRealWallet(): Promise<boolean> {
    const connectedSigner = await this.getConnectedWalletSigner();
    return connectedSigner !== null;
  }
}

// Extend window type for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}