"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

export function GasPriceDebug() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testDirectAPI = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      // Test 1: Check if we can import axios
      console.log('Testing axios import...');
      const axios = (await import('axios')).default;
      setResult(prev => prev + '\n✅ Axios imported successfully');

      // Test 2: Check constants
      console.log('Testing constants...');
      const { ONEINCH_API_BASE, ONEINCH_API_KEY } = await import('../lib/constants');
      setResult(prev => prev + `\n✅ Constants loaded: Base=${ONEINCH_API_BASE}, Key=${ONEINCH_API_KEY ? 'Available' : 'Missing'}`);

      // Test 3: Try direct API call (same as working test)
      console.log('Testing direct API call...');
      const url = `${ONEINCH_API_BASE}/gas-price/v1.6/1`;
      const config = {
        headers: {
          Authorization: `Bearer ${ONEINCH_API_KEY}`,
        },
        params: {},
        paramsSerializer: {
          indexes: null,
        },
      };

      setResult(prev => prev + `\n🚀 Making request to: ${url}`);
      const response = await axios.get(url, config);
      setResult(prev => prev + `\n✅ Direct API call successful: ${JSON.stringify(response.data, null, 2)}`);

      // Test 4: Try OneInchAPI class
      console.log('Testing OneInchAPI class...');
      const { OneInchAPI } = await import('../lib/api/oneinch');
      const apiResult = await OneInchAPI.getGasPrice(1);
      setResult(prev => prev + `\n✅ OneInchAPI result: ${JSON.stringify(apiResult, null, 2)}`);

    } catch (error: any) {
      console.error('Test failed:', error);
      setResult(prev => prev + `\n❌ Error: ${error.message}`);
      if (error.response) {
        setResult(prev => prev + `\n❌ Response status: ${error.response.status}`);
        setResult(prev => prev + `\n❌ Response data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Gas Price API Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={testDirectAPI} disabled={loading} className="mb-4">
          {loading ? 'Testing...' : 'Run Debug Test'}
        </Button>
        
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
          {result || 'Click "Run Debug Test" to start debugging...'}
        </pre>
      </CardContent>
    </Card>
  );
}