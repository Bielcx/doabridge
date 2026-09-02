import { address } from '@solana/kit'

/**
 * Constantes do bridge que NAO mudam entre redes.
 *
 * Enderecos de programa e de contrato ficam em ./networks.ts, porque variam
 * entre devnet e mainnet. O que esta aqui e igual nas duas.
 *
 * Os seeds sao EXTRAIDOS PROGRAMATICAMENTE do idl.json do repositorio base/bridge
 * (commit cf64f80), nao digitados a mao — transcrever nove seeds e onde entra o
 * erro de um caractere que custa horas de debug. O cliente vendorizado em
 * lib/base-bridge nao exporta nenhum deles; la eles so aparecem em comentarios.
 */

export const SYSTEM_PROGRAM = address('11111111111111111111111111111111')

/** NATIVE_SOL_PUBKEY, do IDL. */
export const NATIVE_SOL_PUBKEY = address('SoL1111111111111111111111111111111111111111')

/** Seeds das PDAs do programa de bridge. */
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

/**
 * Seeds do programa Base Relayer, extraidos do idl.json de base_relayer.
 * Sao de um programa diferente do bridge, por isso ficam separados.
 */
export const RELAYER_SEEDS = {
  /** CFG_SEED */
  cfg: 'config',
  /** MTR_SEED — "message to relay" */
  messageToRelay: 'mtr',
} as const

/** Teto de gas na Base pra execucao da mensagem. Mesmo valor dos scripts oficiais. */
export const RELAY_GAS_LIMIT = 2_000_000n
