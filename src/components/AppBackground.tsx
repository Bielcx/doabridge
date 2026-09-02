'use client'

import { useEffect, useState } from 'react'
import FlowRibbons from '@/components/vendor/flow-ribbons'

/**
 * Fundo animado.
 *
 * As cores nao sao decorativas: roxo da Solana e azul da Base, as duas pontas
 * que o app conecta. As fitas correm de uma cor a outra, que e literalmente o
 * que o produto faz.
 *
 * Fica atras de tudo e nao captura clique. Consequencia: a interacao com o
 * cursor so acontece nas areas vazias da pagina, nao em cima do card. Aceitavel
 * — um fundo que rouba clique do formulario seria um bug, nao um efeito.
 */
export function AppBackground() {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    // Quem pediu menos movimento no sistema operacional recebe o fundo estatico.
    // Animacao de tela cheia e um dos gatilhos classicos de enjoo em quem tem
    // sensibilidade vestibular, e o custo de respeitar isso e uma linha.
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setAnimate(!query.matches)
    apply()
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [])

  if (!animate) return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 opacity-40 dark:opacity-100"
    >
      <FlowRibbons
        colorA="#9945ff"
        colorB="#0052ff"
        count={18}
        scale={14}
        size={5}
        trail={20}
        speed={100}
        strength={13}
        followPointer
      />
    </div>
  )
}
