'use client'

import { SelectedWalletAccountContextProvider } from '@solana/react'
import { getWalletFeature, useWallets, type UiWallet } from '@wallet-standard/react'
import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { SELECTED_ACCOUNT_STORAGE_KEY } from '@/lib/solana/networks'
import { useNetwork } from './settings-provider'

/**
 * FRONTEIRA DE ISOLAMENTO — lado Solana.
 *
 * Espelha a regra do lado EVM (ver lib/wagmi.ts): so este arquivo e o
 * ConnectSolanaWallet importam de '@solana/react' e '@wallet-standard/react'.
 *
 * As duas familias de carteira convivem, mas nao se misturam: EVM entra pelo wagmi,
 * Solana entra por aqui. Nao existe um botao generico de "conectar carteira"
 * abstraindo as duas — sao dois enderecos reais em duas redes, e o usuario precisa
 * enxergar os dois.
 */

/**
 * Persistencia da conta escolhida. Envolvida em try/catch porque localStorage lanca
 * excecao em aba anonima e com storage bloqueado — nesse caso o app segue
 * funcionando, so nao lembra a escolha entre sessoes.
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

type ConnectFeature = {
  connect: (input?: { silent?: boolean }) => Promise<unknown>
}

/**
 * Reconecta a carteira ao recarregar a pagina.
 *
 * Isto NAO e redundante com o stateSync acima. O provider do @solana/react apenas
 * procura a conta salva dentro de `wallet.accounts` — ele nunca chama connect. Se a
 * extensao nao esta expondo conta nenhuma no load, nao ha o que encontrar e a
 * selecao se perde, mesmo estando salva. Guardar a escolha e restabelecer a conexao
 * sao duas coisas distintas; esta e a segunda.
 *
 * `silent: true` significa "conecte apenas se este site ja foi autorizado" — nao
 * abre popup. Se o usuario nunca autorizou, ou revogou, a promise rejeita e a gente
 * simplesmente segue desconectado, que e o comportamento correto.
 *
 * O efeito depende de `wallets` porque a extensao entra no registro do Wallet
 * Standard de forma assincrona: no primeiro render a lista costuma estar vazia.
 */
function SolanaAutoConnect() {
  const wallets = useWallets()
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current) return

    const savedKey = stateSync.getSelectedWallet()
    if (!savedKey) return

    const savedWalletName = savedKey.split(':')[0]
    const wallet = wallets.find((w) => w.name === savedWalletName)
    // Ainda nao registrada: o efeito roda de novo quando `wallets` mudar.
    if (!wallet) return

    attempted.current = true
    try {
      const feature = getWalletFeature(wallet, 'standard:connect') as ConnectFeature
      void feature.connect({ silent: true }).catch(() => {
        // Autorizacao revogada ou expirada. Fica desconectado.
      })
    } catch {
      // Carteira sem suporte a standard:connect. Nada a fazer.
    }
  }, [wallets])

  return null
}

export function SolanaProviders({ children }: { children: ReactNode }) {
  const network = useNetwork()

  /**
   * So carteiras que declaram suporte a rede ativa aparecem na lista. Muda junto com
   * o interruptor de testnets — trocar de rede pode desselecionar a conta atual, o
   * que e o comportamento correto.
   */
  const filterWallets = useCallback(
    (wallet: UiWallet) => wallet.chains.includes(network.solana.chain),
    [network.solana.chain],
  )

  return (
    <SelectedWalletAccountContextProvider
      filterWallets={filterWallets}
      stateSync={stateSync}
    >
      <SolanaAutoConnect />
      {children}
    </SelectedWalletAccountContextProvider>
  )
}
