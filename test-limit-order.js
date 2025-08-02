#!/usr/bin/env node

/**
 * Test script for the 1inch Limit Order functionality
 * Run with: node test-limit-order.js
 */

import { createLimitOrder, testLimitOrder } from './lib/limitOrder.js';

async function runTests() {
  console.log('🧪 1inch Limit Order Testing Suite');
  console.log('=====================================\n');

  // Test 1: Basic limit order creation
  console.log('🎯 Test 1: Basic Limit Order Creation');
  console.log('--------------------------------------');
  
  try {
    const result1 = await testLimitOrder();
    
    if (result1.success) {
      console.log('✅ Test 1 PASSED: Basic limit order creation successful');
    } else {
      console.log('❌ Test 1 FAILED: Basic limit order creation failed');
      console.log('Error:', result1.error?.message);
    }
  } catch (error) {
    console.log('❌ Test 1 FAILED with exception:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Custom configuration
  console.log('🎯 Test 2: Custom Configuration Test');
  console.log('-------------------------------------');
  
  try {
    const result2 = await createLimitOrder({
      expiresInSeconds: 300n, // 5 minutes
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

  // Test 3: Error handling test (invalid auth key)
  console.log('🎯 Test 3: Error Handling Test');
  console.log('-------------------------------');
  
  try {
    const result3 = await createLimitOrder({
      authKey: 'invalid-key-for-testing',
    });
    
    if (!result3.success) {
      console.log('✅ Test 3 PASSED: Error handling works correctly');
      console.log('Expected error caught:', result3.error?.message);
    } else {
      console.log('⚠️  Test 3 UNEXPECTED: Expected failure but got success');
    }
  } catch (error) {
    console.log('✅ Test 3 PASSED: Exception properly caught:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');
  console.log('🏁 Testing Complete!');
  console.log('\n📝 Notes:');
  console.log('1. To use in production, get a real API key from https://portal.1inch.dev/');
  console.log('2. Replace the test private key with your actual wallet private key');
  console.log('3. Make sure you have sufficient token balances for the order');
  console.log('4. Check network connectivity and API status if tests fail');
}

// Run the tests
runTests().catch(console.error);