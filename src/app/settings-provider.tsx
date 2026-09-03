'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  BACKGROUND_STORAGE_KEY,
  DEFAULT_BACKGROUND,
  isBackground,
  type Background,
} from '@/lib/background'
import { NETWORKS, DEFAULT_TESTNETS, type NetworkConfig } from '@/lib/solana/networks'
import { isTheme, resolveTheme, THEME_STORAGE_KEY, type Theme } from '@/lib/theme'

const TESTNETS_STORAGE_KEY = 'doabridge:testnets'

type SettingsValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  /** Qual fundo animado esta ligado. */
  background: Background
  setBackground: (background: Background) => void
  /** Quando ligado, o app opera em devnet e Base Sepolia. */
  testnets: boolean
  setTestnets: (enabled: boolean) => void
  /** Rede resolvida. Tudo que fala com a chain deve sair daqui. */
  network: NetworkConfig
}

const SettingsContext = createContext<SettingsValue | null>(null)

function read<T>(key: string, parse: (raw: string) => T | null, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed = parse(raw)
    return parsed === null ? fallback : parsed
  } catch {
    return fallback
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // aba anonima ou storage bloqueado: a sessao funciona, so nao lembra
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Estado inicial igual nos dois lados pra nao quebrar a hidratacao; o valor
  // guardado entra no efeito abaixo.
  const [theme, setThemeState] = useState<Theme>('system')
  const [background, setBackgroundState] = useState<Background>(DEFAULT_BACKGROUND)
  const [testnets, setTestnetsState] = useState(DEFAULT_TESTNETS)

  useEffect(() => {
    setThemeState(read(THEME_STORAGE_KEY, (r) => (isTheme(r) ? r : null), 'system'))
    setBackgroundState(
      read(BACKGROUND_STORAGE_KEY, (r) => (isBackground(r) ? r : null), DEFAULT_BACKGROUND),
    )
    setTestnetsState(
      read(TESTNETS_STORAGE_KEY, (r) => (r === 'true' ? true : r === 'false' ? false : null), DEFAULT_TESTNETS),
    )
  }, [])

  // Aplica o tema na raiz. O script em theme.ts ja fez isso antes da primeira
  // pintura; aqui e pra refletir mudancas em tempo real.
  useEffect(() => {
    const apply = () =>
      document.documentElement.classList.toggle('dark', resolveTheme(theme) === 'dark')
    apply()
    if (theme !== 'system') return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    write(THEME_STORAGE_KEY, next)
  }, [])

  const setBackground = useCallback((next: Background) => {
    setBackgroundState(next)
    write(BACKGROUND_STORAGE_KEY, next)
  }, [])

  const setTestnets = useCallback((next: boolean) => {
    setTestnetsState(next)
    write(TESTNETS_STORAGE_KEY, String(next))
  }, [])

  const value = useMemo<SettingsValue>(
    () => ({
      theme,
      setTheme,
      background,
      setBackground,
      testnets,
      setTestnets,
      network: testnets ? NETWORKS.devnet : NETWORKS.mainnet,
    }),
    [theme, setTheme, background, setBackground, testnets, setTestnets],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings precisa estar dentro de SettingsProvider')
  return ctx
}

/** Atalho pra quem so precisa saber em que rede esta operando. */
export function useNetwork() {
  return useSettings().network
}
