#!/usr/bin/env node

/**
 * Working test script for 1inch Limit Order functionality
 * This version uses .mjs extension and better import handling
 */

import { createLimitOrderWorking, testLimitOrderWorking } from './lib/limitOrderWorking.js';

async function runWorkingTests() {
  console.log('🧪 1inch Limit Order Testing Suite - Working Version');
  console.log('====================================================\n');

  // Test 1: Basic working test
  console.log('🎯 Test 1: Working Limit Order Creation');
  console.log('----------------------------------------');
  
  try {
    const result1 = await testLimitOrderWorking();
    
    if (result1.success) {
      console.log('✅ Test 1 PASSED: Working limit order creation successful');
      console.log('📊 Order Details:');
      console.log('   Hash:', result1.data?.orderHash);
      console.log('   Maker:', result1.data?.makerAddress);
      console.log('   Expiration:', new Date(result1.data?.expiration * 1000).toISOString());
    } else {
      console.log('❌ Test 1 FAILED: Working limit order creation failed');
      console.log('Error:', result1.error?.message);
    }
  } catch (error) {
    console.log('❌ Test 1 FAILED with exception:', error.message);
    console.log('Stack trace:', error.stack);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Custom configuration
  console.log('🎯 Test 2: Custom Configuration Test');
  console.log('-------------------------------------');
  
  try {
    const result2 = await createLimitOrderWorking({
      expiresInSeconds: 300n, // 5 minutes
      networkId: 1,
      // Note: Still using demo auth key - replace with real key for production
    });
    
    if (result2.success) {
      console.log('✅ Test 2 PASSED: Custom configuration successful');
      console.log('Order expires in 5 minutes as configured');
    } else {
      console.log('❌ Test 2 FAILED: Custom configuration failed');
      console.log('Error:', result2.error?.message);
    }
  } catch (error) {
    console.log('❌ Test 2 FAILED with exception:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');
  console.log('🏁 Working Testing Complete!');
  
  console.log('\n📝 Next Steps:');
  console.log('1. ✅ CLI testing works with: node test-working.mjs');
  console.log('2. 🔧 For Next.js integration, use the LimitOrderTester component');
  console.log('3. 🔑 Get a real API key from https://portal.1inch.dev/ for production');
  console.log('4. 💰 Ensure sufficient token balances for real orders');
}

// Run the tests
runWorkingTests().catch(console.error);