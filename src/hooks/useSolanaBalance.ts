'use client'

import { useQuery } from '@tanstack/react-query'
import { address as toAddress } from '@solana/kit'
import { ACTIVE_NETWORK } from '@/lib/solana/networks'
import { rpc } from '@/lib/solana/rpc'

/**
 * Saldo em lamports da conta Solana conectada.
 *
 * Revalida sozinho porque o valor muda quando o proprio usuario transfere — sem isso
 * a tela mostraria saldo velho logo depois de uma transferencia bem sucedida.
 */
export function useSolanaBalance(walletAddress: string | undefined) {
  return useQuery({
    queryKey: ['solana-balance', ACTIVE_NETWORK, walletAddress],
    enabled: Boolean(walletAddress),
    staleTime: 15_000,
    refetchInterval: 30_000,
    queryFn: async () => {
      const result = await rpc().getBalance(toAddress(walletAddress!)).send()
      return result.value
    },
  })
}
