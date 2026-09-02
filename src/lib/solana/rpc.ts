import { createSolanaRpc } from '@solana/kit'
import { SOLANA_RPC_URL } from './networks'

let client: ReturnType<typeof createSolanaRpc> | null = null

/** Cliente RPC unico do app. Criar um por chamada desperdicia conexao. */
export function rpc() {
  client ??= createSolanaRpc(SOLANA_RPC_URL)
  return client
}
