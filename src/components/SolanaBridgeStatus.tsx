'use client'

import { useSolanaBridgeState } from '@/hooks/useSolanaBridgeState'
import { network } from '@/lib/solana/networks'

const LAMPORTS_PER_SOL = 1_000_000_000

/**
 * Estado do bridge nativo na rede ativa.
 *
 * Nao e painel de debug: se o bridge estiver pausado ou o programa nao existir na
 * rede configurada, o usuario precisa saber ANTES de tentar assinar. Assinar uma
 * transacao que vai falhar custa tempo e confianca.
 */
export function SolanaBridgeStatus() {
  const { data, isPending, error } = useSolanaBridgeState()

  if (isPending) {
    return <Line tone="muted">Checking the {network.label} bridge...</Line>
  }

  if (error) {
    return (
      <Line tone="bad">
        Could not reach the Solana RPC. The bridge status is unknown.
      </Line>
    )
  }

  if (!data) {
    return (
      <Line tone="bad">
        No bridge program found on {network.label}. This deployment may have been
        replaced.
      </Line>
    )
  }

  if (data.paused) {
    return <Line tone="bad">The bridge is paused on {network.label}.</Line>
  }

  return (
    <Line tone="muted">
      Bridge live on {network.label} · fee approximately{' '}
      {formatSol(data.estimatedGasFeeLamports)} SOL
    </Line>
  )
}

function formatSol(lamports: bigint) {
  const sol = Number(lamports) / LAMPORTS_PER_SOL
  if (sol === 0) return '0'
  if (sol < 0.000001) return '<0.000001'
  return sol.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
}

function Line({
  tone,
  children,
}: {
  tone: 'muted' | 'bad'
  children: React.ReactNode
}) {
  return (
    <p className={`text-xs ${tone === 'bad' ? 'text-amber-400' : 'text-neutral-500'}`}>
      {children}
    </p>
  )
}
