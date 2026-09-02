'use client'

import { useQuery } from '@tanstack/react-query'
import { parseUnits } from 'viem'
import { fetchRoutes } from '@/lib/lifi'
import type { TokenInfo } from '@/lib/tokens'

type Args = {
  fromChainId: number
  toChainId: number
  token: TokenInfo
  /** Valor como o usuario digitou, em unidade humana. */
  amount: string
  address?: `0x${string}`
}

export function useBridgeRoutes({ fromChainId, toChainId, token, amount, address }: Args) {
  const parsed = safeParse(amount, token.decimals)
  const enabled = Boolean(address) && parsed !== null && parsed > 0n && fromChainId !== toChainId

  return useQuery({
    queryKey: ['routes', fromChainId, toChainId, token.symbol, parsed?.toString(), address],
    enabled,
    // Cotacao envelhece rapido; nao vale reusar cache velho numa tela de bridge.
    staleTime: 15_000,
    refetchInterval: 20_000,
    retry: 1,
    queryFn: () =>
      fetchRoutes({
        fromChainId,
        toChainId,
        fromTokenAddress: token.addresses[fromChainId],
        toTokenAddress: token.addresses[toChainId],
        fromAmount: parsed!.toString(),
        fromAddress: address!,
      }),
  })
}

function safeParse(value: string, decimals: number): bigint | null {
  if (!value.trim()) return null
  try {
    return parseUnits(value as `${number}`, decimals)
  } catch {
    return null
  }
}
