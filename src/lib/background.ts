/**
 * Fundos disponiveis e como cada um se comporta.
 *
 * O fundo virou preferencia do usuario, entao a lista precisa ser um dado, nao um
 * `switch` espalhado — o seletor das configuracoes e o renderizador leem daqui.
 *
 * Cada fundo carrega sua propria opacidade porque eles nao pesam igual. O de fitas
 * e monocromatico e some no 0.22; os coloridos, na mesma opacidade, sumiriam de
 * vez, e na opacidade deles as fitas virariam neve. A opacidade do tema claro e
 * sempre menor: sobre branco a mesma cor rende muito mais contraste.
 */

export const BACKGROUNDS = ['ribbons', 'waves', 'ether', 'radar', 'none'] as const

export type Background = (typeof BACKGROUNDS)[number]

export const BACKGROUND_STORAGE_KEY = 'doabridge:background'

export const DEFAULT_BACKGROUND: Background = 'ribbons'

export const BACKGROUND_META: Record<
  Background,
  { label: string; hint: string; opacity: { dark: number; light: number } }
> = {
  ribbons: {
    label: 'Ribbons',
    hint: 'Particles drifting through a noise field.',
    opacity: { dark: 0.22, light: 0.12 },
  },
  waves: {
    label: 'Waves',
    hint: 'A gradient sea that tilts toward the cursor.',
    opacity: { dark: 0.8, light: 0.6 },
  },
  ether: {
    label: 'Ether',
    hint: 'Fluid simulation. Push it around with the mouse.',
    opacity: { dark: 0.55, light: 0.4 },
  },
  radar: {
    label: 'Radar',
    hint: 'Crypto glyphs. Click to send a ping.',
    opacity: { dark: 0.55, light: 0.35 },
  },
  none: {
    label: 'None',
    hint: 'Plain background, no animation.',
    opacity: { dark: 0, light: 0 },
  },
}

export function isBackground(value: string): value is Background {
  return (BACKGROUNDS as readonly string[]).includes(value)
}
