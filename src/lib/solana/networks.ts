import { address, type Address } from '@solana/kit'
import { base, baseSepolia } from 'wagmi/chains'
import type { Chain } from 'viem'

/**
 * Configuracao por rede do bridge nativo Base <-> Solana.
 *
 * Valores extraidos de `scripts/src/internal/constants.ts` do repositorio base/bridge
 * (commit cf64f80). Os de mainnet conferem com a documentacao publica da Base.
 *
 * PADRAO E DEVNET, DE PROPOSITO. Este app move dinheiro; se alguem esquecer de
 * configurar a variavel, o pior caso deve ser uma transferencia de teste que nao
 * custa nada, nunca uma na mainnet. Apontar pra mainnet exige dizer isso
 * explicitamente.
 */

export type NetworkName = 'devnet' | 'mainnet'

export type SolanaChainId = 'solana:devnet' | 'solana:mainnet'

export type NetworkConfig = {
  name: NetworkName
  /** Rotulo curto pra mostrar na interface. */
  label: string
  solana: {
    /** Identificador no padrao Wallet Standard. A carteira simula a transacao com ele. */
    chain: SolanaChainId
    defaultRpcUrl: string
    bridgeProgram: Address
    baseRelayerProgram: Address
    explorerTx: (signature: string) => string
  }
  base: {
    chain: Chain
    bridgeContract: `0x${string}`
    /** SOL representado como ERC-20 do lado da Base. */
    solErc20: `0x${string}`
    explorerTx: (hash: string) => string
  }
}

export const NETWORKS: Record<NetworkName, NetworkConfig> = {
  devnet: {
    name: 'devnet',
    label: 'Devnet',
    solana: {
      chain: 'solana:devnet',
      defaultRpcUrl: 'https://api.devnet.solana.com',
      bridgeProgram: address('7c6mteAcTXaQ1MFBCrnuzoZVTTAEfZwa6wgy4bqX3KXC'),
      baseRelayerProgram: address('56MBBEYAtQAdjT4e1NzHD8XaoyRSTvfgbSVVcEcHj51H'),
      explorerTx: (s) => `https://solscan.io/tx/${s}?cluster=devnet`,
    },
    base: {
      chain: baseSepolia,
      bridgeContract: '0x01824a90d32A69022DdAEcC6C5C14Ed08dB4EB9B',
      solErc20: '0xCace0c896714DaF7098FFD8CC54aFCFe0338b4BC',
      explorerTx: (h) => `https://sepolia.basescan.org/tx/${h}`,
    },
  },
  mainnet: {
    name: 'mainnet',
    label: 'Mainnet',
    solana: {
      chain: 'solana:mainnet',
      defaultRpcUrl: 'https://api.mainnet-beta.solana.com',
      bridgeProgram: address('HNCne2FkVaNghhjKXapxJzPaBvAKDG1Ge3gqhZyfVWLM'),
      baseRelayerProgram: address('g1et5VenhfJHJwsdJsDbxWZuotD5H4iELNG61kS4fb9'),
      explorerTx: (s) => `https://solscan.io/tx/${s}`,
    },
    base: {
      chain: base,
      bridgeContract: '0x3eff766C76a1be2Ce1aCF2B69c78bCae257D5188',
      solErc20: '0x311935Cd80B76769bF2ecC9D8Ab7635b2139cf82',
      explorerTx: (h) => `https://basescan.org/tx/${h}`,
    },
  },
}

function resolveNetwork(): NetworkName {
  const raw = process.env.NEXT_PUBLIC_NETWORK
  if (raw === 'mainnet') return 'mainnet'
  if (raw === 'devnet' || !raw) return 'devnet'
  // Valor escrito errado nao pode virar mainnet por acidente.
  console.warn(`NEXT_PUBLIC_NETWORK="${raw}" nao reconhecido. Usando devnet.`)
  return 'devnet'
}

export const ACTIVE_NETWORK = resolveNetwork()
export const network = NETWORKS[ACTIVE_NETWORK]

export const isMainnet = ACTIVE_NETWORK === 'mainnet'

/** RPC da Solana. O publico tem rate limit agressivo; em producao use um dedicado. */
export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC || network.solana.defaultRpcUrl

/** Chave onde guardamos qual conta Solana o usuario escolheu da ultima vez. */
export const SELECTED_ACCOUNT_STORAGE_KEY = 'doabridge:solana-account'
