'use client'

import { useState } from 'react'
import { AssetIcon } from '@/components/AssetIcon'
import { useAssetList } from '@/hooks/useTokens'
import { CHAIN_LIST, CHAINS, routeSupport, type Asset, type ChainKey } from '@/lib/routes'

/**
 * Painel de escolha de rede e ativo.
 *
 * Substitui o conteudo do card em vez de abrir modal — e o padrao dos dois
 * concorrentes, e mantem o tamanho da caixa estavel, sem escurecer a pagina.
 *
 * A lista de ativos vem do catalogo do LI.FI, entao tem milhares de linhas por
 * rede. Duas consequencias no desenho: existe campo de busca, e sem busca a lista
 * sai cortada nos primeiros resultados. Cortar e honesto porque o contador diz o
 * tamanho real — esconder o total daria a impressao de que o catalogo e curto.
 *
 * Redes cujo par nao e suportado aparecem desabilitadas COM O MOTIVO. Esconder
 * daria a impressao de que a rede nao existe; mostrar sem explicar viraria clique
 * frustrado.
 */
export function ChainTokenPicker({
  title,
  selected,
  /** Quando presente, restringe as redes ao que se atravessa a partir desta. */
  pairedWith,
  testnets = false,
  onPick,
  onCancel,
}: {
  title: string
  selected: Asset
  pairedWith?: { chain: ChainKey; side: 'origin' | 'destination' }
  testnets?: boolean
  onPick: (asset: Asset) => void
  onCancel: () => void
}) {
  const [chain, setChain] = useState<ChainKey>(selected.chain)
  const [query, setQuery] = useState('')
  const { assets, loading, error, total } = useAssetList({ chain, query, testnets })

  const chainState = (candidate: ChainKey) => {
    if (!pairedWith) return { enabled: true, reason: '' }
    const support =
      pairedWith.side === 'origin'
        ? routeSupport(pairedWith.chain, candidate, { testnets })
        : routeSupport(candidate, pairedWith.chain, { testnets })
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

      <div className="mb-3 grid grid-cols-3 gap-2">
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

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search name, symbol or paste an address"
        aria-label="Search assets"
        className="mb-3 w-full rounded-xl border border-line bg-sunken px-3 py-2 text-sm outline-none placeholder:text-faint focus:border-accent"
      />

      {loading && <p className="py-6 text-center text-sm text-muted">Loading assets...</p>}
      {error && <p className="py-6 text-center text-sm text-danger">{error}</p>}

      <ul className="max-h-72 space-y-1 overflow-y-auto">
        {assets.map((asset) => (
          <li key={asset.id}>
            <button
              type="button"
              disabled={!blocked.enabled}
              onClick={() => onPick(asset)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-40"
            >
              <AssetIcon asset={asset} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{asset.symbol}</span>
                <span className="block truncate text-xs text-muted">
                  {asset.name} on {CHAINS[asset.chain].name}
                </span>
              </span>
              {asset.id === selected.id && <span className="text-xs text-accent">selected</span>}
            </button>
          </li>
        ))}
      </ul>

      {!loading && !error && assets.length === 0 && (
        <p className="py-6 text-center text-sm text-muted">
          Nothing matches {query ? `"${query}"` : 'this network'}.
        </p>
      )}

      {!loading && !query && total > assets.length && (
        <p className="pt-2 text-center text-xs text-faint">
          Showing {assets.length} of {total.toLocaleString()} assets. Search to find the rest.
        </p>
      )}
    </div>
  )
}
