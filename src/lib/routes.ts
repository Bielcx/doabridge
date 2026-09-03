import { base, mainnet } from 'wagmi/chains'

/**
 * Redes, ativos e quais pares o app sabe atravessar.
 *
 * A lista de ativos NAO mora mais aqui. Ela vem do LI.FI em tempo de execucao
 * (ver lib/tokens.ts) — sao ~5.500 tokens na Ethereum, ~1.000 na Base e ~4.400
 * na Solana, e transcrever isso a mao seria uma lista desatualizada no dia
 * seguinte. O que sobra aqui e a lista curta de FALLBACK: o par inicial que a
 * tela abre e os unicos ativos que existem em testnet, onde o LI.FI nao opera.
 */

export type ChainKey = 'ethereum' | 'base' | 'solana'

export type ChainInfo = {
  key: ChainKey
  name: string
  family: 'evm' | 'solana'
  /** Cor da marca da rede, usada no marcador do icone. */
  tint: string
  /** Presente so nas EVM. */
  evmChainId?: number
  /**
   * Id da rede no LI.FI. Nas EVM e o chain id de verdade; na Solana e um numero
   * sintetico que o LI.FI usa pra caber redes nao-EVM no mesmo campo.
   */
  lifiChainId: number
}

/** Id da Solana no LI.FI. Nao e um chain id EVM — nao usar em nada do wagmi. */
export const LIFI_SOLANA_CHAIN_ID = 1151111081099710

export const CHAINS: Record<ChainKey, ChainInfo> = {
  ethereum: {
    key: 'ethereum',
    name: 'Ethereum',
    family: 'evm',
    tint: '#627eea',
    evmChainId: mainnet.id,
    lifiChainId: mainnet.id,
  },
  base: {
    key: 'base',
    name: 'Base',
    family: 'evm',
    tint: '#0052ff',
    evmChainId: base.id,
    lifiChainId: base.id,
  },
  solana: {
    key: 'solana',
    name: 'Solana',
    family: 'solana',
    tint: '#9945ff',
    lifiChainId: LIFI_SOLANA_CHAIN_ID,
  },
}

export const CHAIN_LIST = Object.values(CHAINS)

export function chainOfLifiId(id: number): ChainKey | undefined {
  return CHAIN_LIST.find((c) => c.lifiChainId === id)?.key
}

export const NATIVE_EVM = '0x0000000000000000000000000000000000000000' as const

/** Como o LI.FI enderecca o SOL nativo. Nao e o mint do wSOL SPL. */
export const NATIVE_SOL = '11111111111111111111111111111111' as const

export type Asset = {
  /** `chain:endereco`. Unico no app. */
  id: string
  chain: ChainKey
  /** Endereco na rede de origem: `0x…` nas EVM, o mint na Solana. */
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
  /**
   * Ativos cujo endereco muda entre mainnet e testnet. Hoje so o SOL embrulhado
   * na Base — o ERC-20 tem endereco diferente na Sepolia, entao ele sai da config
   * de rede em vez de ficar fixo aqui.
   */
  fromNetwork?: 'solErc20'
}

export function assetId(chain: ChainKey, address: string): string {
  return `${chain}:${address.toLowerCase()}`
}

/**
 * Lista de fallback. Serve pro par inicial da tela e pro modo testnet, onde o
 * LI.FI nao tem lista pra oferecer. Em mainnet o seletor mostra o catalogo do
 * LI.FI e esta lista nao aparece.
 */
export const FALLBACK_ASSETS: Asset[] = [
  {
    id: assetId('ethereum', NATIVE_EVM),
    chain: 'ethereum',
    address: NATIVE_EVM,
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
  },
  {
    id: assetId('base', NATIVE_EVM),
    chain: 'base',
    address: NATIVE_EVM,
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
  },
  {
    id: assetId('solana', NATIVE_SOL),
    chain: 'solana',
    address: NATIVE_SOL,
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
  },
  {
    // O endereco real entra em evmAddressOf, resolvido contra a rede ativa.
    id: 'base:sol-wrapped',
    chain: 'base',
    address: '',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    fromNetwork: 'solErc20',
  },
]

export const DEFAULT_FROM = FALLBACK_ASSETS[0]
export const DEFAULT_TO = FALLBACK_ASSETS[1]

export function fallbackAssetsOn(chain: ChainKey): Asset[] {
  return FALLBACK_ASSETS.filter((a) => a.chain === chain)
}

export type RouteSupport =
  | { available: true; engine: 'lifi' | 'canonical' }
  | { available: false; reason: string }

/**
 * Que pares de REDE o app atravessa.
 *
 * O LI.FI cobre as tres redes nas duas direcoes, inclusive Base -> Solana, que
 * antes estava marcado como "em breve" aqui. Verificado com cotacao real: o
 * Mayan atende SOL <-> Base ETH e o Polymer atende USDC.
 *
 * Testnet e outra historia: o LI.FI desligou o suporte, entao la so existe o
 * bridge canonico da Base, e ele so vai de Solana pra Base.
 */
export function routeSupport(
  from: ChainKey,
  to: ChainKey,
  options: { testnets?: boolean } = {},
): RouteSupport {
  if (from === to) {
    return { available: false, reason: 'Pick two different networks.' }
  }

  if (options.testnets) {
    if (from === 'solana' && to === 'base') return { available: true, engine: 'canonical' }
    return {
      available: false,
      reason:
        'On testnets only the canonical Solana to Base bridge is live. LI.FI dropped testnet support, so turn testnets off for every other pair.',
    }
  }

  return { available: true, engine: 'lifi' }
}

/**
 * Que motor atravessa ESTE par de ativos.
 *
 * O bridge canonico da Base faz uma coisa so: tranca SOL nativo na Solana e mina
 * o SOL embrulhado na Base. Quando o usuario pede exatamente isso, ele ganha —
 * e o caminho sem intermediario, sem depender de liquidez de relayer. Qualquer
 * outro par vai pelo agregador.
 */
export function engineFor(
  from: Asset,
  to: Asset,
  options: { testnets?: boolean; solErc20: `0x${string}` },
): RouteSupport {
  if (from.id === to.id) {
    return { available: false, reason: 'Pick two different assets.' }
  }

  const chains = routeSupport(from.chain, to.chain, options)
  if (!chains.available) return chains

  if (isNativeSol(from) && isWrappedSolOnBase(to, options.solErc20)) {
    return { available: true, engine: 'canonical' }
  }

  if (options.testnets) {
    return {
      available: false,
      reason: 'On testnets the canonical bridge only moves native SOL into wrapped SOL on Base.',
    }
  }

  return { available: true, engine: 'lifi' }
}

export function isNativeSol(asset: Asset): boolean {
  return asset.chain === 'solana' && asset.address === NATIVE_SOL
}

export function isWrappedSolOnBase(asset: Asset, solErc20: `0x${string}`): boolean {
  if (asset.chain !== 'base') return false
  if (asset.fromNetwork === 'solErc20') return true
  return asset.address.toLowerCase() === solErc20.toLowerCase()
}

/** Destinos possiveis a partir de uma origem, com o estado de cada um. */
export function destinationsFrom(from: ChainKey, options: { testnets?: boolean } = {}) {
  return CHAIN_LIST.filter((c) => c.key !== from).map((chain) => ({
    chain,
    support: routeSupport(from, chain.key, options),
  }))
}

/** Endereco na EVM, resolvido contra a rede ativa quando necessario. */
export function evmAddressOf(
  asset: Asset,
  network: { base: { solErc20: `0x${string}` } },
): `0x${string}` | undefined {
  if (asset.fromNetwork === 'solErc20') return network.base.solErc20
  if (asset.chain === 'solana') return undefined
  return asset.address as `0x${string}`
}

/** Endereco do ativo pro LI.FI, seja EVM ou Solana. */
export function lifiAddressOf(
  asset: Asset,
  network: { base: { solErc20: `0x${string}` } },
): string {
  if (asset.chain === 'solana') return asset.address
  return evmAddressOf(asset, network) ?? asset.address
}
