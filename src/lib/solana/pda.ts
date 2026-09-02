import { getProgramDerivedAddress, type Address } from '@solana/kit'
import { SEEDS } from './constants'
import { network } from './networks'

/**
 * Derivacao das PDAs do programa de bridge da Solana.
 *
 * Portado de `scripts/src/internal/sol/bridge.ts` do repositorio base/bridge, porque
 * o cliente vendorizado nao exporta nem os seeds nem estes helpers.
 *
 * Verificado na mainnet em 02/09/2026 via Solscan:
 * - bridge   -> DMtzswCcRcsMmJasgHTNZcBHZvdBkrBe248CBdEXxpJm (owner: Base Mainnet Bridge)
 * - solVault -> 6a8ASXNsMqYb2RXvAYwJU9jU4ACPSrFAeNMQkXuudXnh (~219.862 SOL travados)
 */

const utf8 = (value: string) => new TextEncoder().encode(value)

/** Conta de estado do bridge: nonce e parametros de taxa. */
export async function bridgePda(
  program: Address = network.solana.bridgeProgram,
): Promise<Address> {
  const [pda] = await getProgramDerivedAddress({
    programAddress: program,
    seeds: [utf8(SEEDS.bridge)],
  })
  return pda
}

/** Cofre que trava o SOL nativo enquanto ele existe como ERC-20 na Base. */
export async function solVaultPda(
  program: Address = network.solana.bridgeProgram,
): Promise<Address> {
  const [pda] = await getProgramDerivedAddress({
    programAddress: program,
    seeds: [utf8(SEEDS.solVault)],
  })
  return pda
}

/**
 * Conta criada a cada transferencia, guardando os detalhes da mensagem.
 *
 * O salt e aleatorio por transferencia: e ele que torna o endereco unico. Guarde o
 * salt junto com a transferencia se precisar redescobrir a conta depois.
 */
export async function outgoingMessagePda(
  salt: Uint8Array = crypto.getRandomValues(new Uint8Array(32)),
  program: Address = network.solana.bridgeProgram,
): Promise<{ salt: Uint8Array; pda: Address }> {
  const [pda] = await getProgramDerivedAddress({
    programAddress: program,
    seeds: [utf8(SEEDS.outgoingMessage), salt],
  })
  return { salt, pda }
}

/** Cofre por token SPL, derivado tambem do mint e do endereco do token na Base. */
export async function tokenVaultPda(
  mint: Address,
  remoteToken: Uint8Array,
  program: Address = network.solana.bridgeProgram,
): Promise<Address> {
  const [pda] = await getProgramDerivedAddress({
    programAddress: program,
    seeds: [utf8(SEEDS.tokenVault), mint, remoteToken],
  })
  return pda
}
