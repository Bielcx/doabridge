'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { EvmWalletSlot } from '@/components/EvmWalletSlot'
import { SolanaWalletSlot } from '@/components/SolanaWalletSlot'
import { useSolanaAccount } from '@/hooks/useSolanaAccount'

/**
 * Indicador unico no header, no lugar de dois chips iguais.
 *
 * Dois chips lado a lado nao diziam qual era qual e nao cabiam no mobile. Aqui o
 * header so informa quantas carteiras estao conectadas; gerenciar acontece no
 * painel, e o uso de cada uma aparece no formulario, ancorado ao papel.
 */
export function WalletsIndicator() {
  const [open, setOpen] = useState(false)
  const { isConnected: evmConnected } = useAccount()
  const solanaAccount = useSolanaAccount()

  const connected = (evmConnected ? 1 : 0) + (solanaAccount ? 1 : 0)

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm transition hover:border-accent"
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            connected > 0 ? 'bg-success' : 'bg-faint'
          }`}
        />
        {connected === 0 ? 'Connect' : `${connected} connected`}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close wallets"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-line bg-sunken p-4 shadow-2xl">
            <h2 className="mb-2 text-sm font-semibold">Wallets</h2>
            <EvmWalletSlot label="Ethereum and Base" />
            <SolanaWalletSlot label="Solana" />
          </div>
        </>
      )}
    </div>
  )
}
