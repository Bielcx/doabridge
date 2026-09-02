import {
  appendTransactionMessageInstruction,
  createTransactionMessage,
  getBase58Decoder,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signAndSendTransactionMessageWithSigners,
  type TransactionSendingSigner,
} from '@solana/kit'
import { hexToBytes } from 'viem'
import { Bridge } from '@/lib/base-bridge'
import type { BridgeState } from './bridge-state'
import { SYSTEM_PROGRAM } from './constants'
import { network } from './networks'
import { outgoingMessagePda, solVaultPda } from './pda'
import { rpc } from './rpc'

/**
 * Transferencia de SOL nativo da Solana para a Base, pelo bridge canonico.
 *
 * Esta e a direcao facil das duas: uma assinatura, o Base Relayer executa o outro
 * lado sozinho, ~15 segundos. A direcao inversa (Base -> Solana) exige espera de
 * ~15 minutos mais duas assinaturas de prova, e nao esta implementada.
 *
 * O SOL fica travado no vault da Solana e nasce como ERC-20 na Base — lock & mint
 * canonico, nao pool de liquidez de terceiro. Nao existe spread de market maker
 * aqui; o custo e a taxa de gas do proprio bridge.
 */

export type SendBridgeSolParams = {
  /** Signer da carteira Solana do usuario. Paga a taxa e autoriza a saida do SOL. */
  signer: TransactionSendingSigner
  /** Quantia em lamports. */
  amountLamports: bigint
  /** Endereco EVM que recebe na Base. */
  recipient: `0x${string}`
  /** Estado lido da chain — e dele que sai o gasFeeReceiver. */
  bridgeState: BridgeState
}

export type SendBridgeSolResult = {
  signature: string
  explorerUrl: string
}

export async function sendBridgeSol({
  signer,
  amountLamports,
  recipient,
  bridgeState,
}: SendBridgeSolParams): Promise<SendBridgeSolResult> {
  if (bridgeState.paused) {
    throw new Error(`The bridge is paused on ${network.label}.`)
  }

  const [solVault, { salt, pda: outgoingMessage }, { value: latestBlockhash }] =
    await Promise.all([
      solVaultPda(),
      outgoingMessagePda(),
      rpc().getLatestBlockhash().send(),
    ])

  const instruction = Bridge.getBridgeSolInstruction(
    {
      payer: signer,
      from: signer,
      gasFeeReceiver: bridgeState.gasFeeReceiver,
      solVault,
      bridge: bridgeState.address,
      outgoingMessage,
      systemProgram: SYSTEM_PROGRAM,
      outgoingMessageSalt: salt,
      // O destino vai como 20 bytes crus, nao como string hex.
      to: hexToBytes(recipient),
      amount: amountLamports,
      // `call` permite executar um contrato na Base junto da transferencia.
      // Transferencia simples nao usa.
      call: null,
    },
    { programAddress: network.solana.bridgeProgram },
  )

  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(signer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) => appendTransactionMessageInstruction(instruction, m),
  )

  const signatureBytes = await signAndSendTransactionMessageWithSigners(message)
  const signature = getBase58Decoder().decode(signatureBytes)

  return { signature, explorerUrl: network.solana.explorerTx(signature) }
}
