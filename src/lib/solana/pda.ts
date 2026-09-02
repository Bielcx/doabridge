import { getProgramDerivedAddress, type Address } from '@solana/kit'
import { RELAYER_SEEDS, SEEDS } from './constants'
import type { NetworkConfig } from './networks'

/**
 * Derivacao das PDAs dos programas de bridge e de relayer da Solana.
 *
 * Portado de `scripts/src/internal/sol/bridge.ts` do repositorio base/bridge, porque
 * o cliente vendorizado nao exporta nem os seeds nem estes helpers.
 *
 * A rede entra por parametro em vez de sair de uma constante de modulo: o usuario
 * alterna entre devnet e mainnet em tempo de execucao, e cada rede tem seus proprios
 * program ids — logo, PDAs diferentes.
 *
 * Verificado na mainnet em 02/09/2026 via Solscan:
 * - bridge   -> DMtzswCcRcsMmJasgHTNZcBHZvdBkrBe248CBdEXxpJm (owner: Base Mainnet Bridge)
 * - solVault -> 6a8ASXNsMqYb2RXvAYwJU9jU4ACPSrFAeNMQkXuudXnh (~219.862 SOL travados)
 */

const utf8 = (value: string) => new TextEncoder().encode(value)

/** Conta de estado do bridge: nonce e parametros de taxa. */
export async function bridgePda(network: NetworkConfig): Promise<Address> {
  const [pda] = await getProgramDerivedAddress({
    programAddress: network.solana.bridgeProgram,
    seeds: [utf8(SEEDS.bridge)],
  })
  return pda
}

/** Cofre que trava o SOL nativo enquanto ele existe como ERC-20 na Base. */
export async function solVaultPda(network: NetworkConfig): Promise<Address> {
  const [pda] = await getProgramDerivedAddress({
    programAddress: network.solana.bridgeProgram,
    seeds: [utf8(SEEDS.solVault)],
  })
  return pda
}

/**
 * Conta criada a cada transferencia, guardando os detalhes da mensagem.
 *
 * O salt e aleatorio por transferencia: e ele que torna o endereco unico. Guarde o
 * salt junto da transferencia se precisar redescobrir a conta depois.
 */
export async function outgoingMessagePda(
  network: NetworkConfig,
  salt: Uint8Array = crypto.getRandomValues(new Uint8Array(32)),
): Promise<{ salt: Uint8Array; pda: Address }> {
  const [pda] = await getProgramDerivedAddress({
    programAddress: network.solana.bridgeProgram,
    seeds: [utf8(SEEDS.outgoingMessage), salt],
  })
  return { salt, pda }
}

/** Cofre por token SPL, derivado tambem do mint e do endereco do token na Base. */
export async function tokenVaultPda(
  network: NetworkConfig,
  mint: Address,
  remoteToken: Uint8Array,
): Promise<Address> {
  const [pda] = await getProgramDerivedAddress({
    programAddress: network.solana.bridgeProgram,
    seeds: [utf8(SEEDS.tokenVault), mint, remoteToken],
  })
  return pda
}

/** Conta de configuracao do Base Relayer. */
export async function relayerCfgPda(network: NetworkConfig): Promise<Address> {
  const [pda] = await getProgramDerivedAddress({
    programAddress: network.solana.baseRelayerProgram,
    seeds: [utf8(RELAYER_SEEDS.cfg)],
  })
  return pda
}

/**
 * Conta "message to relay", criada a cada pedido de relay. Como a outgoingMessage,
 * usa um salt aleatorio pra ser unica por transferencia.
 */
export async function messageToRelayPda(
  network: NetworkConfig,
  salt: Uint8Array = crypto.getRandomValues(new Uint8Array(32)),
): Promise<{ salt: Uint8Array; pda: Address }> {
  const [pda] = await getProgramDerivedAddress({
    programAddress: network.solana.baseRelayerProgram,
    seeds: [utf8(RELAYER_SEEDS.messageToRelay), salt],
  })
  return { salt, pda }
}
