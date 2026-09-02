import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { cookieToInitialState } from 'wagmi'
import { wagmiConfig } from '@/lib/wagmi'
import { Providers } from './providers'
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
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        <Providers initialState={initialState}>{children}</Providers>
      </body>
    </html>
  )
}
