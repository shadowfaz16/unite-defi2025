/**
 * CommonJS version of limit order functionality
 * Use this if ES modules cause import issues
 */

const { createRequire } = require('module');
const require = createRequire(import.meta.url);

// Dynamic import wrapper for ES modules
async function importOneInchSDK() {
  try {
    // Try different import strategies
    let oneInchModule;
    
    try {
      // First try: standard import
      oneInchModule = await import("@1inch/limit-order-sdk");
    } catch (error1) {
      try {
        // Second try: explicit ESM path
        oneInchModule = await import("@1inch/limit-order-sdk/dist/esm/index.js");
      } catch (error2) {
        try {
          // Third try: CJS path
          oneInchModule = require("@1inch/limit-order-sdk");
        } catch (error3) {
          console.error("❌ Failed to import 1inch SDK with all methods:");
          console.error("  ESM standard:", error1.message);
          console.error("  ESM explicit:", error2.message);
          console.error("  CommonJS:", error3.message);
          throw new Error("Could not import @1inch/limit-order-sdk. Please check installation.");
        }
      }
    }
    
    return oneInchModule;
  } catch (error) {
    console.error("❌ Critical import error:", error);
    throw error;
  }
}

async function importEthers() {
  try {
    const ethers = await import("ethers");
    return ethers;
  } catch (error) {
    console.error("❌ Failed to import ethers:", error);
    throw error;
  }
}

/**
 * Creates and submits a limit order using dynamic imports
 */
async function createLimitOrderDynamic(config = {}) {
  const {
    authKey = process.env.NEXT_PUBLIC_1INCH_API_KEY || "demo-key",
    privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    networkId = 1,
    expiresInSeconds = 120n,
  } = config;

  console.log("🚀 Starting Dynamic Import Limit Order Creation");
  console.log("📦 Loading required modules...");

  try {
    // Step 1: Dynamic imports
    console.log("\n📦 Step 1: Loading 1inch SDK...");
    const oneInch = await importOneInchSDK();
    console.log("✅ 1inch SDK loaded successfully");

    console.log("\n📦 Step 2: Loading Ethers...");
    const ethers = await importEthers();
    console.log("✅ Ethers loaded successfully");

    // Extract required classes
    const { MakerTraits, Address, Sdk, randBigInt, FetchProviderConnector } = oneInch;
    const { Wallet } = ethers;

    console.log("✅ All modules loaded successfully");

    // Constants
    const UINT_40_MAX = (1n << 48n) - 1n;
    const TOKENS = {
      USDT: "0xdac17f958d2ee523a2206206994597c13d831ec7",
      INCH: "0x111111111117dc0aa78b770fa6a738034120c302",
    };

    console.log("\n📋 Configuration:", {
      networkId,
      expiresInSeconds: expiresInSeconds.toString(),
      authKeyProvided: authKey !== "demo-key",
      usingTestKey: privateKey === "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    });

    // Step 2: Initialize wallet
    console.log("\n🔐 Step 3: Initializing wallet...");
    const maker = new Wallet(privateKey);
    console.log("✅ Wallet initialized successfully");
    console.log("   Address:", maker.address);

    // Step 3: Calculate expiration
    console.log("\n⏰ Step 4: Setting up order timing...");
    const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));
    const expiration = currentTimestamp + expiresInSeconds;
    console.log("✅ Timing configured");
    console.log("   Current timestamp:", currentTimestamp.toString());
    console.log("   Expiration timestamp:", expiration.toString());
    console.log("   Expires in:", expiresInSeconds.toString(), "seconds");

    // Step 4: Generate nonce
    console.log("\n🎲 Step 5: Generating random nonce...");
    const nonce = randBigInt(UINT_40_MAX);
    console.log("✅ Nonce generated:", nonce.toString());

    // Step 5: Configure maker traits
    console.log("\n⚙️ Step 6: Configuring maker traits...");
    const makerTraits = MakerTraits.default()
      .withExpiration(expiration)
      .withNonce(nonce);
    console.log("✅ Maker traits configured");

    // Step 6: Initialize SDK
    console.log("\n🔧 Step 7: Initializing 1inch SDK...");
    if (authKey === "demo-key") {
      console.warn("⚠️  Warning: Using demo auth key. Get a real key from https://portal.1inch.dev/");
    }
    
    const sdk = new Sdk({
      authKey,
      networkId,
      httpConnector: new FetchProviderConnector(),
    });
    console.log("✅ SDK initialized successfully");

    // Step 7: Define order parameters
    console.log("\n📊 Step 8: Setting up order parameters...");
    const orderParams = {
      makerAsset: new Address(TOKENS.USDT),
      takerAsset: new Address(TOKENS.INCH),
      makingAmount: 100_000000n, // 100 USDT (6 decimals)
      takingAmount: 10_000000000000000000n, // 10 1INCH (18 decimals)
      maker: new Address(maker.address),
    };
    
    console.log("✅ Order parameters configured:");
    console.log("   Maker Asset (USDT):", orderParams.makerAsset.toString());
    console.log("   Taker Asset (1INCH):", orderParams.takerAsset.toString());
    console.log("   Making Amount:", orderParams.makingAmount.toString(), "USDT (100 USDT)");
    console.log("   Taking Amount:", orderParams.takingAmount.toString(), "1INCH (10 1INCH)");
    console.log("   Maker Address:", orderParams.maker.toString());

    // Step 8: Create order
    console.log("\n🏗️ Step 9: Creating limit order...");
    const order = await sdk.createOrder(orderParams, makerTraits);
    console.log("✅ Order created successfully");
    
    // Get order hash for tracking
    const orderHash = order.getOrderHash(networkId);
    console.log("   Order Hash:", orderHash);

    // Step 9: Generate typed data for signing
    console.log("\n📝 Step 10: Generating typed data for signature...");
    const typedData = order.getTypedData();
    console.log("✅ Typed data generated");
    console.log("   Domain:", JSON.stringify(typedData.domain, null, 2));
    console.log("   Message keys:", Object.keys(typedData.message));

    // Step 10: Sign the order
    console.log("\n✍️ Step 11: Signing the order...");
    const signature = await maker.signTypedData(
      typedData.domain,
      { Order: typedData.types.Order },
      typedData.message,
    );
    console.log("✅ Order signed successfully");
    console.log("   Signature:", signature);

    // Step 11: Submit order to 1inch
    console.log("\n📤 Step 12: Submitting order to 1inch...");
    const submitResult = await sdk.submitOrder(order, signature);
    console.log("✅ Order submitted successfully!");
    console.log("   Submit result:", submitResult);

    console.log("\n🎉 SUCCESS: Limit order created and submitted successfully!");
    console.log("📊 Order Summary:");
    console.log("   Hash:", orderHash);
    console.log("   Maker:", maker.address);
    console.log("   Selling: 100 USDT");
    console.log("   Buying: 10 1INCH");
    console.log("   Expires:", new Date(Number(expiration) * 1000).toISOString());

    return {
      success: true,
      data: {
        order,
        orderHash,
        signature,
        submitResult,
        makerAddress: maker.address,
        expiration: Number(expiration),
      },
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

module.exports = {
  createLimitOrderDynamic,
};