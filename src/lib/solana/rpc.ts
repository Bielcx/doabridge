import { createSolanaRpc } from '@solana/kit'
import { solanaRpcUrl, type NetworkConfig } from './networks'

const clients = new Map<string, ReturnType<typeof createSolanaRpc>>()

/**
 * Cliente RPC por rede, reaproveitado entre chamadas.
 *
 * Um mapa em vez de um cliente unico porque a rede virou preferencia do usuario:
 * ele pode alternar entre devnet e mainnet sem recarregar a pagina, e cada uma
 * precisa do seu endpoint.
 */
export function rpc(network: NetworkConfig) {
  const url = solanaRpcUrl(network)
  let client = clients.get(url)
  if (!client) {
    client = createSolanaRpc(url)
    clients.set(url, client)
  }
  return client
}
