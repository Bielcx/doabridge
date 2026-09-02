'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'

/**
 * Terceiro e ultimo arquivo autorizado a importar do RainbowKit.
 * Se um dia trocarmos de kit, este componente e reescrito e o resto do app nem sabe.
 */
export function ConnectWallet() {
  return <ConnectButton showBalance={false} chainStatus="icon" />
}
