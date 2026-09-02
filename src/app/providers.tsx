'use client'

import '@rainbow-me/rainbowkit/styles.css'

import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { WagmiProvider, type State } from 'wagmi'
import { wagmiConfig } from '@/lib/wagmi'
import { SolanaProviders } from './solana-providers'

/**
 * FRONTEIRA DE ISOLAMENTO — parte 2 de 2. Ver o comentario em lib/wagmi.ts.
 * Este e o unico provider do RainbowKit no app inteiro.
 */
export function Providers({
  children,
  initialState,
}: {
  children: ReactNode
  initialState?: State
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { refetchOnWindowFocus: false } },
      }),
  )

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({ accentColor: '#0052ff', borderRadius: 'large' })}
        >
          <SolanaProviders>{children}</SolanaProviders>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
