'use client'

import { useEffect, useState } from 'react'
import { useSettings } from '@/app/settings-provider'
import FlowRibbons from '@/components/vendor/flow-ribbons'
import { resolveTheme } from '@/lib/theme'

/**
 * Fundo animado.
 *
 * Monocromatico de proposito: o card e o conteudo carregam a cor, o fundo so
 * da textura. Fita colorida atras de um formulario de dinheiro disputa atencao
 * com os numeros, que e onde o olho precisa estar.
 *
 * A cor inverte com o tema. Branco sobre o fundo claro seria invisivel, entao
 * o tema claro usa tinta escura — mesma ideia, contraste ao contrario.
 *
 * Fica atras de tudo e nao captura clique. Consequencia: a interacao com o
 * cursor so acontece nas areas vazias da pagina, nao em cima do card. Aceitavel
 * — um fundo que rouba clique do formulario seria um bug, nao um efeito.
 */
export function AppBackground() {
  const { theme } = useSettings()
  const [animate, setAnimate] = useState(false)
  const [dark, setDark] = useState(true)

  useEffect(() => {
    // Quem pediu menos movimento no sistema operacional recebe o fundo estatico.
    // Animacao de tela cheia e um dos gatilhos classicos de enjoo em quem tem
    // sensibilidade vestibular, e o custo de respeitar isso e uma linha.
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setAnimate(!motion.matches)
    apply()
    motion.addEventListener('change', apply)
    return () => motion.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const apply = () => setDark(resolveTheme(theme) === 'dark')
    apply()
    if (theme !== 'system') return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [theme])

  if (!animate) return null

  const ink = dark ? '#ffffff' : '#1c1917'

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ opacity: dark ? 0.22 : 0.12 }}
    >
      <FlowRibbons
        colorA={ink}
        colorB={ink}
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
