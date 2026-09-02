'use client'

import '@rainbow-me/rainbowkit/styles.css'

import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { WagmiProvider, type State } from 'wagmi'
import { wagmiConfig } from '@/lib/wagmi'
import { resolveTheme } from '@/lib/theme'
import { SettingsProvider, useSettings } from './settings-provider'
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
    <SettingsProvider>
      <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitThemed>
          <SolanaProviders>{children}</SolanaProviders>
        </RainbowKitThemed>
      </QueryClientProvider>
      </WagmiProvider>
    </SettingsProvider>
  )
}

/**
 * O modal do RainbowKit tem tema proprio e nao herda o CSS do app. Sem isto, trocar
 * pra claro deixaria um modal escuro no meio de uma pagina clara.
 */
function RainbowKitThemed({ children }: { children: ReactNode }) {
  const { theme } = useSettings()
  const [resolved, setResolved] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    const apply = () => setResolved(resolveTheme(theme))
    apply()
    if (theme !== 'system') return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [theme])

  const options = { accentColor: '#0052ff', borderRadius: 'large' } as const

  return (
    <RainbowKitProvider
      theme={resolved === 'dark' ? darkTheme(options) : lightTheme(options)}
    >
      {children}
    </RainbowKitProvider>
  )
}
