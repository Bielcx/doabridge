'use client'

import { useState } from 'react'
import { ChainMark } from '@/components/ChainMark'
import { CHAINS, type Asset } from '@/lib/routes'

/**
 * Icone do ativo com a marca da rede sobreposta.
 *
 * Brid.gg e Superbridge convergiram nesse padrao independentemente, o que sugere
 * convencao estabelecida: e o que permite "ETH na Base" e "ETH na Ethereum"
 * aparecerem na mesma lista sem repetir texto em cada linha.
 *
 * O logo vem do proprio catalogo do LI.FI. Quando falta, ou quando a URL quebra,
 * cai nas iniciais do simbolo — que e como a tela inteira funcionava antes. Uma
 * lista de milhares de tokens sempre tem alguns sem logo; o fallback nao e caso
 * raro, e o caso normal na cauda longa.
 *
 * `<img>` cru em vez de next/image de proposito: os logos vem de dezenas de
 * dominios diferentes (trustwallet, coinmarketcap, debank...) e cada um teria que
 * entrar em `images.remotePatterns` a mao. Sao icones de 36px; nao ha o que
 * otimizar.
 */
export function AssetIcon({ asset, size = 36 }: { asset: Asset; size?: number }) {
  const chain = CHAINS[asset.chain]
  const badge = Math.round(size * 0.42)
  const [broken, setBroken] = useState(false)

  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {asset.logoURI && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={asset.logoURI}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          onError={() => setBroken(true)}
          className="rounded-full bg-sunken object-cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <span
          className="flex items-center justify-center rounded-full bg-sunken font-semibold text-ink"
          style={{ width: size, height: size, fontSize: size * 0.34 }}
        >
          {asset.symbol.slice(0, 2)}
        </span>
      )}
      <span
        className="absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-[color:var(--surface)]"
        title={chain.name}
      >
        <ChainMark chain={asset.chain} size={badge} />
      </span>
    </span>
  )
}
