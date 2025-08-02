'use client';

import { PageLayout } from '../../../components/PageLayout';
import { PortfolioOverview } from '../../../components/PortfolioOverview';

export default function PortfolioPage() {
  return (
    <PageLayout
      title="Portfolio Overview"
      description="Track your balances, performance, and trading activity across multiple chains"
      requiresWallet={true}
    >
      <PortfolioOverview />
    </PageLayout>
  );
}