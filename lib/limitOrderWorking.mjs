/**
 * Working version of 1inch Limit Order functionality
 * Browser-compatible version for use in Next.js applications
 */

// Load environment variables for Node.js testing
import { config } from 'dotenv';
config();

// Constants - Fix nonce size to 40 bits
const UINT_40_MAX = (1n << 40n) - 1n;

// Token addresses (Ethereum mainnet)
const TOKENS = {
  USDT: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  INCH: "0x111111111117dc0aa78b770fa6a738034120c302",
};

/**
 * Creates and submits a limit order using 1inch SDK
 */
export async function createLimitOrderWorking(config = {}) {
  const {
    authKey = process.env.NEXT_PUBLIC_1INCH_API_KEY || process.env.ONEINCH_API_KEY || "demo-key",
    privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    networkId = 1,
    expiresInSeconds = 120n,
    customTokens = null,
  } = config;

  // Debug: Check what we got for authKey
  console.log("🔍 Debug - Environment check:");
  console.log("   NEXT_PUBLIC_1INCH_API_KEY:", process.env?.NEXT_PUBLIC_1INCH_API_KEY ? "***FOUND***" : "not found");
  console.log("   ONEINCH_API_KEY:", process.env?.ONEINCH_API_KEY ? "***FOUND***" : "not found");
  console.log("   authKey length:", authKey ? authKey.length : 0);
  console.log("   authKey starts with:", authKey ? (authKey.substring(0, 8) + "...") : "no authKey");
  console.log("   authKey is demo?:", authKey === "demo-key");

  console.log("🚀 Starting 1inch Limit Order Creation Process (Working Version)");
  console.log("📋 Configuration:", {
    networkId,
    expiresInSeconds: expiresInSeconds.toString(),
    authKeyProvided: authKey !== "demo-key",
    usingTestKey: privateKey === "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  });

  try {
    // Step 1: Import dependencies using ES modules
    console.log("\n📦 Step 1: Loading dependencies...");
    let oneInchSDK, ethers;

    try {
      // Use ES module import
      oneInchSDK = await import("@1inch/limit-order-sdk");
      console.log("✅ 1inch SDK loaded via ES modules");
    } catch (esmError) {
      console.error("❌ Failed to load 1inch SDK:", esmError.message);
      throw new Error("Could not load @1inch/limit-order-sdk");
    }

    try {
      ethers = await import("ethers");
      console.log("✅ Ethers loaded successfully");
    } catch (ethersError) {
      console.error("❌ Failed to load ethers:", ethersError.message);
      throw new Error("Could not load ethers");
    }

    // Extract required classes - use what's actually available
    console.log("   Available SDK exports:", Object.keys(oneInchSDK));
    const { MakerTraits, Address, Api, randBigInt, LimitOrder, Extension } = oneInchSDK;
    
    // Create an HTTP client that matches what the API expects
    const httpConnector = {
      async request(config) {
        try {
          // Debug the request
          console.log("🔍 API Request Debug:");
          console.log("   URL:", config.url);
          console.log("   Method:", config.method || 'GET');
          console.log("   Headers:", JSON.stringify(config.headers, null, 2));
          console.log("   Body:", config.data ? JSON.stringify(config.data, null, 2) : "none");
          
          const response = await fetch(config.url, {
            method: config.method || 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...config.headers,
            },
            body: config.data ? JSON.stringify(config.data) : undefined,
          });
          
          console.log("📨 API Response:");
          console.log("   Status:", response.status);
          console.log("   Status Text:", response.statusText);
          console.log("   Headers:", JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
          
          if (!response.ok) {
            const errorText = await response.text();
            console.log("   Error Body:", errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
          }
          
          return await response.json();
        } catch (error) {
          console.error("HTTP request failed:", error);
          throw error;
        }
      },
      
      // Add POST method that the API expects
      async post(url, data, config = {}) {
        return this.request({
          url,
          method: 'POST',
          data,
          headers: config.headers,
        });
      },
      
      // Add GET method for completeness
      async get(url, config = {}) {
        return this.request({
          url,
          method: 'GET',
          headers: config.headers,
        });
      }
    };
    
    const { Wallet } = ethers;

    // Step 2: Initialize wallet
    console.log("\n🔐 Step 2: Initializing wallet...");
    const maker = new Wallet(privateKey);
    console.log("✅ Wallet initialized successfully");
    console.log("   Address:", maker.address);

    // Step 3: Calculate expiration
    console.log("\n⏰ Step 3: Setting up order timing...");
    const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
    const expiration = currentTimestamp + expiresInSeconds;
    console.log("✅ Timing configured");
    console.log("   Current timestamp:", currentTimestamp.toString());
    console.log("   Expiration timestamp:", expiration.toString());
    console.log("   Expires in:", expiresInSeconds.toString(), "seconds");

    // Step 4: Generate nonce
    console.log("\n🎲 Step 4: Generating random nonce...");
    const nonce = randBigInt(UINT_40_MAX);
    console.log("✅ Nonce generated:", nonce.toString());

    // Step 5: Configure maker traits
    console.log("\n⚙️ Step 5: Configuring maker traits...");
    const makerTraits = MakerTraits.default()
      .withExpiration(expiration)
      .withNonce(nonce);
    console.log("✅ Maker traits configured");

    // Step 6: Initialize API (using Api instead of Sdk)
    console.log("\n🔧 Step 6: Initializing 1inch API...");
    if (authKey === "demo-key") {
      console.warn("⚠️  Warning: Using demo auth key. Get a real key from https://portal.1inch.dev/");
    }
    
    // Update our HTTP connector to handle auth properly  
    const authAwareConnector = {
      ...httpConnector,
      async request(config) {
        // Ensure auth header is included
        const authHeaders = {
          'Authorization': `Bearer ${authKey}`,
          'X-API-Key': authKey,
        };
        
        const configWithAuth = {
          ...config,
          headers: {
            ...authHeaders,
            ...config.headers,
          }
        };
        
        return httpConnector.request(configWithAuth);
      }
    };

    const api = new Api({
      authKey,
      networkId,
      httpConnector: authAwareConnector,
    });
    console.log("✅ API initialized successfully");

    // Step 7: Define order parameters
    console.log("\n📊 Step 7: Setting up order parameters...");
    
    // Use custom tokens if provided, otherwise use smaller test defaults
    const makerAssetAddress = customTokens?.makerAsset || TOKENS.USDT;
    const takerAssetAddress = customTokens?.takerAsset || TOKENS.INCH;
    // Much smaller amounts for testing: 1 USDT (6 decimals) -> 0.1 1INCH (18 decimals)
    const makingAmount = customTokens?.makingAmount ? BigInt(customTokens.makingAmount) : 1_000000n; // 1 USDT
    const takingAmount = customTokens?.takingAmount ? BigInt(customTokens.takingAmount) : 100000000000000000n; // 0.1 1INCH
    
    const orderParams = {
      makerAsset: new Address(makerAssetAddress),
      takerAsset: new Address(takerAssetAddress),
      makingAmount,
      takingAmount,
      maker: new Address(maker.address),
    };
    
    console.log("✅ Order parameters configured:");
    console.log("   Maker Asset:", orderParams.makerAsset.toString());
    console.log("   Taker Asset:", orderParams.takerAsset.toString());
    console.log("   Making Amount:", orderParams.makingAmount.toString());
    console.log("   Taking Amount:", orderParams.takingAmount.toString());
    console.log("   Maker Address:", orderParams.maker.toString());

    // Step 8: Create order (using LimitOrder class directly)
    console.log("\n🏗️ Step 8: Creating limit order...");
    
    // Create order without extension field to see if that helps
    const orderWithDefaults = {
      ...orderParams,
      // Ensure receiver is set properly (use maker address if not specified)  
      receiver: orderParams.receiver || orderParams.maker,
    };
    
    // Don't include extension - let the constructor handle it
    const order = new LimitOrder(orderWithDefaults, makerTraits);
    
    // Check what we actually got and try to fix the extension if needed
    console.log("   Raw extension value:", order.extension);
    console.log("   Extension toString:", order.extension?.toString ? order.extension.toString() : 'no toString');
    
    // Try to manually override the extension serialization if needed
    if (order.extension && order.extension.toString() === '0x') {
      console.log("   ⚠️  Detected problematic 0x extension, attempting to fix...");
      // Try to set it to empty string instead
      try {
        Object.defineProperty(order, 'extension', {
          value: '', // Try empty string
          writable: true,
          enumerable: true,
          configurable: true
        });
        console.log("   ✅ Extension override applied");
      } catch (overrideError) {
        console.log("   ❌ Extension override failed:", overrideError.message);
      }
    }
    console.log("✅ Order created successfully");
    console.log("   Order details:", {
      maker: order.maker.toString(),
      makerAsset: order.makerAsset.toString(),
      takerAsset: order.takerAsset.toString(),
      makingAmount: order.makingAmount.toString(),
      takingAmount: order.takingAmount.toString(),
      receiver: order.receiver.toString(),
      extension: order.extension.toString(),
    });
    
    // Get order hash for tracking
    const orderHash = order.getOrderHash(networkId);
    console.log("   Order Hash:", orderHash);

    // Step 9: Generate typed data for signing
    console.log("\n📝 Step 9: Generating typed data for signature...");
    const typedData = order.getTypedData();
    console.log("✅ Typed data generated");
    console.log("   Domain:", JSON.stringify(typedData.domain, null, 2));
    console.log("   Message keys:", Object.keys(typedData.message));

    // Step 10: Sign the order
    console.log("\n✍️ Step 10: Signing the order...");
    const signature = await maker.signTypedData(
      typedData.domain,
      { Order: typedData.types.Order },
      typedData.message,
    );
    console.log("✅ Order signed successfully");
    console.log("   Signature:", signature);

    // Step 11: Submit order to 1inch
    console.log("\n📤 Step 11: Submitting order to 1inch...");
    
    // Try manual submission to avoid extension issues
    try {
      // Create order data manually with proper serialization
      console.log("🔧 Debugging field values:");
      console.log("   makerTraits raw:", order.makerTraits);
      console.log("   makerTraits type:", typeof order.makerTraits);
      console.log("   makerTraits toString:", order.makerTraits.toString?.());
      
      const orderData = {
        maker: order.maker.toString(),
        makerAsset: order.makerAsset.toString(),
        takerAsset: order.takerAsset.toString(),
        makerTraits: order.makerTraits.value?.value?.toString() || order.makerTraits.value?.toString() || order.makerTraits.toString(),
        salt: order.salt.toString(),
        makingAmount: order.makingAmount.toString(),
        takingAmount: order.takingAmount.toString(),
        receiver: order.receiver.toString(),
        // Try omitting extension completely instead of empty string
      };
      
      console.log("🔧 Fixed order data:", JSON.stringify(orderData, null, 2));
      
      const manualPayload = {
        orderHash: orderHash,
        signature: signature,
        data: orderData
      };
      
      console.log("🔧 Trying manual submission without extension...");
      const manualResult = await authAwareConnector.post(
        `https://api.1inch.dev/orderbook/v4.0/${networkId}/`,
        manualPayload
      );
      
      console.log("✅ Manual order submitted successfully!");
      console.log("   Manual result:", manualResult);
      var submitResult = manualResult;
      
    } catch (manualError) {
      console.log("❌ Manual submission failed, trying original API...");
      console.log("   Manual error:", manualError.message);
      
      // Fallback to original API
      const submitResult = await api.submitOrder(order, signature);
      console.log("✅ Order submitted successfully!");
      console.log("   Submit result:", submitResult);
    }

    console.log("\n🎉 SUCCESS: Limit order created and submitted successfully!");
    console.log("📊 Order Summary:");
    console.log("   Hash:", orderHash);
    console.log("   Maker:", maker.address);
    console.log("   Selling: 1 USDT");
    console.log("   Buying: 0.1 1INCH");
    console.log("   Expires:", new Date(Number(expiration) * 1000).toISOString());

    return {
      success: true,
      orderHash,
      signature,
      maker: maker.address,
      makerAsset: orderParams.makerAsset.toString(),
      takerAsset: orderParams.takerAsset.toString(),
      makingAmount: orderParams.makingAmount.toString(),
      takingAmount: orderParams.takingAmount.toString(),
      expiresAt: Number(expiration) * 1000,
      logs: [
        "✅ Order created and signed successfully",
        `📊 Order Hash: ${orderHash}`,
        `✍️ Signature: ${signature}`,
        `👤 Maker: ${maker.address}`,
        `💱 Trade: ${orderParams.makingAmount.toString()} → ${orderParams.takingAmount.toString()}`,
        `⏰ Expires: ${new Date(Number(expiration) * 1000).toLocaleString()}`
      ]
    };

  } catch (error) {
    console.error("\n❌ ERROR: Failed to create limit order");
    console.error("Error details:", error);
    
    if (error.message) {
      console.error("Error message:", error.message);
    }
    
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }

    return {
      success: false,
      error: {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      },
    };
  }
}

/**
 * Test function to run the limit order creation
 */
export async function testLimitOrderWorking() {
  console.log("🧪 Running Working Limit Order Test...\n");
  
  const result = await createLimitOrderWorking({
    // You can override defaults here
    // authKey: "your-real-api-key",
    // expiresInSeconds: 300n, // 5 minutes
  });

  if (result.success) {
    console.log("\n✅ Test completed successfully!");
  } else {
    console.log("\n❌ Test failed!");
  }

  return result;
}