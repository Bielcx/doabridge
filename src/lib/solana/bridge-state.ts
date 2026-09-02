import { createSolanaRpc, type Address } from '@solana/kit'
import { Bridge } from '@/lib/base-bridge'
import { bridgePda } from './pda'
import { SOLANA_RPC_URL, network } from './networks'

/**
 * Leitura do estado on-chain da conta Bridge.
 *
 * E a unica peca do fluxo Solana -> Base que nao e constante nem derivavel de seed:
 * quem recebe a taxa de gas, se o bridge esta pausado, e os parametros de preco.
 */

export type BridgeState = {
  address: Address
  /** Conta que recebe a taxa de gas cobrada na Solana. */
  gasFeeReceiver: Address
  /** Parada de emergencia. Se true, nao adianta assinar nada. */
  paused: boolean
  nonce: bigint
  /** Ultimo bloco da Base que a Solana conhece. Serve de relogio pro lado inverso. */
  baseBlockNumber: bigint
  /**
   * Taxa estimada, em lamports.
   *
   * Formula do programa (solana_to_base/instructions/mod.rs):
   *   gas_per_call * base_fee * gas_cost_scaler / gas_cost_scaler_dp
   *
   * ATENCAO: usamos `currentBaseFee` como esta gravado, mas o programa chama
   * `refresh_base_fee()` antes de cobrar — um decaimento estilo EIP-1559 que reduz a
   * taxa conforme janelas ociosas passam. Entao este numero e uma ESTIMATIVA, e o
   * erro tende a ser pra cima (cobramos menos do que mostramos), que e a direcao
   * segura pra mostrar pro usuario. Replicar o decaimento exato e trabalho pra
   * depois, se o numero comecar a divergir de forma incomoda.
   */
  estimatedGasFeeLamports: bigint
}

let rpcClient: ReturnType<typeof createSolanaRpc> | null = null

function rpc() {
  rpcClient ??= createSolanaRpc(SOLANA_RPC_URL)
  return rpcClient
}

/**
 * Retorna null quando a conta nao existe. Isso NAO e um detalhe: em devnet o time da
 * Base pode ter refeito o deploy, e nesse caso o endereco derivado aponta pra nada.
 * Melhor a interface dizer "bridge indisponivel nesta rede" do que estourar um erro
 * de decodificacao incompreensivel.
 */
export async function fetchBridgeState(): Promise<BridgeState | null> {
  const pda = await bridgePda()
  const account = await Bridge.fetchMaybeBridge(
    rpc() as Parameters<typeof Bridge.fetchMaybeBridge>[0],
    pda,
  )

  if (!account.exists) return null

  const { gasConfig, eip1559, paused, nonce, baseBlockNumber } = account.data

  const estimatedGasFeeLamports =
    (gasConfig.gasPerCall * eip1559.currentBaseFee * gasConfig.gasCostScaler) /
    gasConfig.gasCostScalerDp

  return {
    address: pda,
    gasFeeReceiver: gasConfig.gasFeeReceiver,
    paused,
    nonce,
    baseBlockNumber,
    estimatedGasFeeLamports,
  }
}

/** Rotulo da rede ativa, pra mensagem de erro fazer sentido. */
export const activeNetworkLabel = network.label
