'use client'

import { useAccountModal, useConnectModal } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { ConnectAction, shortenAddress, WalletSlot } from '@/components/WalletSlot'

/**
 * FRONTEIRA DE ISOLAMENTO — lado EVM.
 *
 * Usa os hooks de modal do RainbowKit em vez do <ConnectButton> pronto: assim a
 * gente controla onde o gatilho aparece e como ele se parece, mas mantem os modais
 * deles, que resolvem troca de rede, ENS e a lista de carteiras.
 */
export function EvmWalletSlot({ label }: { label: string }) {
  const { address, isConnected } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { openAccountModal } = useAccountModal()

  return (
    <WalletSlot
      label={label}
      connected={isConnected && Boolean(address)}
      address={address ? shortenAddress(address) : null}
      onDisconnect={openAccountModal}
      action={
        <ConnectAction onClick={() => openConnectModal?.()}>
          Connect wallet
        </ConnectAction>
      }
    />
  )
}
