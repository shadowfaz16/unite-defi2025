import { useEffect, useRef } from 'react'
import { useAccount, useReconnect } from 'wagmi'

export function useWalletReconnect() {
  const { isConnected, status } = useAccount()
  const { reconnect } = useReconnect()
  const hasAttemptedReconnect = useRef(false)

  useEffect(() => {
    // Only attempt reconnection once per session when component mounts
    if (
      typeof window !== 'undefined' && 
      !isConnected && 
      !hasAttemptedReconnect.current &&
      status === 'disconnected'
    ) {
      hasAttemptedReconnect.current = true
      
      // Ensure wagmi is fully hydrated before attempting reconnection
      const timer = setTimeout(() => {
        try {
          reconnect()
        } catch (error) {
          console.log('Wallet reconnection attempt failed:', error)
        }
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [isConnected, reconnect, status])

  // Reset the flag when wallet gets connected so it can reconnect again later if needed
  useEffect(() => {
    if (isConnected) {
      hasAttemptedReconnect.current = false
    }
  }, [isConnected])

  return { isConnected, status }
}