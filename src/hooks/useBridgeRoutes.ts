'use client'

import { useQuery } from '@tanstack/react-query'
import { parseUnits } from 'viem'
import { fetchRoutes } from '@/lib/lifi'
import { useNetwork } from '@/app/settings-provider'
import { CHAINS, lifiAddressOf, type Asset } from '@/lib/routes'

type Args = {
  from: Asset
  to: Asset
  /** Valor como o usuario digitou, em unidade humana. */
  amount: string
  /** Carteira EVM conectada. */
  evmAddress?: string
  /** Carteira Solana conectada. */
  solanaAddress?: string
}

export function useBridgeRoutes({ from, to, amount, evmAddress, solanaAddress }: Args) {
  const network = useNetwork()
  const fromToken = lifiAddressOf(from, network)
  const toToken = lifiAddressOf(to, network)
  const fromChainId = CHAINS[from.chain].lifiChainId
  const toChainId = CHAINS[to.chain].lifiChainId
  const parsed = safeParse(amount, from.decimals)

  // Cada lado usa a carteira da SUA familia. Atravessando entre Solana e EVM os
  // dois enderecos tem formatos diferentes, e reaproveitar o de origem no destino
  // mandaria fundos pra um endereco que nao existe na outra rede.
  const fromAddress = CHAINS[from.chain].family === 'solana' ? solanaAddress : evmAddress
  const toAddress = CHAINS[to.chain].family === 'solana' ? solanaAddress : evmAddress

  const enabled =
    Boolean(fromAddress) &&
    Boolean(toAddress) &&
    parsed !== null &&
    parsed > 0n &&
    fromChainId !== toChainId &&
    Boolean(fromToken) &&
    Boolean(toToken)

  return useQuery({
    queryKey: ['routes', network.name, from.id, to.id, parsed?.toString(), fromAddress, toAddress],
    enabled,
    // Cotacao envelhece rapido; nao vale reusar cache velho numa tela de bridge.
    staleTime: 15_000,
    refetchInterval: 20_000,
    retry: 1,
    queryFn: () =>
      fetchRoutes({
        fromChainId,
        toChainId,
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        fromAmount: parsed!.toString(),
        fromAddress: fromAddress!,
        toAddress: toAddress!,
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
