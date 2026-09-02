'use client'

import { SelectedWalletAccountContextProvider } from '@solana/react'
import type { UiWallet } from '@wallet-standard/react'
import type { ReactNode } from 'react'
import { SELECTED_ACCOUNT_STORAGE_KEY, SOLANA_CHAIN } from '@/lib/solana/chain'

/**
 * FRONTEIRA DE ISOLAMENTO — lado Solana.
 *
 * Espelha a regra do lado EVM (ver lib/wagmi.ts): so este arquivo e o
 * ConnectSolanaWallet importam de '@solana/react' e '@wallet-standard/react'.
 * Os componentes de feature falam com os hooks do projeto, nao com a biblioteca.
 *
 * As duas familias de carteira convivem, mas nao se misturam: EVM entra pelo wagmi,
 * Solana entra por aqui. Em nenhum lugar da arvore existe um "conecte sua carteira"
 * generico tentando abstrair as duas — sao dois enderecos reais, em duas redes, e o
 * usuario precisa enxergar os dois.
 */

/** So carteiras que declaram suporte a mainnet da Solana aparecem na lista. */
function supportsSolanaMainnet(wallet: UiWallet) {
  return wallet.chains.includes(SOLANA_CHAIN)
}

/**
 * Persistencia da conta escolhida. Envolvida em try/catch porque localStorage lanca
 * excecao em aba anonima e com cookies de terceiros bloqueados — nesse caso o app
 * segue funcionando, so nao lembra a escolha entre sessoes.
 */
const stateSync = {
  getSelectedWallet: () => {
    try {
      return localStorage.getItem(SELECTED_ACCOUNT_STORAGE_KEY)
    } catch {
      return null
    }
  },
  storeSelectedWallet: (accountKey: string) => {
    try {
      localStorage.setItem(SELECTED_ACCOUNT_STORAGE_KEY, accountKey)
    } catch {
      // sem persistencia, sem problema
    }
  },
  deleteSelectedWallet: () => {
    try {
      localStorage.removeItem(SELECTED_ACCOUNT_STORAGE_KEY)
    } catch {
      // idem
    }
  },
}

export function SolanaProviders({ children }: { children: ReactNode }) {
  return (
    <SelectedWalletAccountContextProvider
      filterWallets={supportsSolanaMainnet}
      stateSync={stateSync}
    >
      {children}
    </SelectedWalletAccountContextProvider>
  )
}
