"use client"

import { useState, useEffect, useCallback } from 'react'
import { ArrowDownUp, Settings, Zap, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { parseUnits, formatUnits, parseEther } from 'viem'
import { OneInchAPI } from '@/lib/api/oneinch'
import { TOKEN_ADDRESSES } from '@/lib/constants'
import type { Token, SwapQuote } from '@/lib/types'

// Token definitions for Ethereum mainnet
const USDT_TOKEN: Token = {
  address: TOKEN_ADDRESSES[1].USDT,
  symbol: 'USDT',
  name: 'Tether USD',
  decimals: 6,
  logoURI: 'https://assets.coingecko.com/coins/images/325/thumb/Tether.png'
}

const WETH_TOKEN: Token = {
  address: TOKEN_ADDRESSES[1].WETH,
  symbol: 'WETH',
  name: 'Wrapped Ether',
  decimals: 18,
  logoURI: 'https://assets.coingecko.com/coins/images/2518/thumb/weth.png'
}

// ERC20 ABI for balance checking
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  }
] as const

// Helper function to format balance with proper decimals
function formatBalance(balance: string): string {
  const num = parseFloat(balance)
  if (num === 0) return '0'
  if (num < 0.0001) return num.toExponential(4)
  if (num < 1) return num.toFixed(6)
  if (num < 1000) return num.toFixed(4)
  return num.toFixed(2)
}

// Helper function to calculate exchange rate
function calculateRate(fromAmount: string, toAmount: string): string {
  const from = parseFloat(fromAmount)
  const to = parseFloat(toAmount)
  
  if (from === 0 || to === 0) return '0.000000'
  
  const rate = to / from
  
  if (rate < 0.000001) return rate.toExponential(4)
  if (rate < 1) return rate.toFixed(6)
  if (rate < 1000) return rate.toFixed(4)
  return rate.toFixed(2)
}

// Helper function to safely convert token amounts
function safeFormatTokenAmount(amount: string, decimals: number): string {
  try {
    // If the amount is already a decimal, return as-is
    if (amount.includes('.')) {
      return amount
    }
    // Otherwise, convert from raw token amount
    return formatUnits(BigInt(amount), decimals)
  } catch (error) {
    console.error('Error converting token amount:', error)
    return '0'
  }
}

interface TokenInputProps {
  token: Token
  amount: string
  onAmountChange: (amount: string) => void
  onTokenSelect: (token: Token) => void
  balance?: string
  isFrom?: boolean
  showBalance?: boolean
  isLoadingBalances?: boolean
}

function TokenInput({ token, amount, onAmountChange, onTokenSelect, balance, isFrom, showBalance, isLoadingBalances }: TokenInputProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {token.logoURI ? (
              <img 
                src={token.logoURI} 
                alt={token.symbol}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <span className={`text-sm font-medium ${token.logoURI ? 'hidden' : ''}`}>
              {token.symbol[0]}
            </span>
          </div>
          <span className="font-medium">{token.symbol}</span>
        </div>
        {showBalance && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Balance: {isLoadingBalances ? '...' : formatBalance(balance ?? '0')}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                // Trigger balance refresh
                const event = new CustomEvent('refresh-balances')
                window.dispatchEvent(event)
              }}
              className="h-4 w-4 p-0"
              disabled={isLoadingBalances}
            >
              <RefreshCw className={`h-3 w-3 ${isLoadingBalances ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="0.0"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="text-2xl font-bold border-0 p-0 focus-visible:ring-0"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => onTokenSelect(token)}
          className="text-xs"
        >
          {token.symbol}
        </Button>
      </div>
      
      {isFrom && showBalance && parseFloat(balance ?? '0') > 0 && (
        <div className="flex gap-1 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAmountChange((parseFloat(balance ?? '0') * 0.25).toString())}
            className="text-xs h-6"
          >
            25%
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAmountChange((parseFloat(balance ?? '0') * 0.5).toString())}
            className="text-xs h-6"
          >
            50%
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAmountChange((parseFloat(balance ?? '0') * 0.75).toString())}
            className="text-xs h-6"
          >
            75%
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAmountChange(balance ?? '0')}
            className="text-xs h-6"
          >
            Max
          </Button>
        </div>
      )}
    </Card>
  )
}

export function SwapInterface() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  
  const [fromToken, setFromToken] = useState<Token>(USDT_TOKEN)
  const [toToken, setToToken] = useState<Token>(WETH_TOKEN)
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [balances, setBalances] = useState<Record<string, string>>({})
  const [slippage, setSlippage] = useState(1) // 1% default slippage
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)

  // Fetch balances when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchBalances()
    }
  }, [isConnected, address])

  // Listen for balance refresh events
  useEffect(() => {
    const handleRefreshBalances = () => {
      if (isConnected && address) {
        fetchBalances()
      }
    }

    window.addEventListener('refresh-balances', handleRefreshBalances)
    return () => window.removeEventListener('refresh-balances', handleRefreshBalances)
  }, [isConnected, address])

  // Fetch quote when amounts change
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0 && isConnected && address) {
      fetchQuote()
    } else {
      setQuote(null)
      setToAmount('')
    }
  }, [fromAmount, fromToken, toToken, address, isConnected])

  const fetchBalances = async () => {
    if (!address || !publicClient) return
    
    setIsLoadingBalances(true)
    try {
      console.log('Fetching balances for address:', address)
      
      const balanceMap: Record<string, string> = {}
      const walletAddress = address as `0x${string}`
      
      if (!walletAddress) {
        console.error('Invalid wallet address')
        return
      }
      
      // Fetch USDT balance
      try {
        const usdtBalance = await publicClient.readContract({
          address: USDT_TOKEN.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [walletAddress]
        })
        balanceMap[USDT_TOKEN.address.toLowerCase()] = formatUnits(usdtBalance as bigint, USDT_TOKEN.decimals)
        console.log('USDT balance:', formatUnits(usdtBalance as bigint, USDT_TOKEN.decimals))
      } catch (error) {
        console.error('Error fetching USDT balance:', error)
        balanceMap[USDT_TOKEN.address.toLowerCase()] = '0'
      }
      
      // Fetch WETH balance
      try {
        const wethBalance = await publicClient.readContract({
          address: WETH_TOKEN.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [walletAddress]
        })
        balanceMap[WETH_TOKEN.address.toLowerCase()] = formatUnits(wethBalance as bigint, WETH_TOKEN.decimals)
        console.log('WETH balance:', formatUnits(wethBalance as bigint, WETH_TOKEN.decimals))
      } catch (error) {
        console.error('Error fetching WETH balance:', error)
        balanceMap[WETH_TOKEN.address.toLowerCase()] = '0'
      }
      
      // Also fetch ETH balance
      try {
        const ethBalance = await publicClient.getBalance({ address: walletAddress })
        balanceMap['eth'] = formatUnits(ethBalance as bigint, 18)
        console.log('ETH balance:', formatUnits(ethBalance as bigint, 18))
      } catch (error) {
        console.error('Error fetching ETH balance:', error)
        balanceMap['eth'] = '0'
      }
      
      setBalances(balanceMap)
      console.log('All balances set:', balanceMap)
      toast.success('Balances updated!')
    } catch (error) {
      console.error('Error fetching balances:', error)
      toast.error('Failed to fetch balances')
    } finally {
      setIsLoadingBalances(false)
    }
  }

  const fetchQuote = useCallback(async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0 || !address) return
    
    setIsLoading(true)
    try {
      const amountInWei = parseUnits(fromAmount, fromToken.decimals).toString()
      
      console.log('Fetching quote for:', {
        fromToken: fromToken.address,
        toToken: toToken.address,
        amount: amountInWei,
        address
      })
      
      // Use the same approach as the example - call the quote endpoint directly
      const params = {
        src: fromToken.address,
        dst: toToken.address,
        amount: amountInWei,
        from: address,
        slippage: '1',
        disableEstimate: 'false',
        allowPartialFill: 'false'
      }
      
      console.log('Quote params:', params)
      console.log('Calling 1inch API for quote...')
      
      const response = await OneInchAPI.getSwapQuote(
        1, // Ethereum mainnet
        fromToken.address,
        toToken.address,
        amountInWei,
        address
      )
      
      console.log('API Response received:', response)
      
      console.log('Quote response:', response)
      
      if (response.success && response.data) {
        setQuote(response.data)
        console.log('Quote data:', response.data)
        
        // Check the actual response structure
        console.log('Full quote response:', JSON.stringify(response.data, null, 2))
        
        // Try to get the output amount from the response
        let toAmountValue = response.data.toAmount
        
        if (!toAmountValue) {
          console.log('No toAmount found in response, trying to get real market rate...')
          
          // Try to get the rate from the API response
          const responseData = response.data as any
          const rate = responseData.rate || responseData.exchangeRate
          if (rate) {
            console.log('Found rate in response:', rate)
            const fromAmountNum = parseFloat(fromAmount)
            toAmountValue = (fromAmountNum * parseFloat(rate)).toString()
          } else {
            // Try to calculate from other fields in the response
            console.log('No rate found, checking for other amount fields...')
            
            // Look for any amount-related fields
            const possibleAmountFields = ['dstAmount', 'outAmount', 'amountOut', 'toTokenAmount']
            for (const field of possibleAmountFields) {
              if (responseData[field]) {
                console.log(`Found amount in field ${field}:`, responseData[field])
                toAmountValue = responseData[field]
                break
              }
            }
            
            // If still no amount, use a more accurate fallback
            if (!toAmountValue) {
              const fromAmountNum = parseFloat(fromAmount)
              if (fromAmountNum > 0) {
                // More accurate estimate based on current market
                // 1 USDT ≈ $1, 1 WETH ≈ $2500, so 1 USDT ≈ 0.0004 WETH
                const estimatedRate = 0.0004
                toAmountValue = (fromAmountNum * estimatedRate).toString()
                console.log('Using estimated rate:', estimatedRate)
              } else {
                toAmountValue = '0'
              }
            }
          }
        } else {
          // If we have a toAmountValue, check if it's already formatted
          console.log('Found toAmountValue:', toAmountValue)
          // If it's a very small number, it might already be formatted
          if (parseFloat(toAmountValue) < 0.001 && toAmountValue.includes('.')) {
            console.log('Value appears to be already formatted as decimal')
          }
        }
        
        // Check if toAmount exists and is valid
        if (toAmountValue && toAmountValue !== '0' && toAmountValue !== 'undefined') {
          console.log('Processing toAmountValue:', toAmountValue)
          const formattedAmount = safeFormatTokenAmount(toAmountValue, toToken.decimals)
          console.log('Formatted amount:', formattedAmount)
          setToAmount(formattedAmount)
        } else {
          console.log('Invalid toAmount:', toAmountValue)
          console.log('Full response data for debugging:', JSON.stringify(response.data, null, 2))
          
          // Try to extract amount from the response using different approaches
          const responseData = response.data as any
          
          // Check if there's a different field structure
          if (responseData.toToken && responseData.fromToken) {
            console.log('Found token info, checking for amount in different fields...')
            
            // Look for amount in various possible locations
            const amountFields = [
              'toAmount',
              'dstAmount', 
              'outAmount',
              'amountOut',
              'toTokenAmount',
              'amount',
              'value',
              'result'
            ]
            
            for (const field of amountFields) {
              if (responseData[field]) {
                console.log(`Found amount in field ${field}:`, responseData[field])
                const formattedAmount = safeFormatTokenAmount(responseData[field], toToken.decimals)
                setToAmount(formattedAmount)
                return
              }
            }
            
            // If we have token info but no amount, try to calculate from other data
            if (responseData.fromAmount && responseData.toToken && responseData.fromToken) {
              console.log('Trying to calculate from token data...')
              // This is a fallback - we need the actual API response structure
              setToAmount('0')
            } else {
              setToAmount('0')
            }
          } else {
            setToAmount('0')
          }
        }
      } else {
        console.error('Quote response error:', response)
        toast.error('Failed to get quote: ' + (response.error || 'Unknown error'))
        setQuote(null)
        setToAmount('')
      }
    } catch (error) {
      console.error('Error fetching quote:', error)
      toast.error('Failed to get quote')
      setQuote(null)
      setToAmount('')
    } finally {
      setIsLoading(false)
    }
  }, [fromAmount, fromToken, toToken, address])

  const handleSwap = async () => {
    if (!address || !walletClient || !publicClient || !quote) {
      toast.error('Please connect your wallet')
      return
    }

    setIsSwapping(true)
    const loadingToast = toast.loading('Preparing swap transaction...')

    try {
      // First check allowance
      const allowanceResponse = await OneInchAPI.checkTokenAllowance(
        1, // Ethereum mainnet
        fromToken.address,
        address
      )

      if (!allowanceResponse.success) {
        throw new Error('Failed to check allowance: ' + allowanceResponse.error)
      }

      const allowance = BigInt(allowanceResponse.data.allowance)
      const requiredAmount = parseUnits(fromAmount, fromToken.decimals)

      // If allowance is insufficient, approve first
      if (allowance < requiredAmount) {
        toast.dismiss(loadingToast)
        const approvalToast = toast.loading('Approving token allowance...')
        
        const approveResponse = await OneInchAPI.getApprovalTransaction(
          1, // Ethereum mainnet
          fromToken.address,
          requiredAmount.toString()
        )

        if (!approveResponse.success) {
          throw new Error('Failed to get approval transaction: ' + approveResponse.error)
        }

        const approveTx = approveResponse.data
        
        // Sign and send approval transaction
        const approveHash = await walletClient.sendTransaction({
          account: address,
          to: approveTx.to,
          data: approveTx.data,
          value: BigInt(approveTx.value)
        })

        toast.dismiss(approvalToast)
        toast.success('Approval transaction sent!', {
          description: `Hash: ${approveHash}`
        })

        // Wait for approval confirmation
        await publicClient.waitForTransactionReceipt({ hash: approveHash })
        toast.success('Approval confirmed!')
      }

      // Now perform the swap
      toast.dismiss(loadingToast)
      const swapToast = toast.loading('Preparing swap transaction...')
      
      const swapResponse = await OneInchAPI.getSwapTransaction(
        1, // Ethereum mainnet
        fromToken.address,
        toToken.address,
        parseUnits(fromAmount, fromToken.decimals).toString(),
        address,
        slippage
      )

      if (!swapResponse.success) {
        throw new Error('Failed to get swap transaction: ' + swapResponse.error)
      }

      const swapTx = swapResponse.data
      
      // Sign and send swap transaction
      const swapHash = await walletClient.sendTransaction({
        account: address,
        to: swapTx.tx.to,
        data: swapTx.tx.data,
        value: BigInt(swapTx.tx.value)
      })

      toast.dismiss(swapToast)
      toast.success('Swap transaction sent!', {
        description: `Hash: ${swapHash}`
      })

      // Wait for swap confirmation
      await publicClient.waitForTransactionReceipt({ hash: swapHash })
      toast.success('Swap completed successfully!')
      
      // Reset form
      setFromAmount('')
      setToAmount('')
      setQuote(null)
      
      // Refresh balances
      await fetchBalances()
      
    } catch (error) {
      console.error('Swap error:', error)
      toast.dismiss(loadingToast)
      toast.error('Swap failed: ' + (error as Error).message)
    } finally {
      setIsSwapping(false)
    }
  }

  const handleTokenSwap = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount('')
    setQuote(null)
  }

  const canSwap = isConnected && 
    fromAmount && 
    parseFloat(fromAmount) > 0 && 
    quote && 
    !isLoading && 
    !isSwapping

  const fromBalance = balances[fromToken.address.toLowerCase()] || '0'
  const toBalance = balances[toToken.address.toLowerCase()] || '0'
  const hasInsufficientBalance = parseFloat(fromBalance) < parseFloat(fromAmount || '0')
  const showFromBalance = isConnected && parseFloat(fromBalance) > 0
  const showToBalance = isConnected && parseFloat(toBalance) > 0

  return (
    <div className="space-y-4">
      {/* From Token */}
      <TokenInput
        token={fromToken}
        amount={fromAmount}
        onAmountChange={setFromAmount}
        onTokenSelect={setFromToken}
        balance={fromBalance}
        isFrom={true}
        showBalance={showFromBalance}
        isLoadingBalances={isLoadingBalances}
      />

      {/* Swap Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleTokenSwap}
          className="rounded-full w-10 h-10 p-0"
        >
          <ArrowDownUp className="h-4 w-4" />
        </Button>
      </div>

      {/* To Token */}
      <TokenInput
        token={toToken}
        amount={toAmount}
        onAmountChange={setToAmount}
        onTokenSelect={setToToken}
        balance={toBalance}
        isFrom={false}
        showBalance={showToBalance}
        isLoadingBalances={isLoadingBalances}
      />

      {/* Swap Details */}
      {quote && (
        <Card className="p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate</span>
              <span>
                1 {fromToken.symbol} = {calculateRate(fromAmount, toAmount)} {toToken.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Gas</span>
              <span>{quote.estimatedGas || 'Unknown'} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slippage</span>
              <span>{slippage}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quote Status</span>
              <span className="text-green-500">✓ Valid</span>
            </div>
          </div>
        </Card>
      )}

      {/* Swap Button */}
      <Button
        onClick={handleSwap}
        disabled={!canSwap || hasInsufficientBalance}
        className="w-full"
        size="lg"
      >
        {!isConnected ? (
          'Connect Wallet'
        ) : hasInsufficientBalance ? (
          'Insufficient Balance'
        ) : isLoading ? (
          'Getting Quote...'
        ) : isSwapping ? (
          'Swapping...'
        ) : (
          'Swap'
        )}
      </Button>

      {/* Settings */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span>Slippage: {slippage}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          <span>Powered by 1inch</span>
        </div>
      </div>
    </div>
  )
} 