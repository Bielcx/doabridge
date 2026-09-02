'use client'

import { useMemo, useState } from 'react'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { base, mainnet } from 'wagmi/chains'
import { useBridgeExecution } from '@/hooks/useBridgeExecution'
import { useBridgeRoutes } from '@/hooks/useBridgeRoutes'
import { CHAIN_LABELS, TOKENS, tokenBySymbol } from '@/lib/tokens'

export function BridgeForm() {
  const { address, isConnected } = useAccount()
  const [fromChainId, setFromChainId] = useState<number>(mainnet.id)
  const [symbol, setSymbol] = useState('ETH')
  const [amount, setAmount] = useState('')

  const toChainId = fromChainId === mainnet.id ? base.id : mainnet.id
  const token = useMemo(() => tokenBySymbol(symbol), [symbol])

  const routes = useBridgeRoutes({ fromChainId, toChainId, token, amount, address })
  const best = routes.data?.[0]
  const { state, execute } = useBridgeExecution()

  const running = state.status === 'running'

  return (
    <div className="w-full max-w-md space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-400">Transfer</span>
        <button
          type="button"
          onClick={() => setFromChainId(toChainId)}
          className="rounded-lg border border-neutral-700 px-2 py-1 text-xs text-neutral-300 transition hover:border-neutral-500"
        >
          switch
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={CHAIN_LABELS[fromChainId]} sub="from" />
        <Field label={CHAIN_LABELS[toChainId]} sub="to" />
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-neutral-400" htmlFor="amount">
          Amount
        </label>
        <div className="flex gap-2">
          <input
            id="amount"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-lg outline-none focus:border-blue-500"
          />
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm"
            aria-label="Token"
          >
            {TOKENS.map((t) => (
              <option key={t.symbol} value={t.symbol}>
                {t.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>

      <QuoteLine
        loading={routes.isFetching}
        error={routes.error instanceof Error ? routes.error.message : null}
        receive={
          best ? `${formatUnits(BigInt(best.toAmount), token.decimals)} ${token.symbol}` : null
        }
      />

      <button
        type="button"
        disabled={!isConnected || !best || running}
        onClick={() => best && execute(best)}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
      >
        {!isConnected ? 'Connect wallet' : running ? 'Bridging...' : 'Do a bridge'}
      </button>

      {state.status === 'error' && (
        <p className="text-sm text-red-400" role="alert">
          {state.message}
        </p>
      )}
      {state.status === 'done' && (
        <p className="text-sm text-green-400">Transfer complete.</p>
      )}
    </div>
  )
}

function Field({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2">
      <div className="text-xs uppercase tracking-wide text-neutral-500">{sub}</div>
      <div className="text-base">{label}</div>
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
  if (error) return <p className="text-sm text-red-400">{error}</p>
  if (loading) return <p className="text-sm text-neutral-400">Finding a route...</p>
  if (!receive) return <p className="text-sm text-neutral-600">Enter an amount to get a quote.</p>
  return (
    <p className="text-sm text-neutral-300">
      You receive approximately <span className="font-medium">{receive}</span>
    </p>
  )
}
