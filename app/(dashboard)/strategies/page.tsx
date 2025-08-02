'use client';

import { PageLayout } from '../../../components/PageLayout';
import { StrategyPanel } from '../../../components/StrategyPanel';

export default function StrategiesPage() {
  return (
    <PageLayout
      title="Advanced Trading Strategies"
      description="Create and manage sophisticated trading strategies using 1inch Limit Order Protocol"
      requiresWallet={true}
    >
      <StrategyPanel />
    </PageLayout>
  );
}