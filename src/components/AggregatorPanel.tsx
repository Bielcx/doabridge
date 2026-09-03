'use client'

import { useState } from 'react'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { EvmWalletSlot } from '@/components/EvmWalletSlot'
import { SolanaWalletSlot } from '@/components/SolanaWalletSlot'
import { useBridgeExecution } from '@/hooks/useBridgeExecution'
import { useBridgeRoutes } from '@/hooks/useBridgeRoutes'
import { useSolanaAccount } from '@/hooks/useSolanaAccount'
import { CHAINS, type Asset } from '@/lib/routes'

/**
 * Qualquer par de redes via LI.FI — inclusive Solana <-> Base, nas duas direcoes.
 *
 * Agregador em vez de chamada direta nos contratos do OP Stack: usuario final nao tem
 * como auditar um frontend desconhecido chamando L1StandardBridge na mao, e o LI.FI e
 * o mesmo motor que o Brid.gg usa.
 *
 * Atravessar entre Solana e EVM precisa das DUAS carteiras: uma assina e paga, a
 * outra define quem recebe. Sao dois enderecos em duas redes e nao da pra abstrair
 * num botao so — esconder um deles seria esconder pra onde o dinheiro vai. Quando o
 * par e EVM <-> EVM, o mesmo endereco atende os dois lados e so uma carteira aparece.
 */
export function AggregatorPanel({ from, to }: { from: Asset; to: Asset }) {
  const { address: evmAddress, isConnected } = useAccount()
  const solanaAccount = useSolanaAccount()
  const { openConnectModal } = useConnectModal()
  const [amount, setAmount] = useState('')

  const needsEvm = CHAINS[from.chain].family === 'evm' || CHAINS[to.chain].family === 'evm'
  const needsSolana =
    CHAINS[from.chain].family === 'solana' || CHAINS[to.chain].family === 'solana'

  const missingEvm = needsEvm && !(isConnected && evmAddress)
  const missingSolana = needsSolana && !solanaAccount

  const routes = useBridgeRoutes({
    from,
    to,
    amount,
    evmAddress,
    solanaAddress: solanaAccount?.address,
  })
  const best = routes.data?.[0]
  const { state, execute } = useBridgeExecution()
  const running = state.status === 'running'

  return (
    <div className="space-y-4">
      <div className="space-y-1 rounded-xl border border-line bg-sunken px-3 py-1">
        {needsEvm && <EvmWalletSlot label={needsSolana ? 'EVM wallet' : 'Wallet'} />}
        {needsSolana && <SolanaWalletSlot label="Solana wallet" />}
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-muted" htmlFor="bridge-amount">
          Amount
        </label>
        <div className="flex gap-2">
          <input
            id="bridge-amount"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-line bg-sunken px-3 py-2 text-lg outline-none focus:border-accent"
          />
          <span className="flex items-center rounded-xl border border-line bg-sunken px-3 text-sm text-muted">
            {from.symbol}
          </span>
        </div>
      </div>

      <QuoteLine
        loading={routes.isFetching}
        error={routes.error instanceof Error ? routes.error.message : null}
        receive={best ? `${formatUnits(BigInt(best.toAmount), to.decimals)} ${to.symbol}` : null}
      />

      <button
        type="button"
        disabled={!missingEvm && (missingSolana || !best || running)}
        onClick={() => (missingEvm ? openConnectModal?.() : best && execute(best))}
        className="w-full rounded-xl bg-accent px-4 py-3 font-medium transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-sunken disabled:text-faint"
      >
        {missingEvm
          ? 'Connect wallet'
          : missingSolana
            ? 'Connect a Solana wallet'
            : running
              ? 'Bridging...'
              : 'Do a bridge'}
      </button>

      {state.status === 'error' && (
        <p className="text-sm text-danger" role="alert">
          {state.message}
        </p>
      )}
      {state.status === 'done' && <p className="text-sm text-success">Transfer complete.</p>}
    </div>
  )
}

function QuoteLine({
  loading,
  error,
  receive,
}: {
  loading: boolean
  error: string | null
  receive: string | null
}) {
  if (error) return <p className="text-sm text-danger">{error}</p>
  if (loading) return <p className="text-sm text-muted">Finding a route...</p>
  if (!receive) return <p className="text-sm text-faint">Enter an amount to get a quote.</p>
  return (
    <p className="text-sm text-ink">
      You receive approximately <span className="font-medium">{receive}</span>
    </p>
  )
}
