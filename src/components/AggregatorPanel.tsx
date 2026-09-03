'use client'

import { useState } from 'react'
import { formatUnits, parseUnits } from 'viem'
import { useAccount } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { EvmWalletSlot } from '@/components/EvmWalletSlot'
import { SolanaWalletSlot } from '@/components/SolanaWalletSlot'
import { useAssetBalance } from '@/hooks/useAssetBalance'
import { useBridgeExecution } from '@/hooks/useBridgeExecution'
import { useBridgeRoutes } from '@/hooks/useBridgeRoutes'
import { useSolanaAccount } from '@/hooks/useSolanaAccount'
import { CHAINS, type Asset } from '@/lib/routes'
import type { Route } from '@lifi/sdk'

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
 *
 * O detalhamento da cotacao — quem roteia, quanto custa, quanto demora — espelha o
 * do painel canonico. O usuario nao escolhe entre os dois motores, o par escolhe por
 * ele; entao os dois precisam responder as mesmas perguntas, ou trocar de par
 * pareceria trocar de produto.
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

  // Quem paga e a carteira da rede de ORIGEM. E o saldo dela que limita a
  // transferencia; o da carteira que recebe nao entra na conta.
  const payer = CHAINS[from.chain].family === 'solana' ? solanaAccount?.address : evmAddress
  const { data: balance } = useAssetBalance(from, payer)

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

  const wanted = safeParse(amount, from.decimals)
  const insufficient = wanted !== null && balance !== null && balance !== undefined && wanted > balance

  const blocked = missingSolana || insufficient || !best || running

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <label className="block text-sm text-muted" htmlFor="bridge-amount">
            Amount
          </label>
          {balance !== null && balance !== undefined && (
            <span className="text-xs text-muted">
              Balance {formatAmount(balance, from.decimals)} {from.symbol}
              {balance > 0n && (
                <button
                  type="button"
                  onClick={() => setAmount(formatUnits(balance, from.decimals))}
                  className="ml-2 underline underline-offset-2 hover:text-ink"
                >
                  Max
                </button>
              )}
            </span>
          )}
        </div>
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

      <div className="space-y-1 rounded-xl border border-line bg-sunken px-3 py-1">
        {needsEvm && <EvmWalletSlot label={needsSolana ? 'EVM wallet' : 'Wallet'} />}
        {needsSolana && <SolanaWalletSlot label="Solana wallet" />}
      </div>

      <QuoteDetails
        loading={routes.isFetching && !best}
        error={routes.error instanceof Error ? routes.error.message : null}
        route={best}
        to={to}
      />

      {insufficient && (
        <p className="text-sm text-warn" role="alert">
          Not enough {from.symbol} on {CHAINS[from.chain].name}.
        </p>
      )}

      <button
        type="button"
        disabled={!missingEvm && blocked}
        onClick={() => (missingEvm ? openConnectModal?.() : best && execute(best))}
        className="w-full rounded-xl bg-accent px-4 py-3 font-medium text-[color:var(--accent-text)] transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-sunken disabled:text-faint"
      >
        {missingEvm
          ? 'Connect wallet'
          : missingSolana
            ? 'Connect a Solana wallet'
            : insufficient
              ? `Not enough ${from.symbol}`
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

/**
 * O que a cotacao custa, quanto demora e quem executa.
 *
 * So "you receive X" escondia as tres coisas que fazem alguem desistir no meio:
 * a rota poder demorar minutos, o gas comer parte do valor, e a transferencia ser
 * entregue por uma ponte de terceiro que ninguem nomeou.
 */
function QuoteDetails({
  loading,
  error,
  route,
  to,
}: {
  loading: boolean
  error: string | null
  route: Route | undefined
  to: Asset
}) {
  if (error) return <p className="text-sm text-danger">{error}</p>
  if (loading) return <p className="text-sm text-muted">Finding a route...</p>
  if (!route) return <p className="text-sm text-faint">Enter an amount to get a quote.</p>

  const step = route.steps[0]
  const seconds = route.steps.reduce((sum, s) => sum + (s.estimate?.executionDuration ?? 0), 0)

  return (
    <dl className="space-y-1 rounded-xl border border-line bg-sunken px-3 py-2 text-xs">
      <Row label="You receive">
        <span className="font-medium text-ink">
          {formatAmount(BigInt(route.toAmount), to.decimals)} {to.symbol}
        </span>
      </Row>
      {route.gasCostUSD && <Row label="Network cost">~${route.gasCostUSD}</Row>}
      {seconds > 0 && <Row label="Estimated time">{formatDuration(seconds)}</Row>}
      {step?.toolDetails?.name && <Row label="Route">{step.toolDetails.name}</Row>}
    </dl>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="truncate text-ink">{children}</dd>
    </div>
  )
}

/**
 * Corta as casas decimais. `formatUnits` devolve as 18 casas inteiras, e um saldo
 * de "1.999999999999999999 ETH" ocupa a linha toda sem dizer nada a mais. O botao
 * Max continua usando o valor cheio — arredondar ali deixaria poeira pra tras.
 */
function formatAmount(value: bigint, decimals: number): string {
  const full = formatUnits(value, decimals)
  const n = Number(full)
  if (!Number.isFinite(n)) return full
  if (n === 0) return '0'
  if (n < 0.0001) return '<0.0001'
  return n.toLocaleString('en-US', { maximumFractionDigits: n < 1 ? 6 : 4 })
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `~${seconds}s`
  return `~${Math.round(seconds / 60)} min`
}

function safeParse(value: string, decimals: number): bigint | null {
  if (!value.trim()) return null
  try {
    return parseUnits(value as `${number}`, decimals)
  } catch {
    return null
  }
}
