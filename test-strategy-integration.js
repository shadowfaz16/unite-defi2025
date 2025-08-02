/**
 * Test script to verify the strategy integration works correctly
 */

import { TestStrategy } from './lib/strategies/testStrategy.ts';

// Demo configuration for testing
const testConfig = {
  fromTokenAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  toTokenAddress: '0x111111111117dc0aa78b770fa6a738034120c302', // 1INCH
  fromTokenSymbol: 'USDT',
  toTokenSymbol: '1INCH',
  makingAmount: '50000000', // 50 USDT (6 decimals)
  takingAmount: '5000000000000000000', // 5 1INCH (18 decimals)
  expiresInSeconds: 600, // 10 minutes
  networkId: 1,
};

async function testStrategyIntegration() {
  console.log('🧪 Testing Strategy Integration');
  console.log('==============================\n');

  const testStrategy = new TestStrategy();

  try {
    const result = await testStrategy.createTestOrder(testConfig);
    
    console.log('📊 Test Result:');
    console.log('Success:', result.success);
    
    if (result.success) {
      console.log('Order Hash:', result.orderHash);
      console.log('Signature:', result.signature?.substring(0, 20) + '...');
      console.log('Order Details:', result.orderDetails);
    } else {
      console.log('Error:', result.error);
    }
    
    console.log('\n📋 Execution Logs:');
    result.logs.forEach((log, index) => {
      console.log(`${index + 1}. ${log}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testStrategyIntegration();
}

export { testStrategyIntegration };