'use client'

import { CHAINS, type Asset } from '@/lib/routes'

/**
 * Icone do ativo com o marcador da rede sobreposto.
 *
 * Brid.gg e Superbridge convergiram nesse padrao independentemente, o que sugere
 * convencao estabelecida: e o que permite "ETH na Base" e "ETH na Ethereum"
 * aparecerem na mesma lista sem repetir texto em cada linha.
 *
 * Sem logo de terceiro por enquanto — inicial do simbolo sobre a cor da rede.
 * Trocar por SVG quando existir identidade visual definida.
 */
export function AssetIcon({ asset, size = 36 }: { asset: Asset; size?: number }) {
  const chain = CHAINS[asset.chain]
  const badge = Math.round(size * 0.42)

  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span
        className="flex items-center justify-center rounded-full bg-sunken font-semibold text-ink"
        style={{ width: size, height: size, fontSize: size * 0.34 }}
      >
        {asset.symbol.slice(0, 2)}
      </span>
      <span
        className="absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-[color:var(--surface-sunken)]"
        style={{ width: badge, height: badge, background: chain.tint }}
        title={chain.name}
        aria-hidden="true"
      />
    </span>
  )
}
