'use client';

import { PageLayout } from '../../../components/PageLayout';
import { OrderBook } from '../../../components/OrderBook';

export default function OrdersPage() {
  return (
    <PageLayout
      title="Order Management"
      description="Monitor and manage your limit orders across all strategies"
      requiresWallet={true}
    >
      <OrderBook />
    </PageLayout>
  );
}