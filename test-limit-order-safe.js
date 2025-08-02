#!/usr/bin/env node

/**
 * Safe test script for 1inch Limit Order functionality
 * This version handles ES module import issues gracefully
 */

async function testWithFallbacks() {
  console.log('🧪 1inch Limit Order Testing Suite (Safe Mode)');
  console.log('='.repeat(50));
  console.log('This version tries multiple import strategies to handle module issues.\n');

  // Strategy 1: Try original ES module approach
  console.log('🎯 Strategy 1: ES Module Import');
  console.log('------------------------------');
  
  try {
    const { createLimitOrder } = await import('./lib/limitOrder.js');
    console.log('✅ ES modules loaded successfully');
    
    const result1 = await createLimitOrder({
      expiresInSeconds: 120n,
    });
    
    if (result1.success) {
      console.log('✅ Strategy 1 SUCCEEDED: ES module approach works!');
      return result1;
    } else {
      console.log('⚠️  Strategy 1 PARTIAL: Import worked but order failed');
      console.log('   Error:', result1.error?.message);
    }
  } catch (error) {
    console.log('❌ Strategy 1 FAILED:', error.message);
    console.log('   Trying alternative approaches...\n');
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Strategy 2: Try dynamic import with fallbacks
  console.log('🎯 Strategy 2: Dynamic Import with Fallbacks');
  console.log('----------------------------------------------');
  
  try {
    const { createLimitOrderDynamic } = await import('./lib/limitOrderCommonJS.cjs');
    console.log('✅ Dynamic import module loaded successfully');
    
    const result2 = await createLimitOrderDynamic({
      expiresInSeconds: 120n,
    });
    
    if (result2.success) {
      console.log('✅ Strategy 2 SUCCEEDED: Dynamic import approach works!');
      return result2;
    } else {
      console.log('⚠️  Strategy 2 PARTIAL: Import worked but order failed');
      console.log('   Error:', result2.error?.message);
    }
  } catch (error) {
    console.log('❌ Strategy 2 FAILED:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Strategy 3: Manual dependency check
  console.log('🎯 Strategy 3: Dependency Check & Guidance');
  console.log('------------------------------------------');
  
  try {
    // Check if packages are installed
    console.log('📦 Checking installed packages...');
    
    // Try to import each dependency individually
    try {
      await import('@1inch/limit-order-sdk');
      console.log('✅ @1inch/limit-order-sdk is installed');
    } catch (e) {
      console.log('❌ @1inch/limit-order-sdk import failed:', e.message);
    }
    
    try {
      await import('ethers');
      console.log('✅ ethers is installed');
    } catch (e) {
      console.log('❌ ethers import failed:', e.message);
    }

    console.log('\n🔧 Troubleshooting Steps:');
    console.log('1. Ensure dependencies are installed:');
    console.log('   npm install @1inch/limit-order-sdk ethers');
    console.log('2. Try clearing node_modules and reinstalling:');
    console.log('   rm -rf node_modules package-lock.json && npm install');
    console.log('3. Check Node.js version (requires Node 16+):');
    console.log('   node --version');
    console.log('4. Get a valid API key from https://portal.1inch.dev/');
    console.log('5. Set environment variable:');
    console.log('   export NEXT_PUBLIC_1INCH_API_KEY=your_api_key');

  } catch (error) {
    console.log('❌ Dependency check failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');
  console.log('❌ All strategies failed. Please check the troubleshooting steps above.');
  console.log('💡 You can still test the UI component in your Next.js app.');
  
  return {
    success: false,
    error: {
      message: 'All import strategies failed',
      troubleshooting: 'See console output for specific steps'
    }
  };
}

// Strategy 4: Simple mock test for development
async function runMockTest() {
  console.log('\n🎯 Strategy 4: Mock Test (Development Mode)');
  console.log('--------------------------------------------');
  console.log('Running a simulated test to verify the flow...\n');

  const steps = [
    "🔐 Initializing wallet...",
    "⏰ Setting up order timing...", 
    "🎲 Generating random nonce...",
    "⚙️ Configuring maker traits...",
    "🔧 Initializing 1inch SDK...",
    "📊 Setting up order parameters...",
    "🏗️ Creating limit order...",
    "📝 Generating typed data for signature...",
    "✍️ Signing the order...",
    "📤 Submitting order to 1inch..."
  ];

  for (let i = 0; i < steps.length; i++) {
    console.log(steps[i]);
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    console.log('✅ Step completed');
  }

  console.log('\n🎉 Mock test completed successfully!');
  console.log('📝 This demonstrates the expected flow when dependencies work correctly.');
  
  return {
    success: true,
    mock: true,
    message: 'Mock test completed - real dependencies needed for actual orders'
  };
}

// Main execution
async function main() {
  const realResult = await testWithFallbacks();
  
  if (!realResult.success) {
    console.log('\n🔄 Running mock test to show expected flow...');
    await runMockTest();
  }

  console.log('\n🏁 Testing complete!');
  console.log('\n📚 Additional Resources:');
  console.log('- 1inch SDK Documentation: https://github.com/1inch/1inch-sdk');
  console.log('- Get API Key: https://portal.1inch.dev/');
  console.log('- Next.js Integration: Use the LimitOrderTester component');
}

// Run the test
main().catch(console.error);