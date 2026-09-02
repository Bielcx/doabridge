'use client'

import { useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { SolanaBridgeButton } from '@/components/SolanaBridgeButton'
import { useSolanaAccount } from '@/hooks/useSolanaAccount'
import { useSolanaBalance } from '@/hooks/useSolanaBalance'
import { useSolanaBridgeState } from '@/hooks/useSolanaBridgeState'
import { RENT_BUFFER_LAMPORTS } from '@/lib/solana/constants'
import { formatSol, toLamports } from '@/lib/solana/format'
import { useNetwork } from '@/app/settings-provider'

/**
 * Solana -> Base pelo bridge canonico da Base.
 *
 * Precisa das DUAS carteiras: a Solana assina e paga, a EVM define quem recebe. Nao
 * da pra abstrair isso num botao so — sao dois enderecos em duas redes, e esconder
 * um deles seria esconder pra onde o dinheiro vai.
 */
export function SolanaBridgePanel() {
  const network = useNetwork()
  const solanaAccount = useSolanaAccount()
  const { address: evmAddress } = useAccount()
  const { data: bridgeState } = useSolanaBridgeState()
  const { data: balance } = useSolanaBalance(solanaAccount?.address)
  const [amount, setAmount] = useState('')

  const amountLamports = useMemo(() => toLamports(amount), [amount])
  const fees = bridgeState?.fees.totalLamports ?? 0n

  /**
   * O maximo transferivel nao e o saldo: precisa sobrar pras duas taxas e pra folga
   * de aluguel da conta. Calcular isso pro usuario evita a tentativa fadada ao erro
   * de digitar o saldo inteiro.
   */
  const maxLamports = useMemo(() => {
    if (balance === undefined || !bridgeState) return null
    const available = balance - fees - RENT_BUFFER_LAMPORTS
    return available > 0n ? available : 0n
  }, [balance, bridgeState, fees])

  /**
   * Validacao antes de assinar. Sem isso o usuario paga gas numa transacao que a
   * rede vai recusar, e recebe um erro de RPC que nao explica nada.
   */
  const shortfall =
    amountLamports !== null && balance !== undefined && bridgeState
      ? amountLamports + fees - balance
      : null
  const insufficient = shortfall !== null && shortfall > 0n

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <label className="block text-sm text-muted" htmlFor="sol-amount">
            Amount
          </label>
          {balance !== undefined && (
            <span className="text-xs text-muted">
              Balance {formatSol(balance)} SOL
              {maxLamports !== null && maxLamports > 0n && (
                <button
                  type="button"
                  onClick={() => setAmount(formatSol(maxLamports))}
                  className="ml-2 text-muted underline underline-offset-2 hover:text-ink"
                >
                  Max
                </button>
              )}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            id="sol-amount"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-line bg-sunken px-3 py-2 text-lg outline-none focus:border-accent"
          />
          <span className="flex items-center rounded-xl border border-line bg-sunken px-3 text-sm text-muted">
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
          {bridgeState ? `~${formatSol(bridgeState.fees.bridgeLamports)} SOL` : '—'}
        </Row>
        <Row label="Relay fee">
          {bridgeState ? `~${formatSol(bridgeState.fees.relayLamports)} SOL` : '—'}
        </Row>
        <Row label="Total cost">
          <span className="font-medium text-ink">
            {bridgeState ? `~${formatSol(bridgeState.fees.totalLamports)} SOL` : '—'}
          </span>
        </Row>
      </dl>

      {insufficient && (
        <p className="text-sm text-warn" role="alert">
          Not enough SOL. You need {formatSol(shortfall!)} more to cover this transfer
          plus fees.
        </p>
      )}

      {!solanaAccount || !evmAddress ? (
        <p className="rounded-xl border border-line bg-sunken px-3 py-3 text-sm text-muted">
          Connect both wallets to bridge. The Solana one signs and pays; the Ethereum
          one receives on Base.
        </p>
      ) : (
        <SolanaBridgeButton
          account={solanaAccount}
          amountLamports={insufficient ? null : amountLamports}
          recipient={evmAddress}
          bridgeState={bridgeState}
        />
      )}

      <p className="text-xs text-faint">
        Canonical bridge on {network.label}. Your SOL is locked in Base&apos;s own
        vault and minted as an ERC-20 — no liquidity pool, no market maker spread.
      </p>
    </div>
  )
}

function shorten(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  )
}
