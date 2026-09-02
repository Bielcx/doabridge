'use client'

import { useQuery } from '@tanstack/react-query'
import { parseUnits } from 'viem'
import { fetchRoutes } from '@/lib/lifi'
import { CHAINS, type Asset } from '@/lib/routes'

type Args = {
  from: Asset
  to: Asset
  /** Valor como o usuario digitou, em unidade humana. */
  amount: string
  address?: `0x${string}`
}

export function useBridgeRoutes({ from, to, amount, address }: Args) {
  const fromChainId = CHAINS[from.chain].evmChainId
  const toChainId = CHAINS[to.chain].evmChainId
  const parsed = safeParse(amount, from.decimals)

  const enabled =
    Boolean(address) &&
    parsed !== null &&
    parsed > 0n &&
    fromChainId !== undefined &&
    toChainId !== undefined &&
    fromChainId !== toChainId

  return useQuery({
    queryKey: ['routes', from.id, to.id, parsed?.toString(), address],
    enabled,
    // Cotacao envelhece rapido; nao vale reusar cache velho numa tela de bridge.
    staleTime: 15_000,
    refetchInterval: 20_000,
    retry: 1,
    queryFn: () =>
      fetchRoutes({
        fromChainId: fromChainId!,
        toChainId: toChainId!,
        fromTokenAddress: from.evmAddress!,
        toTokenAddress: to.evmAddress!,
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
