import { NextRequest, NextResponse } from 'next/server';

const ONEINCH_API_KEY = process.env.NEXT_PUBLIC_1INCH_API_KEY || 'sQ7qNdg4KNi4d2jjkboVZcFPl8oy0EsZ';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  try {
    const body = await request.json();
    const { chainId } = await params;

    console.log(`🔄 Proxying 1inch order submission for chain ${chainId}`);
    console.log('📤 Request body:', JSON.stringify(body, null, 2));

    const response = await fetch(`https://api.1inch.dev/orderbook/v4.0/${chainId}/order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ONEINCH_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseData = await response.json();

    console.log(`📥 1inch API response status: ${response.status}`);
    console.log('📥 Response data:', JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      console.error(`❌ 1inch API error: ${response.status} - ${JSON.stringify(responseData)}`);
      return NextResponse.json(
        { 
          success: false, 
          error: `1inch API error: ${response.status}`,
          details: responseData 
        },
        { status: response.status }
      );
    }

    console.log('✅ 1inch order submitted successfully via proxy');
    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ Proxy error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Proxy error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 