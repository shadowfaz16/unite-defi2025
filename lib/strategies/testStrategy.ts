/**
 * Test Strategy using working 1inch Limit Order functionality
 * Allows users to test limit order creation with custom parameters
 */

import { createLimitOrderWorking } from '../limitOrderWorking';

export interface TestStrategyConfig {
  fromTokenAddress: string;
  toTokenAddress: string;
  fromTokenSymbol: string;
  toTokenSymbol: string;
  makingAmount: string;
  takingAmount: string;
  expiresInSeconds: number;
  authKey?: string;
  privateKey?: string;
  networkId?: number;
}

export interface TestStrategyResult {
  success: boolean;
  error?: string;
  orderHash?: string;
  signature?: string;
  orderDetails?: {
    maker: string;
    makerAsset: string;
    takerAsset: string;
    makingAmount: string;
    takingAmount: string;
    expiresAt: number;
  };
  logs: string[];
}

export class TestStrategy {
  private logs: string[] = [];

  /**
   * Create and test a limit order with user-provided parameters
   */
  async createTestOrder(config: TestStrategyConfig): Promise<TestStrategyResult> {
    this.logs = [];
    this.log('🧪 Starting Test Strategy Execution');
    this.log(`📊 Testing order: ${config.makingAmount} ${config.fromTokenSymbol} → ${config.takingAmount} ${config.toTokenSymbol}`);

    try {
      // Validate configuration
      this.validateConfig(config);

      // Create the limit order using our working function
      const orderResult = await createLimitOrderWorking({
        authKey: config.authKey || process.env.NEXT_PUBLIC_1INCH_API_KEY,
        privateKey: config.privateKey || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        networkId: config.networkId || 1,
        expiresInSeconds: BigInt(config.expiresInSeconds),
        // Override default tokens with user's selection
        customTokens: {
          makerAsset: config.fromTokenAddress,
          takerAsset: config.toTokenAddress,
          makingAmount: config.makingAmount,
          takingAmount: config.takingAmount,
        }
      });

      this.log('✅ Test order created successfully!');
      
      const result: TestStrategyResult = {
        success: true,
        orderHash: orderResult.orderHash || '',
        signature: orderResult.signature || '',
        orderDetails: {
          maker: orderResult.maker || '',
          makerAsset: config.fromTokenAddress,
          takerAsset: config.toTokenAddress,
          makingAmount: config.makingAmount,
          takingAmount: config.takingAmount,
          expiresAt: Date.now() + (config.expiresInSeconds * 1000),
        },
        logs: this.logs
      };

      this.log('🎉 Test Strategy completed successfully!');
      return result;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.log(`❌ Test Strategy failed: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage,
        logs: this.logs
      };
    }
  }

  /**
   * Validate test configuration
   */
  private validateConfig(config: TestStrategyConfig): void {
    if (!config.fromTokenAddress || !this.isValidAddress(config.fromTokenAddress)) {
      throw new Error('Invalid from token address');
    }
    
    if (!config.toTokenAddress || !this.isValidAddress(config.toTokenAddress)) {
      throw new Error('Invalid to token address');
    }
    
    if (!config.makingAmount || parseFloat(config.makingAmount) <= 0) {
      throw new Error('Making amount must be greater than 0');
    }
    
    if (!config.takingAmount || parseFloat(config.takingAmount) <= 0) {
      throw new Error('Taking amount must be greater than 0');
    }
    
    if (config.expiresInSeconds < 60 || config.expiresInSeconds > 86400) {
      throw new Error('Expiration must be between 1 minute and 24 hours');
    }

    this.log('✅ Configuration validated');
  }

  /**
   * Check if address is valid Ethereum address
   */
  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Add log entry
   */
  private log(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);
    console.log(logEntry);
  }

  /**
   * Get popular token addresses for testing
   */
  static getPopularTokens(networkId: number = 1) {
    const tokens = {
      1: { // Ethereum mainnet
        USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        USDC: '0xa0b86a33e6d6c33e0d38b0d3e59b21e36b0f6b6b',
        '1INCH': '0x111111111117dc0aa78b770fa6a738034120c302',
        WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        DAI: '0x6b175474e89094c44da98b954eedeac495271d0f',
      }
    };

    return tokens[networkId as keyof typeof tokens] || tokens[1];
  }

  /**
   * Create preset test configurations
   */
  static getPresetConfigs(): Array<{name: string, config: Partial<TestStrategyConfig>}> {
    const popularTokens = this.getPopularTokens();
    
    return [
      {
        name: 'USDT → 1INCH (Small)',
        config: {
          fromTokenAddress: popularTokens.USDT,
          toTokenAddress: popularTokens['1INCH'],
          fromTokenSymbol: 'USDT',
          toTokenSymbol: '1INCH',
          makingAmount: '100000000', // 100 USDT (6 decimals)
          takingAmount: '10000000000000000000', // 10 1INCH (18 decimals)
          expiresInSeconds: 300, // 5 minutes
        }
      },
      {
        name: 'USDC → WETH (Medium)',
        config: {
          fromTokenAddress: popularTokens.USDC,
          toTokenAddress: popularTokens.WETH,
          fromTokenSymbol: 'USDC',
          toTokenSymbol: 'WETH',
          makingAmount: '1000000000', // 1000 USDC (6 decimals)
          takingAmount: '300000000000000000', // 0.3 WETH (18 decimals)
          expiresInSeconds: 1800, // 30 minutes
        }
      },
      {
        name: 'DAI → 1INCH (Large)',
        config: {
          fromTokenAddress: popularTokens.DAI,
          toTokenAddress: popularTokens['1INCH'],
          fromTokenSymbol: 'DAI',
          toTokenSymbol: '1INCH',
          makingAmount: '5000000000000000000000', // 5000 DAI (18 decimals)
          takingAmount: '50000000000000000000000', // 50000 1INCH (18 decimals)
          expiresInSeconds: 3600, // 1 hour
        }
      }
    ];
  }
}