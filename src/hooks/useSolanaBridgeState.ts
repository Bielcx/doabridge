'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchBridgeState } from '@/lib/solana/bridge-state'
import { ACTIVE_NETWORK } from '@/lib/solana/networks'

/**
 * Estado do bridge na Solana. Precisa estar carregado antes de montar qualquer
 * transferencia, porque o `gasFeeReceiver` sai daqui.
 *
 * Os parametros de taxa mudam devagar, entao um cache de um minuto e suficiente e
 * evita bater no RPC publico a cada render.
 */
export function useSolanaBridgeState() {
  return useQuery({
    queryKey: ['solana-bridge-state', ACTIVE_NETWORK],
    queryFn: fetchBridgeState,
    staleTime: 60_000,
    retry: 1,
  })
}
