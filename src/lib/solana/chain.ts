/**
 * Identificador da rede no padrao Wallet Standard. A carteira usa isso pra simular a
 * transacao antes de mostrar pro usuario, entao tem que bater com a rede real.
 *
 * Nota: o tipo `OnlySolanaChains` existe no @solana/react mas NAO e reexportado pelo
 * indice do pacote, entao aqui vai o literal com `as const`.
 */
export const SOLANA_CHAIN = 'solana:mainnet' as const

export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com'

/** Chave onde guardamos qual conta o usuario escolheu da ultima vez. */
export const SELECTED_ACCOUNT_STORAGE_KEY = 'doabridge:solana-account'
