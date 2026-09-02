'use client'

import { useQuery } from '@tanstack/react-query'
import { useNetwork } from '@/app/settings-provider'
import { fetchBridgeState } from '@/lib/solana/bridge-state'

/**
 * Estado do bridge na rede ativa. Precisa estar carregado antes de montar qualquer
 * transferencia, porque o `gasFeeReceiver` sai daqui.
 *
 * A rede entra na chave da query: alternar entre devnet e mainnet troca de cache em
 * vez de reaproveitar dados da rede errada.
 */
export function useSolanaBridgeState() {
  const network = useNetwork()
  return useQuery({
    queryKey: ['solana-bridge-state', network.name],
    queryFn: () => fetchBridgeState(network),
    staleTime: 60_000,
    retry: 1,
  })
}
