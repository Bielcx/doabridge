'use client'

import { useMemo, useState } from 'react'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { useBridgeExecution } from '@/hooks/useBridgeExecution'
import { useBridgeRoutes } from '@/hooks/useBridgeRoutes'
import { TOKENS, tokenBySymbol } from '@/lib/tokens'

/**
 * Ethereum <-> Base via LI.FI.
 *
 * Agregador em vez de chamada direta nos contratos do OP Stack: usuario final nao tem
 * como auditar um frontend desconhecido chamando L1StandardBridge na mao, e o LI.FI e
 * o mesmo motor que Brid.gg e Superbridge usam.
 */
export function EvmBridgePanel({
  fromChainId,
  toChainId,
}: {
  fromChainId: number
  toChainId: number
}) {
  const { address, isConnected } = useAccount()
  const [symbol, setSymbol] = useState('ETH')
  const [amount, setAmount] = useState('')

  const token = useMemo(() => tokenBySymbol(symbol), [symbol])
  const routes = useBridgeRoutes({ fromChainId, toChainId, token, amount, address })
  const best = routes.data?.[0]
  const { state, execute } = useBridgeExecution()
  const running = state.status === 'running'

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm text-neutral-400" htmlFor="evm-amount">
          Amount
        </label>
        <div className="flex gap-2">
          <input
            id="evm-amount"
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
      {state.status === 'done' && <p className="text-sm text-green-400">Transfer complete.</p>}
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
