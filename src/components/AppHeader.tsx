'use client'

import Image from 'next/image'
import { useNetwork } from '@/app/settings-provider'
import { SettingsPanel } from '@/components/SettingsPanel'
import { WalletsIndicator } from '@/components/WalletsIndicator'

export function AppHeader() {
  const network = useNetwork()
  const isTestnet = network.name !== 'mainnet'

  return (
    <header className="mb-14 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {/*
         * A marca substitui o titulo em texto. O `alt` carrega o nome porque a
         * imagem nao tem wordmark — sem ele, leitor de tela e busca nao teriam
         * como saber de que site se trata.
         */}
        <Image
          src="/doabridgelogopng.png"
          alt="Do A Bridge"
          width={1774}
          height={887}
          priority
          className="h-11 w-auto"
        />
        {isTestnet && (
          <span className="rounded-md border border-warn/40 bg-warn-bg px-2 py-0.5 text-xs font-medium text-warn">
            {network.label}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <WalletsIndicator />
        <SettingsPanel />
      </div>
    </header>
  )
}
