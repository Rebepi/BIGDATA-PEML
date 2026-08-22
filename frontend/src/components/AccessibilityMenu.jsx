import { useState, useEffect, useRef } from 'react'
import {
  Eye, Type, Contrast, ZapOff, Link, RotateCcw, X, Check
} from 'lucide-react'

const STORAGE_KEY = 'gasto_accessibility_settings'

const DEFAULT_SETTINGS = {
  fontSize: 'normal',
  highContrast: false,
  reduceMotion: false,
  highlightLinks: false,
}

export function useAccessibility() {
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  useEffect(() => {
    const root = document.documentElement

    root.classList.remove('font-scale-lg', 'font-scale-xl')
    if (settings.fontSize === 'large') root.classList.add('font-scale-lg')
    if (settings.fontSize === 'xlarge') root.classList.add('font-scale-xl')

    if (settings.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    if (settings.reduceMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }

    if (settings.highlightLinks) {
      root.classList.add('highlight-links')
    } else {
      root.classList.remove('highlight-links')
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {}
  }, [settings])

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS)
  }

  return { settings, updateSetting, resetSettings }
}

export default function AccessibilityFloating() {
  const [isOpen, setIsOpen] = useState(false)
  const { settings, updateSetting, resetSettings } = useAccessibility()
  const panelRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEsc)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen])

  return (
    <div ref={panelRef} className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {isOpen && (
        <div
          className="glass-card w-80 sm:w-96 flex flex-col overflow-hidden animate-scale-in"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--border-main)',
            boxShadow: 'var(--shadow-card)',
            maxHeight: 'calc(100vh - 6rem)',
            transformOrigin: 'bottom right',
          }}
        >
          <div className="flex items-center justify-between p-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-sub)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl icon-box-peru flex items-center justify-center flex-shrink-0">
                <Eye size={16} style={{ color: 'var(--peru-red)' }} />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Accesibilidad</h2>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Personaliza la visualización</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg transition-colors flex-shrink-0"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-sub)', color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1 min-h-0 space-y-4">
            <div>
              <label className="text-[11px] font-bold flex items-center gap-2 mb-2" style={{ color: 'var(--text-secondary)' }}>
                <Type size={13} style={{ color: 'var(--peru-red)' }} />
                Tamaño del Texto
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'normal', label: 'Normal', sub: '100%' },
                  { id: 'large', label: 'Grande', sub: '+15%' },
                  { id: 'xlarge', label: 'Muy Grande', sub: '+30%' },
                ].map((opt) => {
                  const isActive = settings.fontSize === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => updateSetting('fontSize', opt.id)}
                      className="p-2.5 rounded-xl text-center transition-all duration-150 flex flex-col items-center justify-center gap-0.5"
                      style={
                        isActive
                          ? {
                              background: 'linear-gradient(135deg, var(--peru-red), var(--peru-red-deep))',
                              color: 'white',
                              boxShadow: '0 2px 10px rgba(200,0,10,0.35)',
                              border: '1px solid rgba(200,0,10,0.5)',
                            }
                          : {
                              background: 'var(--bg-elevated)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-sub)',
                            }
                      }
                    >
                      <span className="text-xs font-bold">{opt.label}</span>
                      <span className="text-[10px] opacity-75">{opt.sub}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              {[
                {
                  id: 'highContrast',
                  icon: Contrast,
                  label: 'Alto Contraste',
                  desc: 'Bordes marcados y colores puros para mayor legibilidad',
                },
                {
                  id: 'reduceMotion',
                  icon: ZapOff,
                  label: 'Reducir Animaciones',
                  desc: 'Desactiva transiciones y efectos de movimiento',
                },
                {
                  id: 'highlightLinks',
                  icon: Link,
                  label: 'Resaltar Enlaces',
                  desc: 'Subraya y remarca elementos interactivos',
                },
              ].map((item) => {
                const Icon = item.icon
                const isActive = settings[item.id]
                return (
                  <button
                    key={item.id}
                    onClick={() => updateSetting(item.id, !isActive)}
                    className="w-full p-3 rounded-xl flex items-center justify-between gap-3 text-left transition-all duration-150"
                    style={{
                      background: isActive ? 'rgba(200,0,10,0.08)' : 'var(--bg-elevated)',
                      border: `1px solid ${isActive ? 'rgba(200,0,10,0.4)' : 'var(--border-sub)'}`,
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: isActive ? 'rgba(200,0,10,0.18)' : 'var(--bg-overlay)',
                          color: isActive ? 'var(--peru-red)' : 'var(--text-muted)',
                        }}
                      >
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                        <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                      </div>
                    </div>

                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{
                        background: isActive ? 'var(--peru-red)' : 'var(--bg-overlay)',
                        border: `1px solid ${isActive ? 'var(--peru-red)' : 'var(--border-sub)'}`,
                      }}
                    >
                      {isActive && <Check size={11} className="text-white stroke-[3]" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-3 flex items-center justify-between flex-shrink-0" style={{ borderTop: '1px solid var(--border-sub)', background: 'var(--bg-elevated)' }}>
            <button
              onClick={resetSettings}
              className="btn-ghost text-xs flex items-center gap-1.5"
              style={{ color: 'var(--text-muted)' }}
            >
              <RotateCcw size={12} />
              Restablecer
            </button>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>WCAG 2.1 AA</span>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Menú de Accesibilidad"
        className="p-3 rounded-full shadow-2xl flex items-center justify-center text-white transition-transform hover:scale-110 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, var(--peru-red), var(--peru-red-deep))',
          boxShadow: '0 4px 20px rgba(200,0,10,0.4)',
        }}
      >
        <Eye size={20} />
      </button>
    </div>
  )
}
