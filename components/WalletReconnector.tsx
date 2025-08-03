'use client';

import { useWalletReconnect } from '../lib/hooks/useWalletReconnect';

export function WalletReconnector() {
  useWalletReconnect();
  return null; // This component only handles reconnection logic
}