'use client'

import Image from 'next/image'
import { useNetwork } from '@/app/settings-provider'
import { SettingsPanel } from '@/components/SettingsPanel'
import { WalletsIndicator } from '@/components/WalletsIndicator'

export function AppHeader() {
  const network = useNetwork()
  const isTestnet = network.name !== 'mainnet'

  return (
    <header className="mb-14 flex h-9 items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {/*
         * A marca substitui o titulo em texto. O `alt` carrega o nome porque a
         * imagem nao tem wordmark — sem ele, leitor de tela e busca nao teriam
         * como saber de que site se trata.
         */}
        {/*
         * Altura casada com a dos controles da direita (36px), pra barra ficar
         * numa linha so. Dimensoes em prop e em style: a classe do Tailwind
         * sozinha nao venceu os atributos que o next/image escreve no elemento.
         */}
        <Image
          src="/doabridgelogopng.png"
          alt="Do A Bridge"
          width={72}
          height={36}
          priority
          style={{ height: 36, width: 'auto' }}
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
