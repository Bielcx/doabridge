'use client'

import { useState } from 'react'
import { useSettings } from '@/app/settings-provider'
import { AggregatorPanel } from '@/components/AggregatorPanel'
import { AssetIcon } from '@/components/AssetIcon'
import { ChainTokenPicker } from '@/components/ChainTokenPicker'
import { SolanaBridgePanel } from '@/components/SolanaBridgePanel'
import {
  CHAINS,
  DEFAULT_FROM,
  DEFAULT_TO,
  engineFor,
  fallbackAssetsOn,
  routeSupport,
  type Asset,
  type ChainKey,
} from '@/lib/routes'

type Picking = 'from' | 'to' | null

export function BridgeForm() {
  const [from, setFrom] = useState<Asset>(DEFAULT_FROM)
  const [to, setTo] = useState<Asset>(DEFAULT_TO)
  const [picking, setPicking] = useState<Picking>(null)
  const { testnets, network } = useSettings()

  const options = { testnets, solErc20: network.base.solErc20 }
  const support = engineFor(from, to, options)

  /** Ao trocar um lado, conserta o outro se o par deixar de existir. */
  function pickFrom(asset: Asset) {
    setFrom(asset)
    if (!routeSupport(asset.chain, to.chain, { testnets }).available) {
      const fallback = firstReachableFrom(asset.chain, testnets)
      if (fallback) setTo(fallback)
    }
    setPicking(null)
  }

  function pickTo(asset: Asset) {
    setTo(asset)
    if (!routeSupport(from.chain, asset.chain, { testnets }).available) {
      const fallback = firstReachableTo(asset.chain, testnets)
      if (fallback) setFrom(fallback)
    }
    setPicking(null)
  }

  function invert() {
    if (!canInvert) return
    setFrom(to)
    setTo(from)
  }

  const canInvert = routeSupport(to.chain, from.chain, { testnets }).available

  return (
    <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-5">
      {picking ? (
        <ChainTokenPicker
          title={picking === 'from' ? 'Send from' : 'Send to'}
          selected={picking === 'from' ? from : to}
          pairedWith={
            picking === 'from'
              ? { chain: to.chain, side: 'destination' }
              : { chain: from.chain, side: 'origin' }
          }
          testnets={testnets}
          onPick={picking === 'from' ? pickFrom : pickTo}
          onCancel={() => setPicking(null)}
        />
      ) : (
        <div className="space-y-4">
          <span className="text-sm text-muted">Transfer</span>

          <div className="relative rounded-xl border border-line bg-sunken">
            <AssetRow label="From" asset={from} onClick={() => setPicking('from')} />
            <div className="mx-3 border-t border-line" />
            <AssetRow label="To" asset={to} onClick={() => setPicking('to')} />

            {/*
              * Centralizado na divisoria, e nao encostado na direita: e ali que a
              * seta significa "troca estes dois". Encostado na borda ele disputava
              * espaco com o simbolo do ativo, que precisava de uma margem a mao
              * pra desviar.
              */}
            <button
              type="button"
              onClick={invert}
              disabled={!canInvert}
              aria-label="Swap direction"
              title={canInvert ? 'Swap direction' : 'That direction is not supported yet'}
              className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-sm transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                <path
                  d="M7 4v14m0 0-3-3m3 3 3-3M17 20V6m0 0-3 3m3-3 3 3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {support.available ? (
            support.engine === 'lifi' ? (
              <AggregatorPanel from={from} to={to} />
            ) : (
              <SolanaBridgePanel to={to} />
            )
          ) : (
            <p className="rounded-xl border border-warn/40 bg-warn-bg px-3 py-3 text-sm text-warn">
              {support.reason}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function AssetRow({
  label,
  asset,
  onClick,
}: {
  label: string
  asset: Asset
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-surface"
    >
      <AssetIcon asset={asset} />
      {/*
       * O simbolo vem primeiro e a rede depois. Antes era o contrario, e as duas
       * linhas do card abriam com "Ethereum" e "Base" enquanto o que muda de fato
       * na transferencia — a moeda — ficava numa etiqueta pequena no canto.
       */}
      <span className="min-w-0 flex-1">
        <span className="block text-xs uppercase tracking-wide text-muted">{label}</span>
        <span className="block truncate text-base font-medium">
          {asset.symbol}
          <span className="ml-1.5 text-sm font-normal text-muted">
            on {CHAINS[asset.chain].name}
          </span>
        </span>
      </span>
      {/* Seta de "abre uma lista": sem ela a linha nao parece clicavel. */}
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
        <path
          d="m9 6 6 6-6 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-faint"
        />
      </svg>
    </button>
  )
}

const ORDER: ChainKey[] = ['base', 'ethereum', 'solana']

function firstReachableFrom(chain: ChainKey, testnets: boolean): Asset | null {
  for (const candidate of ORDER) {
    if (candidate === chain) continue
    if (!routeSupport(chain, candidate, { testnets }).available) continue
    const [asset] = fallbackAssetsOn(candidate)
    if (asset) return asset
  }
  return null
}

function firstReachableTo(chain: ChainKey, testnets: boolean): Asset | null {
  for (const candidate of ORDER) {
    if (candidate === chain) continue
    if (!routeSupport(candidate, chain, { testnets }).available) continue
    const [asset] = fallbackAssetsOn(candidate)
    if (asset) return asset
  }
  return null
}
