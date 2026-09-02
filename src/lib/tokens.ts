import { base, mainnet } from 'wagmi/chains'

export const NATIVE = '0x0000000000000000000000000000000000000000' as const

export type TokenInfo = {
  symbol: string
  name: string
  decimals: number
  /** Endereco por chainId. NATIVE representa o ativo nativo da rede. */
  addresses: Record<number, `0x${string}`>
}

/**
 * Lista curta e explicita para o MVP. Nao e uma token list completa de proposito:
 * o objetivo aqui e o caminho feliz do bridge L1 <-> Base, nao cobertura de long tail.
 * Quando precisar de mais, trocar por `getTokens()` do proprio LI.FI.
 */
export const TOKENS: TokenInfo[] = [
  {
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    addresses: {
      [mainnet.id]: NATIVE,
      [base.id]: NATIVE,
    },
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    addresses: {
      [mainnet.id]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      [base.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    },
  },
]

export const CHAIN_LABELS: Record<number, string> = {
  [mainnet.id]: 'Ethereum',
  [base.id]: 'Base',
}

export function tokenBySymbol(symbol: string): TokenInfo {
  const token = TOKENS.find((t) => t.symbol === symbol)
  if (!token) throw new Error(`Unknown token: ${symbol}`)
  return token
}
