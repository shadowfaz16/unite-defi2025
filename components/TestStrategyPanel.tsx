"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TestStrategy, TestStrategyConfig, TestStrategyResult } from '@/lib/strategies/testStrategy';

interface TestStrategyPanelProps {
  onTestComplete?: (result: TestStrategyResult) => void;
}

export function TestStrategyPanel({ onTestComplete }: TestStrategyPanelProps) {
  const [config, setConfig] = useState<TestStrategyConfig>({
    fromTokenAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
    toTokenAddress: '0x111111111117dc0aa78b770fa6a738034120c302', // 1INCH
    fromTokenSymbol: 'USDT',
    toTokenSymbol: '1INCH',
    makingAmount: '100000000', // 100 USDT (6 decimals)
    takingAmount: '10000000000000000000', // 10 1INCH (18 decimals)
    expiresInSeconds: 300, // 5 minutes
    networkId: 1,
  });

  const [result, setResult] = useState<TestStrategyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const testStrategy = new TestStrategy();
  const presets = TestStrategy.getPresetConfigs();

  const handlePresetSelect = (presetName: string) => {
    const preset = presets.find(p => p.name === presetName);
    if (preset) {
      setConfig({ ...config, ...preset.config });
      setSelectedPreset(presetName);
      setResult(null);
    }
  };

  const handleConfigChange = (field: keyof TestStrategyConfig, value: string | number) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setSelectedPreset(null);
    setResult(null);
  };

  const handleTestStrategy = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const testResult = await testStrategy.createTestOrder(config);
      setResult(testResult);
      onTestComplete?.(testResult);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setResult({
        success: false,
        error: errorMessage,
        logs: [`Error: ${errorMessage}`]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTokenAmount = (amount: string, decimals: number, symbol: string) => {
    const value = parseFloat(amount) / Math.pow(10, decimals);
    return `${value.toLocaleString()} ${symbol}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Test Strategy</h3>
        <p className="text-sm text-muted-foreground">
          Test 1inch Limit Order creation with custom parameters
        </p>
      </div>

      {/* Preset Configurations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Start Presets</CardTitle>
          <CardDescription>
            Choose a preset configuration to get started quickly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {presets.map((preset) => (
              <Button
                key={preset.name}
                variant={selectedPreset === preset.name ? "default" : "outline"}
                className="h-auto p-3 text-left"
                onClick={() => handlePresetSelect(preset.name)}
              >
                <div className="w-full">
                  <div className="font-medium text-sm">{preset.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatTokenAmount(
                      preset.config.makingAmount || '0', 
                      preset.config.fromTokenSymbol === 'USDT' || preset.config.fromTokenSymbol === 'USDC' ? 6 : 18,
                      preset.config.fromTokenSymbol || ''
                    )} → {formatTokenAmount(
                      preset.config.takingAmount || '0', 
                      18,
                      preset.config.toTokenSymbol || ''
                    )}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order Configuration</CardTitle>
          <CardDescription>
            Customize your limit order parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Token Pair */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Token</label>
              <div className="space-y-2">
                <Input
                  placeholder="Token Symbol (e.g., USDT)"
                  value={config.fromTokenSymbol}
                  onChange={(e) => handleConfigChange('fromTokenSymbol', e.target.value)}
                />
                <Input
                  placeholder="Token Address"
                  value={config.fromTokenAddress}
                  onChange={(e) => handleConfigChange('fromTokenAddress', e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To Token</label>
              <div className="space-y-2">
                <Input
                  placeholder="Token Symbol (e.g., 1INCH)"
                  value={config.toTokenSymbol}
                  onChange={(e) => handleConfigChange('toTokenSymbol', e.target.value)}
                />
                <Input
                  placeholder="Token Address"
                  value={config.toTokenAddress}
                  onChange={(e) => handleConfigChange('toTokenAddress', e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Making Amount (Wei)</label>
              <Input
                placeholder="Amount to sell"
                value={config.makingAmount}
                onChange={(e) => handleConfigChange('makingAmount', e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Current: {formatTokenAmount(config.makingAmount, 
                  config.fromTokenSymbol === 'USDT' || config.fromTokenSymbol === 'USDC' ? 6 : 18, 
                  config.fromTokenSymbol)}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Taking Amount (Wei)</label>
              <Input
                placeholder="Amount to receive"
                value={config.takingAmount}
                onChange={(e) => handleConfigChange('takingAmount', e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Current: {formatTokenAmount(config.takingAmount, 18, config.toTokenSymbol)}
              </p>
            </div>
          </div>

          {/* Expiration */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Expiration (seconds)</label>
            <Input
              type="number"
              placeholder="300"
              value={config.expiresInSeconds}
              onChange={(e) => handleConfigChange('expiresInSeconds', parseInt(e.target.value) || 300)}
              min="60"
              max="86400"
            />
            <p className="text-xs text-muted-foreground">
              Order will expire in {Math.floor(config.expiresInSeconds / 60)} minutes
            </p>
          </div>

          {/* Test Button */}
          <Separator />
          <Button 
            onClick={handleTestStrategy} 
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Creating Test Order...' : 'Test Strategy'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Test Results
              <Badge variant={result.success ? "default" : "destructive"}>
                {result.success ? "Success" : "Failed"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.success && result.orderDetails && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Order Hash</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs bg-muted p-2 rounded flex-1 font-mono">
                      {result.orderHash}
                    </code>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(result.orderHash || '')}
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Signature</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs bg-muted p-2 rounded flex-1 font-mono break-all">
                      {result.signature}
                    </code>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(result.signature || '')}
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Maker:</span>
                    <p className="font-mono text-xs text-muted-foreground break-all">
                      {result.orderDetails.maker}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Expires:</span>
                    <p className="text-muted-foreground">
                      {new Date(result.orderDetails.expiresAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {result.error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
                <p className="text-sm text-destructive font-medium">Error</p>
                <p className="text-sm text-destructive/80 mt-1">{result.error}</p>
              </div>
            )}

            {/* Logs */}
            <div>
              <label className="text-sm font-medium">Execution Logs</label>
              <div className="mt-2 bg-muted rounded p-3 max-h-48 overflow-y-auto">
                {result.logs.map((log, index) => (
                  <div key={index} className="text-xs font-mono mb-1">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}