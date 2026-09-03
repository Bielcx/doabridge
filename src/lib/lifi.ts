import {
  EVM,
  Solana,
  createConfig,
  getRoutes,
  getTokens,
  type Route,
  type RoutesRequest,
  type Token,
} from '@lifi/sdk'
import { getWalletClient, switchChain } from 'wagmi/actions'
import { getSolanaWalletAdapter } from './solana/lifi-adapter'
import { wagmiConfig } from './wagmi'

/**
 * Configuracao do LI.FI SDK.
 *
 * Por que LI.FI e nao chamada direta nos contratos do OP Stack: um usuario final nao
 * tem como auditar um frontend desconhecido chamando L1StandardBridge na mao. O LI.FI
 * e o mesmo motor que o Brid.gg usa — o bundle deles carrega @lifi/widget com
 * `integrator: "bridgg"` —, entao a superficie de confianca do app fica igual a do
 * concorrente conhecido. A diferenca e que o widget deles roda com
 * `chains: { types: { allow: ["EVM"] } }` e portanto nao mostra Solana. O nosso
 * mostra.
 *
 * Nota de versao: fixado em @lifi/sdk v3.x de proposito. A v4 removeu o provider EVM
 * do pacote core e ainda nao publicou um pacote substituto (existe
 * @lifi/sdk-provider-solana, mas nao ha @lifi/sdk-provider-evm no npm). Reavaliar
 * quando o provider EVM da v4 sair.
 */

let configured = false

export function ensureLifiConfig() {
  if (configured) return
  createConfig({
    integrator: 'doabridge',
    providers: [
      EVM({
        getWalletClient: () => getWalletClient(wagmiConfig),
        switchChain: async (chainId) => {
          const chain = await switchChain(wagmiConfig, {
            chainId: chainId as (typeof wagmiConfig)['chains'][number]['id'],
          })
          return getWalletClient(wagmiConfig, { chainId: chain.id })
        },
      }),
      Solana({ getWalletAdapter: getSolanaWalletAdapter }),
    ],
  })
  configured = true
}

export type QuoteParams = {
  fromChainId: number
  toChainId: number
  fromTokenAddress: string
  toTokenAddress: string
  /** Valor ja em unidades minimas (wei, ou 1e6 para USDC). */
  fromAmount: string
  fromAddress: string
  /**
   * Quem recebe. Obrigatorio e separado do remetente: atravessando entre Solana e
   * EVM os dois enderecos sao de formatos diferentes, e reaproveitar o de origem
   * mandaria fundos pra um endereco que nao existe na rede de destino.
   */
  toAddress: string
}

export async function fetchRoutes(params: QuoteParams): Promise<Route[]> {
  ensureLifiConfig()

  const request: RoutesRequest = {
    fromChainId: params.fromChainId,
    toChainId: params.toChainId,
    fromTokenAddress: params.fromTokenAddress,
    toTokenAddress: params.toTokenAddress,
    fromAmount: params.fromAmount,
    fromAddress: params.fromAddress,
    toAddress: params.toAddress,
  }

  const result = await getRoutes(request)
  return result.routes
}

/** Catalogo de tokens do LI.FI pras redes pedidas. */
export async function fetchTokens(chainIds: number[]): Promise<Record<string, Token[]>> {
  ensureLifiConfig()
  const result = await getTokens({ chains: chainIds })
  return result.tokens as unknown as Record<string, Token[]>
}
