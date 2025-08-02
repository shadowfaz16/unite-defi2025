"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { createLimitOrderWorking } from '../lib/limitOrderWorking';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export function LimitOrderTester() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState({
    authKey: process.env.NEXT_PUBLIC_1INCH_API_KEY || '',
    expiresInSeconds: '120',
    networkId: '1',
  });

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const handleTest = async () => {
    setIsLoading(true);
    clearLogs();
    
    // Capture console.log, console.error, etc. to show in UI
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      const message = args.join(' ');
      addLog(message, 'info');
      originalLog(...args);
    };

    console.error = (...args) => {
      const message = args.join(' ');
      addLog(message, 'error');
      originalError(...args);
    };

    console.warn = (...args) => {
      const message = args.join(' ');
      addLog(message, 'warning');
      originalWarn(...args);
    };

    try {
      addLog('🚀 Starting limit order test...', 'info');
      
      const result = await createLimitOrderWorking({
        authKey: config.authKey || "demo-key",
        expiresInSeconds: BigInt(config.expiresInSeconds),
        networkId: parseInt(config.networkId),
      });

      if (result.success) {
        addLog('✅ Limit order test completed successfully!', 'success');
        addLog(`Order Hash: ${result.orderHash}`, 'success');
        addLog(`Maker: ${result.maker}`, 'success');
      } else {
        addLog('❌ Limit order test failed', 'error');
        addLog(`Error: ${result.error?.message}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Exception: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      // Restore original console methods
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      setIsLoading(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 1inch Limit Order Tester
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                API Key
              </label>
              <Input
                type="password"
                placeholder="1inch API Key (optional for testing)"
                value={config.authKey}
                onChange={(e) => setConfig(prev => ({ ...prev, authKey: e.target.value }))}
              />
              <p className="text-xs text-gray-500 mt-1">
                Get from <a href="https://portal.1inch.dev/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">portal.1inch.dev</a>
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Expires In (seconds)
              </label>
              <Input
                type="number"
                value={config.expiresInSeconds}
                onChange={(e) => setConfig(prev => ({ ...prev, expiresInSeconds: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Network ID
              </label>
              <Input
                type="number"
                value={config.networkId}
                onChange={(e) => setConfig(prev => ({ ...prev, networkId: e.target.value }))}
              />
              <p className="text-xs text-gray-500 mt-1">1 = Ethereum</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleTest} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? '⏳ Testing...' : '🚀 Test Limit Order'}
            </Button>
            <Button 
              variant="outline" 
              onClick={clearLogs}
              disabled={isLoading}
            >
              Clear Logs
            </Button>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium mb-2">Test Details:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Creates a limit order: Sell 100 USDT → Buy 10 1INCH</li>
              <li>• Uses test private key (safe for testing)</li>
              <li>• Shows detailed logs for each step</li>
              <li>• Handles errors gracefully</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            📋 Test Logs
            <span className="text-sm font-normal text-gray-500">
              {logs.length} entries
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="bg-black text-green-400 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm"
            style={{ fontFamily: 'Consolas, "Courier New", monospace' }}
          >
            {logs.length === 0 ? (
              <div className="text-gray-500">
                No logs yet. Click &quot;Test Limit Order&quot; to start...
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  <span className="text-blue-400">[{log.timestamp}]</span>{' '}
                  <span className={
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'warning' ? 'text-yellow-400' :
                    'text-white'
                  }>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📚 Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium">Testing Options:</h4>
            <ul className="text-sm text-gray-600 mt-1 space-y-1">
              <li>• <strong>CLI:</strong> Run <code className="bg-gray-100 px-1 rounded">npm run test:limit-order</code></li>
              <li>• <strong>Direct:</strong> Run <code className="bg-gray-100 px-1 rounded">node test-limit-order.js</code></li>
              <li>• <strong>UI:</strong> Use this interface for interactive testing</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium">Expected Behavior:</h4>
            <ul className="text-sm text-gray-600 mt-1 space-y-1">
              <li>• ✅ With valid API key: Order creation and submission should succeed</li>
              <li>• ⚠️  With demo/invalid key: SDK initialization should work, but submission may fail</li>
              <li>• ❌ Network issues: Clear error messages with retry suggestions</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium">Troubleshooting:</h4>
            <ul className="text-sm text-gray-600 mt-1 space-y-1">
              <li>• Check API key validity at <a href="https://portal.1inch.dev/" className="text-blue-500 hover:underline">portal.1inch.dev</a></li>
              <li>• Ensure network connectivity</li>
              <li>• Verify network ID matches intended blockchain</li>
              <li>• Check browser console for additional details</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}