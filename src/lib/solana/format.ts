export const LAMPORTS_PER_SOL = 1_000_000_000n

/** Lamports para SOL legivel, sem zeros sobrando. */
export function formatSol(lamports: bigint): string {
  const sol = Number(lamports) / Number(LAMPORTS_PER_SOL)
  if (sol === 0) return '0'
  if (sol < 0.000001) return '<0.000001'
  return sol.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
}

/** Texto digitado pelo usuario para lamports. Retorna null se nao for numero valido. */
export function toLamports(value: string): bigint | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!/^\d*\.?\d*$/.test(trimmed)) return null
  const [whole = '0', fraction = ''] = trimmed.split('.')
  const padded = (fraction + '000000000').slice(0, 9)
  try {
    return BigInt(whole || '0') * LAMPORTS_PER_SOL + BigInt(padded || '0')
  } catch {
    return null
  }
}
