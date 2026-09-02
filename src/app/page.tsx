import { BridgeForm } from '@/components/BridgeForm'
import { ConnectSolanaWallet } from '@/components/ConnectSolanaWallet'
import { ConnectWallet } from '@/components/ConnectWallet'

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
      <header className="mb-16 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Do A Bridge</h1>
          <p className="text-sm text-neutral-500">Ethereum and Base, both ways.</p>
        </div>
        <div className="flex items-center gap-2">
          <ConnectSolanaWallet />
          <ConnectWallet />
        </div>
      </header>

      <div className="flex flex-1 items-start justify-center">
        <BridgeForm />
      </div>
    </main>
  )
}
