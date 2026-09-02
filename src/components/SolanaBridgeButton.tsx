'use client'

import { useWalletAccountTransactionSendingSigner } from '@solana/react'
import type { UiWalletAccount } from '@wallet-standard/react'
import { useState } from 'react'
import { sendBridgeSol, type SendBridgeSolResult } from '@/lib/solana/bridge-sol'
import type { BridgeState } from '@/lib/solana/bridge-state'
import { network } from '@/lib/solana/networks'

/**
 * FRONTEIRA DE ISOLAMENTO — lado Solana.
 *
 * Recebe a conta por prop em vez de buscar sozinho, porque
 * `useWalletAccountTransactionSendingSigner` exige uma conta nao nula e hook nao pode
 * ser condicional. Quem monta este componente so o monta quando ha carteira
 * conectada. E o padrao que a documentacao do proprio @solana/react usa.
 */

type Props = {
  account: UiWalletAccount
  amountLamports: bigint | null
  recipient: `0x${string}` | undefined
  bridgeState: BridgeState | null | undefined
}

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; result: SendBridgeSolResult }
  | { kind: 'error'; message: string }

export function SolanaBridgeButton({
  account,
  amountLamports,
  recipient,
  bridgeState,
}: Props) {
  const signer = useWalletAccountTransactionSendingSigner(account, network.solana.chain)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const blocked =
    !amountLamports || amountLamports <= 0n || !recipient || !bridgeState || bridgeState.paused

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={blocked || status.kind === 'sending'}
        onClick={async () => {
          if (blocked) return
          setStatus({ kind: 'sending' })
          try {
            const result = await sendBridgeSol({
              signer,
              amountLamports,
              recipient,
              bridgeState,
            })
            setStatus({ kind: 'sent', result })
          } catch (e) {
            setStatus({
              kind: 'error',
              message: e instanceof Error ? e.message : 'The transfer failed',
            })
          }
        }}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
      >
        {status.kind === 'sending' ? 'Confirm in your wallet...' : 'Do a bridge'}
      </button>

      {status.kind === 'error' && (
        <p className="text-sm text-red-400" role="alert">
          {status.message}
        </p>
      )}

      {status.kind === 'sent' && (
        <div className="space-y-1 text-sm">
          <p className="text-green-400">
            Sent. Base should receive it in about 15 seconds.
          </p>
          <a
            href={status.result.explorerUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-neutral-400 underline underline-offset-2 hover:text-neutral-200"
          >
            View transaction
          </a>
        </div>
      )}
    </div>
  )
}
