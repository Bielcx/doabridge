'use client'

import { useSignTransactions } from '@solana/react'
import type { UiWalletAccount } from '@wallet-standard/react'
import { useEffect } from 'react'
import { useSolanaAccount } from '@/hooks/useSolanaAccount'
import { useNetwork } from '@/app/settings-provider'
import { setSolanaSigner } from '@/lib/solana/lifi-adapter'
import type { SolanaChainId } from '@/lib/solana/networks'

/**
 * Mantem o LI.FI sabendo qual carteira Solana esta conectada.
 *
 * O LI.FI e configurado uma vez, no carregamento, mas so pede o assinante la na
 * frente, na hora de executar a rota. Este componente e a ligacao entre a arvore
 * React (que sabe da conta) e aquele registro fora dela — ver lib/solana/lifi-adapter.
 *
 * Nao renderiza nada. Fica montado o tempo todo perto da raiz, e nao dentro do painel
 * de bridge, porque desmontar o painel no meio de uma assinatura tiraria o assinante
 * debaixo do LI.FI.
 */
export function SolanaSignerSync() {
  const account = useSolanaAccount()
  const network = useNetwork()

  // `useSignTransactions` exige conta nao nula, e hook nao pode ser condicional.
  // Por isso o registro real vive num filho que so monta quando ha carteira.
  if (!account) return <ClearSigner />
  return <RegisterSigner account={account} chain={network.solana.chain} />
}

function ClearSigner() {
  useEffect(() => {
    setSolanaSigner(null)
  }, [])
  return null
}

function RegisterSigner({
  account,
  chain,
}: {
  account: UiWalletAccount
  chain: SolanaChainId
}) {
  const signTransactions = useSignTransactions(account, chain)

  useEffect(() => {
    setSolanaSigner({ address: account.address, signTransactions })
    return () => setSolanaSigner(null)
  }, [account.address, signTransactions])

  return null
}
