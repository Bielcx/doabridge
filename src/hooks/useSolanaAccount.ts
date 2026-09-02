'use client'

import { useSelectedWalletAccount } from '@solana/react'

/**
 * Conta Solana selecionada, ou undefined se nao ha carteira conectada.
 *
 * Existe pra manter a fronteira de isolamento: componentes de feature perguntam ao
 * projeto, nao a biblioteca de carteira.
 */
export function useSolanaAccount() {
  const [account] = useSelectedWalletAccount()
  return account
}
