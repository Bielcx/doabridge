'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useSettings } from '@/app/settings-provider'
import FlowRibbons from '@/components/vendor/flow-ribbons'
import { BACKGROUND_META } from '@/lib/background'
import { resolveTheme } from '@/lib/theme'

/**
 * Fundo animado, escolhido nas configuracoes.
 *
 * Os tres fundos pesados entram por `dynamic` com `ssr: false`. Nao e cerimonia:
 * o Liquid Ether puxa o three.js inteiro e o Gradient Waves puxa o ogl. Importar
 * os dois de forma estatica colocaria as duas bibliotecas no primeiro carregamento
 * de todo mundo, inclusive de quem nunca sai do fundo padrao. Assim so baixa quem
 * escolheu. `ssr: false` porque os tres tocam WebGL/canvas direto, que nao existe
 * no servidor.
 *
 * As fitas continuam estaticas: sao 400 linhas sem dependencia externa, e sao o
 * padrao, entao adiar o carregamento delas so acrescentaria um piscar.
 *
 * Todos ficam atras de tudo e nao capturam clique. Uma camada com
 * `pointer-events: none` nao recebe evento nenhum, entao cada componente precisa
 * escutar o ponteiro na JANELA, e nao no proprio container — senao a interacao com
 * o mouse simplesmente nunca dispara. O Liquid Ether ja faz isso de origem; nos
 * outros tres foi alteracao local, marcada no cabecalho de cada arquivo vendorizado.
 */

const GradientWaves = dynamic(() => import('@/components/vendor/gradient-waves'), {
  ssr: false,
})
const LiquidEther = dynamic(() => import('@/components/vendor/liquid-ether'), { ssr: false })
const AsciiRadar = dynamic(() => import('@/components/vendor/ascii-radar'), { ssr: false })

/** Azul e verde da marca — as duas pontas do gradiente do logo. */
const BRAND = ['#3b5bff', '#1700ff', '#00e59a'] as const

export function AppBackground() {
  const { theme, background } = useSettings()
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

  if (!animate || background === 'none') return null

  const ink = dark ? '#ffffff' : '#1c1917'
  const opacity = BACKGROUND_META[background].opacity[dark ? 'dark' : 'light']

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10" style={{ opacity }}>
      {background === 'ribbons' && (
        // Monocromatico de proposito: o card e o conteudo carregam a cor, o fundo
        // so da textura. A cor inverte com o tema — branco sobre fundo claro seria
        // invisivel.
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
          pointerSource="window"
        />
      )}

      {background === 'waves' && (
        // As cores sao as mesmas nos dois temas, de proposito. O shader deixa o
        // horizonte transparente (`alpha = t * uOpacity`, t cai com a distancia),
        // entao quem pinta a tela e o par waveColor -> crestColor. Aproximar
        // qualquer um dos dois do fundo da pagina — branco no tema claro, azul
        // escuro no escuro — e exatamente o que fazia a onda sumir. Azul e verde
        // da marca tem contraste contra os dois fundos.
        <GradientWaves
          horizonColor={BRAND[1]}
          waveColor={BRAND[1]}
          crestColor={BRAND[2]}
          amplitude={2.2}
          speed={0.6}
          brightness={dark ? 1.15 : 1}
          mouseInteraction
          pointerSource="window"
        />
      )}

      {background === 'ether' && (
        <LiquidEther
          colors={[...BRAND]}
          mouseForce={18}
          cursorSize={110}
          resolution={0.4}
          autoDemo
          autoSpeed={0.4}
          lightMode={!dark}
        />
      )}

      {background === 'radar' && (
        // `background: transparent` no lugar do preto do preset: o preto do preset
        // pintaria a pagina inteira e apagaria o tema claro.
        <AsciiRadar
          background="transparent"
          glyphColor={dark ? '#00e59a' : '#0052ff'}
          ringColor={dark ? '#3b5bff' : '#1700ff'}
          glyphSize={70}
          density={52}
          pointerSource="window"
        />
      )}
    </div>
  )
}
