'use client'

import { useState } from 'react'
import { AssetIcon } from '@/components/AssetIcon'
import { ChainTokenPicker } from '@/components/ChainTokenPicker'
import { EvmBridgePanel } from '@/components/EvmBridgePanel'
import { SolanaBridgePanel } from '@/components/SolanaBridgePanel'
import {
  assetById,
  assetsOn,
  CHAINS,
  requiredDestination,
  routeSupport,
  type Asset,
  type ChainKey,
} from '@/lib/routes'

type Picking = 'from' | 'to' | null

export function BridgeForm() {
  const [from, setFrom] = useState<Asset>(() => assetById('ethereum:ETH'))
  const [to, setTo] = useState<Asset>(() => assetById('base:ETH'))
  const [picking, setPicking] = useState<Picking>(null)

  const support = routeSupport(from.chain, to.chain)

  /** Ao trocar um lado, conserta o outro se o par deixar de existir. */
  function pickFrom(asset: Asset) {
    setFrom(asset)

    // Alguns motores nao deixam escolher o outro lado. O canonico so mina SOL
    // embrulhado na Base, entao o destino e consequencia, nao opcao.
    const forced = requiredDestination(asset)
    if (forced) {
      setTo(forced)
    } else if (!routeSupport(asset.chain, to.chain).available) {
      const fallback = firstReachableFrom(asset.chain)
      if (fallback) setTo(fallback)
    }
    setPicking(null)
  }

  function pickTo(asset: Asset) {
    setTo(asset)
    setPicking(null)
  }

  function invert() {
    if (!routeSupport(to.chain, from.chain).available) return
    setFrom(to)
    setTo(from)
  }

  const canInvert = routeSupport(to.chain, from.chain).available

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
          originAsset={picking === 'to' ? from : undefined}
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

            <button
              type="button"
              onClick={invert}
              disabled={!canInvert}
              aria-label="Swap direction"
              title={canInvert ? 'Swap direction' : 'That direction is not supported yet'}
              className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:border-accent hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              ↓
            </button>
          </div>

          {support.available ? (
            support.engine === 'lifi' ? (
              <EvmBridgePanel from={from} to={to} />
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
      <span className="flex-1">
        <span className="block text-xs uppercase tracking-wide text-muted">{label}</span>
        <span className="block text-base font-medium">{CHAINS[asset.chain].name}</span>
      </span>
      <span className="mr-10 rounded-lg border border-line px-2 py-1 text-xs text-muted">
        {asset.symbol}
      </span>
    </button>
  )
}

function firstReachableFrom(chain: ChainKey): Asset | null {
  for (const candidate of ['base', 'ethereum', 'solana'] as ChainKey[]) {
    if (candidate === chain) continue
    if (routeSupport(chain, candidate).available) {
      const [asset] = assetsOn(candidate)
      if (asset) return asset
    }
  }
  return null
}
