'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { fetchTokens } from '@/lib/lifi'
import {
  assetId,
  CHAINS,
  fallbackAssetsOn,
  type Asset,
  type ChainKey,
} from '@/lib/routes'

/**
 * Catalogo de ativos de uma rede.
 *
 * Vem do LI.FI, nao de lista fixa: sao milhares de tokens por rede e uma lista
 * digitada a mao ja nasce velha. Em testnet o LI.FI nao opera, entao cai na lista
 * curta de fallback — que la e a lista completa mesmo, porque o unico caminho vivo
 * em testnet e o bridge canonico.
 *
 * O catalogo inteiro e uma resposta grande e que quase nao muda, entao fica em cache
 * por uma hora e e buscado UMA vez pras tres redes, nao uma vez por rede.
 */
export function useTokenCatalog(enabled: boolean) {
  const chainIds = useMemo(() => Object.values(CHAINS).map((c) => c.lifiChainId), [])

  return useQuery({
    queryKey: ['lifi-tokens', chainIds],
    enabled,
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      const byChainId = await fetchTokens(chainIds)
      const catalog = {} as Record<ChainKey, Asset[]>

      for (const info of Object.values(CHAINS)) {
        const tokens = byChainId[String(info.lifiChainId)] ?? []
        catalog[info.key] = tokens.map((token) => ({
          id: assetId(info.key, token.address),
          chain: info.key,
          address: token.address,
          symbol: token.symbol,
          name: token.name || token.symbol,
          decimals: token.decimals,
          logoURI: token.logoURI,
        }))
      }

      return catalog
    },
  })
}

/**
 * Ativos de uma rede ja filtrados pela busca.
 *
 * A busca casa simbolo, nome e endereco. Endereco importa: token novo ou sem logo
 * costuma nao ser achavel pelo nome, e colar o contrato e como o usuario que sabe o
 * que quer faz. Sem termo de busca a lista sai cortada — o LI.FI ja devolve por
 * relevancia, e renderizar cinco mil linhas trava o navegador sem ajudar ninguem.
 */
export function useAssetList({
  chain,
  query,
  testnets,
  limit = 60,
}: {
  chain: ChainKey
  query: string
  testnets: boolean
  limit?: number
}) {
  const catalog = useTokenCatalog(!testnets)
  const catalogForChain = catalog.data?.[chain]
  const all = useMemo(
    () => (testnets ? fallbackAssetsOn(chain) : (catalogForChain ?? [])),
    [testnets, chain, catalogForChain],
  )

  const assets = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return all.slice(0, limit)
    const matches = all.filter(
      (a) =>
        a.symbol.toLowerCase().includes(term) ||
        a.name.toLowerCase().includes(term) ||
        a.address.toLowerCase() === term,
    )
    // Simbolo que comeca com o termo vem antes de quem so o contem, senao buscar
    // "eth" enterra o ETH embaixo de qualquer token com "eth" no meio do nome.
    matches.sort((a, b) => rank(a.symbol, term) - rank(b.symbol, term))
    return matches.slice(0, limit)
  }, [all, query, limit])

  return {
    assets,
    loading: catalog.isLoading,
    error: catalog.error instanceof Error ? catalog.error.message : null,
    total: all.length,
  }
}

function rank(symbol: string, term: string): number {
  const s = symbol.toLowerCase()
  if (s === term) return 0
  if (s.startsWith(term)) return 1
  return 2
}
