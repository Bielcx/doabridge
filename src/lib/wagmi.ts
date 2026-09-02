import { cookieStorage, createConfig, createStorage, http } from 'wagmi'
import { base, mainnet } from 'wagmi/chains'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

/**
 * FRONTEIRA DE ISOLAMENTO — parte 1 de 2.
 *
 * Este arquivo e o `app/providers.tsx` sao os unicos lugares que sabem QUAL kit de
 * carteira o app usa. Todo o resto do codigo fala com o wagmi direto (useAccount,
 * useBalance, useWriteContract). Isso e proposital: quando a v2 trouxer Solana e a
 * gente reavaliar RainbowKit vs Reown AppKit vs wallet-adapter em paralelo, a troca
 * toca estes dois arquivos mais o botao de conectar, e nada mais.
 *
 * Regra: nunca importe nada de '@rainbow-me/rainbowkit' fora desses tres arquivos.
 */

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID

export const chains = [mainnet, base] as const

export const wagmiConfig = createConfig({
  chains,
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Do A Bridge' }),
    // WalletConnect so entra se houver projectId configurado, para que o app rode
    // sem depender de conta em servico externo no dia 1.
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_RPC_MAINNET || undefined),
    [base.id]: http(process.env.NEXT_PUBLIC_RPC_BASE || undefined),
  },
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
})

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
