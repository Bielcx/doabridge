'use client'

import type { ReactNode } from 'react'

/**
 * Uma carteira, mostrada onde ela importa: ao lado do papel que exerce.
 *
 * Brid.gg e Superbridge nao precisam disto porque sao EVM puro — uma carteira, um
 * chip no header, sem ambiguidade. Aqui uma transferencia Solana -> Base envolve
 * duas carteiras com papeis diferentes: uma assina e paga, a outra recebe. Dois
 * chips iguais no header nao dizem qual e qual, entao a carteira aparece ancorada
 * no papel: "Paying from", "Receiving on Base".
 */
export function WalletSlot({
  label,
  address,
  connected,
  action,
  onDisconnect,
}: {
  label: string
  /** Endereco ja abreviado, ou null quando desconectado. */
  address: string | null
  connected: boolean
  /** Controle mostrado quando nao ha carteira. */
  action: ReactNode
  onDisconnect?: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-xs text-muted">{label}</span>
      {connected && address ? (
        <button
          type="button"
          onClick={onDisconnect}
          title={onDisconnect ? 'Disconnect' : undefined}
          className="rounded-lg px-1.5 py-0.5 font-mono text-xs text-ink transition hover:bg-sunken"
        >
          {address}
        </button>
      ) : (
        action
      )}
    </div>
  )
}

export function shortenAddress(value: string, lead = 6) {
  return `${value.slice(0, lead)}...${value.slice(-4)}`
}

export function ConnectAction({
  children,
  onClick,
}: {
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-line px-2 py-1 text-xs text-muted transition hover:border-accent hover:text-ink"
    >
      {children}
    </button>
  )
}
