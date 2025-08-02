'use client';

import { PageLayout } from '../../../components/PageLayout';
import { DemoShowcase } from '../../../components/DemoShowcase';

export default function DemoPage() {
  return (
    <PageLayout
      title="Demo Showcase"
      description="Interactive demonstration of advanced trading strategies and 1inch API integrations"
      requiresWallet={false}
    >
      <DemoShowcase />
    </PageLayout>
  );
}