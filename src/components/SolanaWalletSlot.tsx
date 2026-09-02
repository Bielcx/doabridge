'use client'

import { useSelectedWalletAccount } from '@solana/react'
import {
  useConnect,
  type UiWallet,
  type UiWalletAccount,
} from '@wallet-standard/react'
import { useState } from 'react'
import { ConnectAction, shortenAddress, WalletSlot } from '@/components/WalletSlot'

/**
 * FRONTEIRA DE ISOLAMENTO — lado Solana.
 *
 * A lista de carteiras ja vem filtrada pela rede ativa pelo provider, entao alternar
 * testnets muda o que aparece aqui.
 */
export function SolanaWalletSlot({ label }: { label: string }) {
  const [account, setAccount, wallets] = useSelectedWalletAccount()
  const [picking, setPicking] = useState(false)

  return (
    <div className="relative">
      <WalletSlot
        label={label}
        connected={Boolean(account)}
        address={account ? shortenAddress(account.address) : null}
        onDisconnect={() => setAccount(undefined)}
        action={
          <ConnectAction onClick={() => setPicking((v) => !v)}>
            Connect Solana
          </ConnectAction>
        }
      />

      {picking && !account && (
        <>
          <button
            type="button"
            aria-label="Close wallet list"
            onClick={() => setPicking(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-line bg-sunken shadow-xl">
            {wallets.length === 0 ? (
              <p className="px-3 py-3 text-xs text-muted">
                No Solana wallet detected. Install Phantom or Solflare.
              </p>
            ) : (
              wallets.map((wallet) => (
                <WalletChoice
                  key={wallet.name}
                  wallet={wallet}
                  onConnected={(picked) => {
                    setAccount(picked)
                    setPicking(false)
                  }}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Uma linha por carteira. Precisa ser componente separado porque `useConnect` e um
 * hook que recebe a carteira — nao da pra chamar dentro de um map.
 */
function WalletChoice({
  wallet,
  onConnected,
}: {
  wallet: UiWallet
  onConnected: (account: UiWalletAccount) => void
}) {
  const [isConnecting, connect] = useConnect(wallet)
  const [failed, setFailed] = useState(false)

  return (
    <button
      type="button"
      disabled={isConnecting}
      onClick={async () => {
        setFailed(false)
        try {
          const [picked] = await connect()
          if (picked) onConnected(picked)
        } catch {
          setFailed(true)
        }
      }}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition hover:bg-surface disabled:opacity-50"
    >
      {wallet.icon && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={wallet.icon} alt="" className="h-4 w-4 rounded" />
      )}
      <span className="flex-1">{wallet.name}</span>
      {isConnecting && <span className="text-faint">...</span>}
      {failed && <span className="text-danger">failed</span>}
    </button>
  )
}
