'use client'

import { useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { SolanaBridgeButton } from '@/components/SolanaBridgeButton'
import { useSolanaAccount } from '@/hooks/useSolanaAccount'
import { useSolanaBridgeState } from '@/hooks/useSolanaBridgeState'
import { network } from '@/lib/solana/networks'

const LAMPORTS_PER_SOL = 1_000_000_000n

/**
 * Solana -> Base pelo bridge canonico da Base.
 *
 * Precisa das DUAS carteiras: a Solana assina e paga, a EVM define quem recebe. Nao
 * da pra abstrair isso num botao so — sao dois enderecos em duas redes, e esconder
 * um deles seria esconder pra onde o dinheiro vai.
 */
export function SolanaBridgePanel() {
  const solanaAccount = useSolanaAccount()
  const { address: evmAddress } = useAccount()
  const { data: bridgeState } = useSolanaBridgeState()
  const [amount, setAmount] = useState('')

  const amountLamports = useMemo(() => toLamports(amount), [amount])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm text-neutral-400" htmlFor="sol-amount">
          Amount
        </label>
        <div className="flex gap-2">
          <input
            id="sol-amount"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-lg outline-none focus:border-blue-500"
          />
          <span className="flex items-center rounded-xl border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-400">
            SOL
          </span>
        </div>
      </div>

      <dl className="space-y-1 text-xs">
        <Row label="Paying from">
          {solanaAccount ? shorten(solanaAccount.address) : 'Solana wallet not connected'}
        </Row>
        <Row label="Receiving on Base">
          {evmAddress ? shorten(evmAddress) : 'Ethereum wallet not connected'}
        </Row>
        <Row label="Bridge fee">
          {bridgeState
            ? `~${formatSol(bridgeState.estimatedGasFeeLamports)} SOL`
            : '—'}
        </Row>
      </dl>

      {!solanaAccount || !evmAddress ? (
        <p className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-3 text-sm text-neutral-400">
          Connect both wallets to bridge. The Solana one signs and pays; the Ethereum
          one receives on Base.
        </p>
      ) : (
        <SolanaBridgeButton
          account={solanaAccount}
          amountLamports={amountLamports}
          recipient={evmAddress}
          bridgeState={bridgeState}
        />
      )}

      <p className="text-xs text-neutral-600">
        Canonical bridge on {network.label}. Your SOL is locked in Base&apos;s own
        vault and minted as an ERC-20 — no liquidity pool, no market maker spread.
      </p>
    </div>
  )
}

function toLamports(value: string): bigint | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!/^\d*\.?\d*$/.test(trimmed)) return null
  const [whole = '0', fraction = ''] = trimmed.split('.')
  const padded = (fraction + '000000000').slice(0, 9)
  try {
    return BigInt(whole || '0') * LAMPORTS_PER_SOL + BigInt(padded || '0')
  } catch {
    return null
  }
}

function formatSol(lamports: bigint) {
  const sol = Number(lamports) / Number(LAMPORTS_PER_SOL)
  if (sol === 0) return '0'
  if (sol < 0.000001) return '<0.000001'
  return sol.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
}

function shorten(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-neutral-300">{children}</dd>
    </div>
  )
}
