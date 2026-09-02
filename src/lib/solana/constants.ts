/**
 * Constantes do bridge nativo Base <-> Solana.
 *
 * Os seeds foram EXTRAIDOS PROGRAMATICAMENTE do idl.json do repositorio
 * base/bridge (commit cf64f80), nao digitados a mao. O cliente vendorizado em
 * lib/base-bridge nao exporta nenhum deles - so aparecem em comentarios la.
 *
 * Enderecos conferidos na mainnet via Solscan em 02/09/2026.
 */

import { address } from '@solana/kit'

/** Programa do bridge na Solana. */
export const SOLANA_BRIDGE_PROGRAM = address(
  'HNCne2FkVaNghhjKXapxJzPaBvAKDG1Ge3gqhZyfVWLM',
)

/** Programa do relayer que paga o gas na Base pelo usuario da Solana. */
export const BASE_RELAYER_PROGRAM = address(
  'g1et5VenhfJHJwsdJsDbxWZuotD5H4iELNG61kS4fb9',
)

export const SYSTEM_PROGRAM = address('11111111111111111111111111111111')

/** Contratos do lado da Base. */
export const BASE_BRIDGE_CONTRACT =
  '0x3eff766C76a1be2Ce1aCF2B69c78bCae257D5188' as const
export const BASE_BRIDGE_VALIDATOR =
  '0xAF24c1c24Ff3BF1e6D882518120fC25442d6794B' as const
export const BASE_CROSS_CHAIN_ERC20_FACTORY =
  '0xDD56781d0509650f8C2981231B6C917f2d5d7dF2' as const
/** SOL representado como ERC-20 na Base. */
export const SOL_ON_BASE =
  '0x311935Cd80B76769bF2ecC9D8Ab7635b2139cf82' as const

/** NATIVE_SOL_PUBKEY do IDL. */
export const NATIVE_SOL_PUBKEY = address('SoL1111111111111111111111111111111111111111')

/** Seeds das PDAs, na ordem em que o programa as declara. */
export const SEEDS = {
  /** BRIDGE_CPI_AUTHORITY_SEED */
  bridgeCpiAuthority: 'bridge_cpi_authority',
  /** BRIDGE_SEED */
  bridge: 'bridge',
  /** INCOMING_MESSAGE_SEED */
  incomingMessage: 'incoming_message',
  /** OUTGOING_MESSAGE_SEED */
  outgoingMessage: 'outgoing_message',
  /** OUTPUT_ROOT_SEED */
  outputRoot: 'output_root',
  /** PARTNER_SIGNERS_ACCOUNT_SEED */
  partnerSignersAccount: 'signers',
  /** SOL_VAULT_SEED */
  solVault: 'sol_vault',
  /** TOKEN_VAULT_SEED */
  tokenVault: 'token_vault',
  /** WRAPPED_TOKEN_SEED */
  wrappedToken: 'wrapped_token',
} as const
