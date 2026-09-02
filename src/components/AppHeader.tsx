'use client'

import { useNetwork } from '@/app/settings-provider'
import { SettingsPanel } from '@/components/SettingsPanel'
import { WalletsIndicator } from '@/components/WalletsIndicator'

export function AppHeader() {
  const network = useNetwork()
  const isTestnet = network.name !== 'mainnet'

  return (
    <header className="mb-14 flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Do A Bridge</h1>
          {isTestnet && (
            <span className="rounded-md border border-warn/40 bg-warn-bg px-2 py-0.5 text-xs font-medium text-warn">
              {network.label}
            </span>
          )}
        </div>
        <p className="text-sm text-muted">Ethereum, Base and Solana.</p>
      </div>

      <div className="flex items-center gap-2">
        <WalletsIndicator />
        <SettingsPanel />
      </div>
    </header>
  )
}
