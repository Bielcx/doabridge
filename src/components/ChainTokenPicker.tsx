'use client'

import { useState } from 'react'
import { AssetIcon } from '@/components/AssetIcon'
import {
  assetsOn,
  CHAIN_LIST,
  CHAINS,
  routeSupport,
  type Asset,
  type ChainKey,
} from '@/lib/routes'

/**
 * Painel de escolha de rede e ativo.
 *
 * Substitui o conteudo do card em vez de abrir modal — e o padrao dos dois
 * concorrentes, e mantem o tamanho da caixa estavel, sem escurecer a pagina.
 *
 * Redes cujo par nao e suportado aparecem desabilitadas COM O MOTIVO. Esconder
 * daria a impressao de que a rede nao existe; mostrar sem explicar viraria clique
 * frustrado. Dizer "Base pra Solana precisa de uma etapa de prova, em breve"
 * comunica limite e ambicao ao mesmo tempo.
 */
export function ChainTokenPicker({
  title,
  selected,
  /** Quando presente, restringe as redes ao que se atravessa a partir desta. */
  pairedWith,
  onPick,
  onCancel,
}: {
  title: string
  selected: Asset
  pairedWith?: { chain: ChainKey; side: 'origin' | 'destination' }
  onPick: (asset: Asset) => void
  onCancel: () => void
}) {
  const [chain, setChain] = useState<ChainKey>(selected.chain)

  const chainState = (candidate: ChainKey) => {
    if (!pairedWith) return { enabled: true, reason: '' }
    const support =
      pairedWith.side === 'origin'
        ? routeSupport(pairedWith.chain, candidate)
        : routeSupport(candidate, pairedWith.chain)
    return { enabled: support.available, reason: support.available ? '' : support.reason }
  }

  const blocked = chainState(chain)

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Back"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-sunken hover:text-ink"
        >
          ←
        </button>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {CHAIN_LIST.map((info) => {
          const state = chainState(info.key)
          const active = info.key === chain
          return (
            <button
              key={info.key}
              type="button"
              onClick={() => setChain(info.key)}
              title={state.reason || info.name}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs transition ${
                active ? 'border-accent bg-sunken' : 'border-line hover:border-accent'
              } ${state.enabled ? '' : 'opacity-40'}`}
            >
              <span
                className="h-5 w-5 rounded-full"
                style={{ background: info.tint }}
                aria-hidden="true"
              />
              {info.name}
            </button>
          )
        })}
      </div>

      {!blocked.enabled && (
        <p className="mb-3 rounded-xl border border-warn/40 bg-warn-bg px-3 py-2 text-xs text-warn">
          {blocked.reason}
        </p>
      )}

      <ul className="space-y-1">
        {assetsOn(chain).map((asset) => (
          <li key={asset.id}>
            <button
              type="button"
              disabled={!blocked.enabled}
              onClick={() => onPick(asset)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-40"
            >
              <AssetIcon asset={asset} />
              <span className="flex-1">
                <span className="block text-sm font-medium">{asset.symbol}</span>
                <span className="block text-xs text-muted">
                  {asset.name} on {CHAINS[asset.chain].name}
                </span>
              </span>
              {asset.id === selected.id && (
                <span className="text-xs text-accent">selected</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
