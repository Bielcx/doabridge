import type { Address } from '@solana/kit'
import { BaseRelayer, Bridge } from '@/lib/base-bridge'
import { RELAY_GAS_LIMIT } from './constants'
import type { NetworkConfig } from './networks'
import { bridgePda, relayerCfgPda } from './pda'
import { rpc } from './rpc'

/**
 * Leitura do estado on-chain dos DOIS programas envolvidos numa transferencia
 * Solana -> Base: o bridge e o relayer.
 *
 * Precisa dos dois porque o custo real do usuario tambem sai dos dois, e porque o
 * `gasFeeReceiver` de cada um e uma conta diferente.
 */

export type BridgeFees = {
  /** Taxa do programa de bridge. */
  bridgeLamports: bigint
  /** Taxa paga ao relayer pra executar o lado da Base. Costuma ser a maior. */
  relayLamports: bigint
  /** O que o usuario paga de fato, alem do valor transferido. */
  totalLamports: bigint
}

export type BridgeState = {
  address: Address
  /** Conta que recebe a taxa do bridge. */
  gasFeeReceiver: Address
  /** Parada de emergencia. Se true, nao adianta assinar nada. */
  paused: boolean
  nonce: bigint
  /** Ultimo bloco da Base que a Solana conhece. Serve de relogio pro lado inverso. */
  baseBlockNumber: bigint

  /** Config do relayer, necessaria pra montar o pay_for_relay. */
  relayer: {
    cfg: Address
    gasFeeReceiver: Address
    /**
     * Teto de gas efetivamente usado, ja preso dentro dos limites que o programa
     * aceita. O programa rejeita fora da faixa, entao vale conferir aqui em vez de
     * descobrir com transacao revertida.
     */
    gasLimit: bigint
  }

  fees: BridgeFees
}

/**
 * Formula dos dois programas:
 *   custo = gas * base_fee * gas_cost_scaler / gas_cost_scaler_dp
 * onde `gas` e o `gas_per_call` do bridge e o `gas_limit` do relayer.
 *
 * ATENCAO: os programas chamam `refresh_base_fee()` antes de cobrar — um decaimento
 * estilo EIP-1559 que reduz a taxa conforme janelas ociosas passam. Usamos o
 * `currentBaseFee` como esta gravado, entao isto e ESTIMATIVA. Na pratica bateu
 * exato nos testes, e o erro tende a ser pra cima, que e a direcao segura.
 */
function gasCost(
  gas: bigint,
  baseFee: bigint,
  scaler: bigint,
  scalerDp: bigint,
): bigint {
  if (scalerDp === 0n) return 0n
  return (gas * baseFee * scaler) / scalerDp
}

function clamp(value: bigint, min: bigint, max: bigint): bigint {
  if (value < min) return min
  if (value > max) return max
  return value
}

/**
 * Retorna null quando alguma das contas nao existe. Em devnet o time da Base pode
 * refazer o deploy, e nesse caso o endereco derivado aponta pra nada.
 */
export async function fetchBridgeState(
  network: NetworkConfig,
): Promise<BridgeState | null> {
  const [bridgeAddress, cfgAddress] = await Promise.all([
    bridgePda(network),
    relayerCfgPda(network),
  ])

  const [bridgeAccount, cfgAccount] = await Promise.all([
    Bridge.fetchMaybeBridge(
      rpc(network) as Parameters<typeof Bridge.fetchMaybeBridge>[0],
      bridgeAddress,
    ),
    BaseRelayer.fetchMaybeCfg(
      rpc(network) as Parameters<typeof BaseRelayer.fetchMaybeCfg>[0],
      cfgAddress,
    ),
  ])

  if (!bridgeAccount.exists || !cfgAccount.exists) return null

  const bridge = bridgeAccount.data
  const cfg = cfgAccount.data

  const bridgeLamports = gasCost(
    bridge.gasConfig.gasPerCall,
    bridge.eip1559.currentBaseFee,
    bridge.gasConfig.gasCostScaler,
    bridge.gasConfig.gasCostScalerDp,
  )

  const gasLimit = clamp(
    RELAY_GAS_LIMIT,
    cfg.gasConfig.minGasLimitPerMessage,
    cfg.gasConfig.maxGasLimitPerMessage,
  )

  const relayLamports = gasCost(
    gasLimit,
    cfg.eip1559.currentBaseFee,
    cfg.gasConfig.gasCostScaler,
    cfg.gasConfig.gasCostScalerDp,
  )

  return {
    address: bridgeAddress,
    gasFeeReceiver: bridge.gasConfig.gasFeeReceiver,
    paused: bridge.paused,
    nonce: bridge.nonce,
    baseBlockNumber: bridge.baseBlockNumber,
    relayer: {
      cfg: cfgAddress,
      gasFeeReceiver: cfg.gasConfig.gasFeeReceiver,
      gasLimit,
    },
    fees: {
      bridgeLamports,
      relayLamports,
      totalLamports: bridgeLamports + relayLamports,
    },
  }
}

