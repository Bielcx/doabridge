import { base, mainnet } from 'wagmi/chains'

/**
 * Redes, ativos e quais pares o app sabe atravessar.
 *
 * A intencao e o usuario escolher origem e destino livremente, como nos bridges que
 * ele ja conhece. Par que a gente ainda nao faz aparece na lista DESABILITADO com o
 * motivo — esconder daria a impressao de que nao existe, e mentir sobre o motivo e
 * pior ainda. Um bridge que oferece um caminho que nao completa prende dinheiro.
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
}

export const CHAINS: Record<ChainKey, ChainInfo> = {
  ethereum: {
    key: 'ethereum',
    name: 'Ethereum',
    family: 'evm',
    tint: '#627eea',
    evmChainId: mainnet.id,
  },
  base: {
    key: 'base',
    name: 'Base',
    family: 'evm',
    tint: '#0052ff',
    evmChainId: base.id,
  },
  solana: {
    key: 'solana',
    name: 'Solana',
    family: 'solana',
    tint: '#9945ff',
  },
}

export const CHAIN_LIST = Object.values(CHAINS)

export const NATIVE_EVM = '0x0000000000000000000000000000000000000000' as const

export type Asset = {
  /** Unico no app: rede + simbolo. */
  id: string
  chain: ChainKey
  symbol: string
  name: string
  decimals: number
  /** Endereco na EVM. NATIVE_EVM representa o ativo nativo da rede. */
  evmAddress?: `0x${string}`
  /** Para ativos cujo endereco depende da rede ativa. */
  fromNetwork?: 'solErc20'
}

/**
 * Lista curta e explicita. Quando crescer, trocar por `getTokens()` do LI.FI no lado
 * EVM — o formato aqui ja e o que aquele retorno preenche.
 */
export const ASSETS: Asset[] = [
  {
    id: 'ethereum:ETH',
    chain: 'ethereum',
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    evmAddress: NATIVE_EVM,
  },
  {
    id: 'ethereum:USDC',
    chain: 'ethereum',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    evmAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  },
  {
    id: 'base:ETH',
    chain: 'base',
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    evmAddress: NATIVE_EVM,
  },
  {
    id: 'base:USDC',
    chain: 'base',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    evmAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  {
    id: 'solana:SOL',
    chain: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
  },
  {
    // SOL embrulhado na Base. O endereco muda entre mainnet e Sepolia, entao sai da
    // config de rede em vez de ficar fixo aqui — ver `solErc20` em networks.ts.
    id: 'base:SOL',
    chain: 'base',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    fromNetwork: 'solErc20',
  },
]

export function assetsOn(chain: ChainKey): Asset[] {
  return ASSETS.filter((a) => a.chain === chain)
}

export function assetById(id: string): Asset {
  const asset = ASSETS.find((a) => a.id === id)
  if (!asset) throw new Error(`Unknown asset: ${id}`)
  return asset
}

export type RouteSupport =
  | { available: true; engine: 'lifi' | 'canonical' }
  | { available: false; reason: string }

/**
 * Que pares o app atravessa hoje.
 *
 * `lifi` = agregador, para EVM <-> EVM.
 * `canonical` = contrato nativo da Base, para Solana -> Base.
 */
export function routeSupport(
  from: ChainKey,
  to: ChainKey,
  options: { testnets?: boolean } = {},
): RouteSupport {
  if (from === to) {
    return { available: false, reason: 'Pick two different networks.' }
  }

  const fromInfo = CHAINS[from]
  const toInfo = CHAINS[to]

  if (fromInfo.family === 'evm' && toInfo.family === 'evm') {
    // O LI.FI descontinuou suporte a testnet — bridges e exchanges tem quase nenhuma
    // liquidez la. Entao com testnets ligado esta rota nao existe, e dizer isso e
    // melhor do que cotar e falhar com erro do agregador.
    if (options.testnets) {
      return {
        available: false,
        reason:
          'Aggregator routes are mainnet only. LI.FI dropped testnet support, so turn testnets off to bridge between Ethereum and Base.',
      }
    }
    return { available: true, engine: 'lifi' }
  }

  if (from === 'solana' && to === 'base') {
    return { available: true, engine: 'canonical' }
  }

  if (from === 'base' && to === 'solana') {
    return {
      available: false,
      reason:
        'Base to Solana needs a 15 minute proving step and two extra signatures. Coming soon.',
    }
  }

  if (from === 'solana' || to === 'solana') {
    return {
      available: false,
      reason: 'Solana only connects to Base. Bridge through Base to reach Ethereum.',
    }
  }

  return { available: false, reason: 'This pair is not supported yet.' }
}

/** Destinos possiveis a partir de uma origem, com o estado de cada um. */
export function destinationsFrom(from: ChainKey, options: { testnets?: boolean } = {}) {
  return CHAIN_LIST.filter((c) => c.key !== from).map((chain) => ({
    chain,
    support: routeSupport(from, chain.key, options),
  }))
}

/**
 * Destino OBRIGATORIO para uma origem, quando o motor nao deixa escolher.
 *
 * O bridge canonico so faz uma coisa: tranca SOL na Solana e mina SOL embrulhado na
 * Base. Nao existe escolha de ativo do outro lado. Sem esta trava o usuario poderia
 * pedir SOL -> USDC, assinar, e receber outra coisa — a interface teria prometido o
 * que o programa nao entrega.
 */
export function requiredDestination(from: Asset): Asset | null {
  if (from.id === 'solana:SOL') return assetById('base:SOL')
  return null
}

/** Ativos oferecidos como destino, dada a origem. */
export function destinationAssets(from: Asset, chain: ChainKey): Asset[] {
  const forced = requiredDestination(from)
  if (forced) return forced.chain === chain ? [forced] : []
  return assetsOn(chain)
}

/** Endereco na EVM, resolvido contra a rede ativa quando necessario. */
export function evmAddressOf(
  asset: Asset,
  network: { base: { solErc20: `0x${string}` } },
): `0x${string}` | undefined {
  if (asset.fromNetwork === 'solErc20') return network.base.solErc20
  return asset.evmAddress
}
