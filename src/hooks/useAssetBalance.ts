'use client'

import { useQuery } from '@tanstack/react-query'
import { getTokenBalance } from '@lifi/sdk'
import { ensureLifiConfig } from '@/lib/lifi'
import { useNetwork } from '@/app/settings-provider'
import { CHAINS, lifiAddressOf, type Asset } from '@/lib/routes'

/**
 * Saldo do ativo escolhido na carteira que paga.
 *
 * Pelo LI.FI, e nao pelo wagmi + um RPC de Solana em paralelo: o `getTokenBalance`
 * deles atende EVM e Solana com a mesma chamada, e o par pode ser qualquer
 * combinacao das duas familias. Duas implementacoes que precisam concordar seriam
 * dois lugares pra errar.
 *
 * Revalida sozinho pelo mesmo motivo do saldo da Solana: depois de uma
 * transferencia o numero velho na tela e pior que numero nenhum.
 */
export function useAssetBalance(asset: Asset, walletAddress: string | undefined) {
  const network = useNetwork()
  const address = lifiAddressOf(asset, network)

  return useQuery({
    queryKey: ['balance', network.name, asset.id, walletAddress],
    enabled: Boolean(walletAddress),
    staleTime: 15_000,
    refetchInterval: 30_000,
    queryFn: async (): Promise<bigint | null> => {
      ensureLifiConfig()
      const result = await getTokenBalance(walletAddress!, {
        chainId: CHAINS[asset.chain].lifiChainId,
        address,
        decimals: asset.decimals,
        symbol: asset.symbol,
        name: asset.name,
        priceUSD: '0',
      })
      return result?.amount ?? null
    },
  })
}
