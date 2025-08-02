import { useEffect } from 'react'
import { useAccount, useReconnect } from 'wagmi'

export function useWalletReconnect() {
  const { isConnected } = useAccount()
  const { reconnect } = useReconnect()

  useEffect(() => {
    // Only try to reconnect if not already connected and we're in the browser
    if (typeof window !== 'undefined' && !isConnected) {
      // Small delay to ensure wagmi is fully initialized
      const timer = setTimeout(() => {
        reconnect()
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [isConnected, reconnect])

  return { isConnected }
}