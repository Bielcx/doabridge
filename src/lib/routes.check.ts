/**
 * Autoteste de `engineFor`. Rode com `npm run check`.
 *
 * Esta e a funcao que decide POR ONDE o dinheiro sai. Errar aqui manda o usuario
 * pro motor errado — no melhor caso a cotacao falha, no pior ele assina um caminho
 * que nao entrega o ativo prometido. Vale um teste, mesmo sem framework de teste no
 * projeto.
 */
import assert from 'node:assert/strict'
import {
  assetId,
  engineFor,
  isWrappedSolOnBase,
  NATIVE_EVM,
  NATIVE_SOL,
  type Asset,
} from './routes.ts'

const SOL_ERC20 = '0x311935Cd80B76769bF2ecC9D8Ab7635b2139cf82' as const
const opts = { solErc20: SOL_ERC20 }

const asset = (chain: Asset['chain'], address: string, extra: Partial<Asset> = {}): Asset => ({
  id: assetId(chain, address),
  chain,
  address,
  symbol: 'X',
  name: 'X',
  decimals: 18,
  ...extra,
})

const solNative = asset('solana', NATIVE_SOL, { decimals: 9 })
const solOnBase = asset('base', SOL_ERC20, { decimals: 9 })
const ethMainnet = asset('ethereum', NATIVE_EVM)
const ethBase = asset('base', NATIVE_EVM)
const usdcBase = asset('base', '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', { decimals: 6 })

// O par exato do bridge canonico ganha o motor canonico.
assert.deepEqual(engineFor(solNative, solOnBase, opts), { available: true, engine: 'canonical' })

// Maiusculas no endereco nao podem mudar a decisao — o LI.FI devolve com checksum,
// a config guarda com checksum, e comparar cru daria falso negativo.
assert.ok(isWrappedSolOnBase(asset('base', SOL_ERC20.toLowerCase()), SOL_ERC20))

// Solana pra qualquer outro ativo na Base vai pelo agregador, nao pelo canonico.
assert.deepEqual(engineFor(solNative, usdcBase, opts), { available: true, engine: 'lifi' })

// Base -> Solana existe. Era "em breve" ate o LI.FI cobrir o sentido.
assert.deepEqual(engineFor(ethBase, solNative, opts), { available: true, engine: 'lifi' })

// EVM <-> EVM segue no agregador.
assert.deepEqual(engineFor(ethMainnet, ethBase, opts), { available: true, engine: 'lifi' })

// Mesmo ativo dos dois lados nao e bridge.
assert.equal(engineFor(ethBase, ethBase, opts).available, false)

// Em testnet o LI.FI nao opera: so o par canonico passa.
assert.deepEqual(engineFor(solNative, solOnBase, { ...opts, testnets: true }), {
  available: true,
  engine: 'canonical',
})
assert.equal(engineFor(ethMainnet, ethBase, { ...opts, testnets: true }).available, false)
assert.equal(engineFor(solNative, usdcBase, { ...opts, testnets: true }).available, false)

console.log('routes: ok')
