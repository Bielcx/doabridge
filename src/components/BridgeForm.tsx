'use client'

import { useState } from 'react'
import { base, mainnet } from 'wagmi/chains'
import { EvmBridgePanel } from '@/components/EvmBridgePanel'
import { SolanaBridgePanel } from '@/components/SolanaBridgePanel'

/**
 * Rotas suportadas, explicitas.
 *
 * Base -> Solana esta ausente de proposito: aquela direcao exige ~15 minutos de espera
 * mais duas assinaturas de prova na Solana, e merece um fluxo proprio com estado
 * persistido. Oferecer o par sem isso pronto seria prender fundos do usuario.
 */
const ROUTES = [
  { id: 'eth-base', label: 'Ethereum', to: 'Base', engine: 'evm', from: mainnet.id, dest: base.id },
  { id: 'base-eth', label: 'Base', to: 'Ethereum', engine: 'evm', from: base.id, dest: mainnet.id },
  { id: 'sol-base', label: 'Solana', to: 'Base', engine: 'solana' },
] as const

type RouteId = (typeof ROUTES)[number]['id']

export function BridgeForm() {
  const [routeId, setRouteId] = useState<RouteId>('eth-base')
  const route = ROUTES.find((r) => r.id === routeId)!

  return (
    <div className="w-full max-w-md space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
      <span className="text-sm text-neutral-400">Transfer</span>

      <div className="grid grid-cols-2 gap-3">
        <label className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2">
          <span className="block text-xs uppercase tracking-wide text-neutral-500">from</span>
          <select
            value={routeId}
            onChange={(e) => setRouteId(e.target.value as RouteId)}
            className="w-full bg-transparent text-base outline-none"
          >
            {ROUTES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2">
          <span className="block text-xs uppercase tracking-wide text-neutral-500">to</span>
          <span className="block py-0.5 text-base">{route.to}</span>
        </div>
      </div>

      {route.engine === 'evm' ? (
        <EvmBridgePanel fromChainId={route.from} toChainId={route.dest} />
      ) : (
        <SolanaBridgePanel />
      )}
    </div>
  )
}
