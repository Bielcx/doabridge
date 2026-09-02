import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { cookieToInitialState } from 'wagmi'
import { wagmiConfig } from '@/lib/wagmi'
import { Providers } from './providers'
import { THEME_INIT_SCRIPT } from '@/lib/theme'
import './globals.css'

export const metadata: Metadata = {
  title: 'Do A Bridge',
  description: 'Bridge assets between Ethereum and Base.',
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Reidrata o estado da carteira no servidor para evitar o flash de "desconectado"
  // no primeiro paint. Depende do storage por cookie configurado em lib/wagmi.ts.
  const initialState = cookieToInitialState(wagmiConfig, (await headers()).get('cookie'))

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Antes da primeira pintura, pra nao existir flash de tema errado. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased">
        <Providers initialState={initialState}>{children}</Providers>
      </body>
    </html>
  )
}
