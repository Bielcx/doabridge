'use client'

import { useSelectedWalletAccount } from '@solana/react'
import {
  useConnect,
  type UiWallet,
  type UiWalletAccount,
} from '@wallet-standard/react'
import { useState } from 'react'

/**
 * FRONTEIRA DE ISOLAMENTO — lado Solana. Ver app/solana-providers.tsx.
 * Este e o unico componente que importa das bibliotecas de carteira Solana.
 */
export function ConnectSolanaWallet() {
  const [selectedAccount, setSelectedAccount, wallets] = useSelectedWalletAccount()
  const [open, setOpen] = useState(false)

  if (selectedAccount) {
    return (
      <button
        type="button"
        onClick={() => setSelectedAccount(undefined)}
        className="rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm transition hover:border-neutral-500"
        title={selectedAccount.address}
      >
        {shorten(selectedAccount.address)}
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm transition hover:border-neutral-500"
      >
        Connect Solana
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-56 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-xl">
          {wallets.length === 0 ? (
            <p className="px-3 py-3 text-sm text-neutral-500">
              No Solana wallet detected. Install Phantom or Solflare.
            </p>
          ) : (
            wallets.map((wallet) => (
              <WalletRow
                key={wallet.name}
                wallet={wallet}
                onConnected={(account) => {
                  setSelectedAccount(account)
                  setOpen(false)
                }}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Uma linha por carteira. Precisa ser componente separado porque `useConnect` e um
 * hook que recebe a carteira — nao da pra chamar dentro de um map.
 */
function WalletRow({
  wallet,
  onConnected,
}: {
  wallet: UiWallet
  onConnected: (account: UiWalletAccount) => void
}) {
  const [isConnecting, connect] = useConnect(wallet)
  const [error, setError] = useState<string | null>(null)

  return (
    <button
      type="button"
      disabled={isConnecting}
      onClick={async () => {
        setError(null)
        try {
          const [account] = await connect()
          if (account) onConnected(account)
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Could not connect')
        }
      }}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-neutral-900 disabled:opacity-50"
    >
      {wallet.icon && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={wallet.icon} alt="" className="h-5 w-5 rounded" />
      )}
      <span className="flex-1">{wallet.name}</span>
      {isConnecting && <span className="text-xs text-neutral-500">...</span>}
      {error && <span className="text-xs text-red-400">!</span>}
    </button>
  )
}

function shorten(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}
