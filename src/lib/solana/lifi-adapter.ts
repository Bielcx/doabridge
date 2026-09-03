import { PublicKey, VersionedTransaction } from '@solana/web3.js'
import type { SignerWalletAdapter } from '@solana/wallet-adapter-base'

/**
 * Ponte entre a carteira Wallet Standard do app e o executor Solana do LI.FI.
 *
 * O LI.FI pede um `SignerWalletAdapter` do ecossistema @solana/wallet-adapter, que
 * NAO e o que usamos — o app inteiro fala Wallet Standard via @solana/react. Em vez
 * de instalar a arvore inteira do wallet-adapter so pra converter, olhamos o que o
 * SolanaStepExecutor de fato chama no adaptador: `publicKey` e `signAllTransactions`.
 * Sao dois membros. O resto do adaptador nunca e tocado, entao o shim implementa os
 * dois e para por ai.
 *
 * O registro e um modulo com estado porque `createConfig` do LI.FI roda uma vez, no
 * carregamento, e o `getWalletAdapter` e chamado la na frente, na hora de assinar —
 * quando ja existe carteira conectada. Quem preenche isto e o
 * <SolanaSignerSync />, que vive na arvore React e sabe da conta atual.
 */

type SignInput = Readonly<{ transaction: Uint8Array }>
type SignOutput = Readonly<{ signedTransaction: Uint8Array }>

export type SolanaSigner = {
  address: string
  signTransactions: (...inputs: readonly SignInput[]) => Promise<readonly SignOutput[]>
}

let current: SolanaSigner | null = null

export function setSolanaSigner(signer: SolanaSigner | null) {
  current = signer
}

export async function getSolanaWalletAdapter(): Promise<SignerWalletAdapter> {
  const signer = current
  if (!signer) {
    throw new Error('Connect a Solana wallet to bridge from Solana.')
  }

  const adapter = {
    publicKey: new PublicKey(signer.address),
    signAllTransactions: async (transactions: VersionedTransaction[]) => {
      const signed = await signer.signTransactions(
        ...transactions.map((tx) => ({ transaction: tx.serialize() })),
      )
      return signed.map((out) => VersionedTransaction.deserialize(out.signedTransaction))
    },
  }

  // O adaptador real tem dezenas de membros (eventos, estado de conexao, autoConnect)
  // que o executor do LI.FI nunca le. Implementar todos seria codigo morto.
  return adapter as unknown as SignerWalletAdapter
}
