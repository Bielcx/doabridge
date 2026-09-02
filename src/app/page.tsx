import { AppBackground } from '@/components/AppBackground'
import { AppHeader } from '@/components/AppHeader'
import { BridgeForm } from '@/components/BridgeForm'
import { SolanaBridgeStatus } from '@/components/SolanaBridgeStatus'

export default function Home() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
      <AppBackground />
      <AppHeader />
      <div className="flex flex-1 flex-col items-center gap-3">
        <BridgeForm />
        <SolanaBridgeStatus />
      </div>
    </main>
  )
}
