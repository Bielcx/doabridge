'use client'

import { useState } from 'react'
import { useSettings } from '@/app/settings-provider'
import { BACKGROUND_META, BACKGROUNDS } from '@/lib/background'
import { THEMES, type Theme } from '@/lib/theme'

const THEME_LABEL: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
}

export function SettingsPanel() {
  const [open, setOpen] = useState(false)
  const { theme, setTheme, background, setBackground, testnets, setTestnets } = useSettings()

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Settings"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-muted transition hover:text-ink"
      >
        <GearIcon />
      </button>

      {open && (
        <>
          {/* Fecha ao clicar fora sem prender foco num overlay opaco. */}
          <button
            type="button"
            aria-label="Close settings"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-line bg-sunken p-4 shadow-2xl">
            <h2 className="mb-4 text-sm font-semibold">Settings</h2>

            <div className="mb-4">
              <p className="mb-2 text-xs text-muted">Theme</p>
              <div className="flex gap-1 rounded-xl border border-line p-1">
                {THEMES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTheme(option)}
                    aria-pressed={theme === option}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-xs transition ${
                      theme === option
                        ? 'bg-accent text-accent-ink'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    {THEME_LABEL[option]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-xs text-muted">Background</p>
              <div className="grid grid-cols-2 gap-1">
                {BACKGROUNDS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setBackground(option)}
                    aria-pressed={background === option}
                    title={BACKGROUND_META[option].hint}
                    className={`rounded-lg border px-2 py-1.5 text-xs transition ${
                      background === option
                        ? 'border-accent bg-accent text-accent-ink'
                        : 'border-line text-muted hover:text-ink'
                    }`}
                  >
                    {BACKGROUND_META[option].label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-faint">{BACKGROUND_META[background].hint}</p>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-ink">Testnets</p>
                <p className="mt-0.5 text-xs text-faint">
                  Solana devnet and Base Sepolia. Nothing here is real money.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={testnets}
                aria-label="Enable testnets"
                onClick={() => setTestnets(!testnets)}
                className={`mt-0.5 h-6 w-11 shrink-0 rounded-full border border-line transition ${
                  testnets ? 'bg-accent' : 'bg-surface'
                }`}
              >
                <span
                  className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                    testnets ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  )
}
