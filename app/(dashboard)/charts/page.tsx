'use client';

import { RealTimeCharts } from '@/components/RealTimeCharts';

export default function ChartsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Charts</h1>
        <p className="text-muted-foreground">
          Real-time price charts using 1inch Charts API
        </p>
      </div>
      
      <RealTimeCharts />
    </div>
  );
}