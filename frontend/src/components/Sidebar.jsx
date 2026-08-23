import { useState } from 'react'
import {
  Map, Award, Bell, Database, BrainCircuit,
  ChevronLeft, ChevronRight, BarChart3, ExternalLink,
  Calendar, ArrowLeftRight, Download, Check, X
} from 'lucide-react'
import { useDashboard } from '../context/DashboardContext'
import { exportarGastoCsv } from '../services/api'
import PeruFlag from './PeruFlag'

const NAV_SECTIONS = [
  {
    title: 'Principal',
    items: [
      { id: 'resumen', label: 'Resumen Ejecutivo', icon: BarChart3, description: 'KPIs y gráficos principales' },
      { id: 'mapa',    label: 'Mapa Regional',     icon: Map,        description: 'Visualización geográfica 25 dptos' },
      { id: 'ranking', label: 'Ranking',            icon: Award,      description: 'Clasificación por regiones' },
    ]
  },
  {
    title: 'Análisis',
    items: [
      { id: 'alertas', label: 'Alertas',        icon: Bell,         description: 'Anomalías detectadas',   badge: 'alertas' },
      { id: 'ml',      label: 'Comparativa ML', icon: BrainCircuit, description: 'Modelos de predicción' },
      { id: 'etl',     label: 'Pipeline ETL & Datos', icon: Database, description: 'CSV crudo, limpieza y logs' },
    ]
  }
]

const QUICK_LINKS = [
  { label: 'Portal MEF', href: 'https://datosabiertos.mef.gob.pe/dataset/presupuesto-y-ejecucion-de-gasto', icon: ExternalLink },
]

export default function Sidebar() {
  const dash = useDashboard()
  const tabActiva          = dash?.tabActiva          || 'resumen'
  const setTabActiva       = dash?.setTabActiva       || (() => {})
  const alertCount         = dash?.alertCount         || 0
  const collapsed          = dash?.sidebarCollapsed   || false
  const setSidebarCollapsed = dash?.setSidebarCollapsed || (() => {})
  const mobileOpen         = dash?.sidebarMobileOpen  || false
  const setMobileOpen      = dash?.setSidebarMobileOpen || (() => {})

  const [hovered, setHovered] = useState(null)

  const anios = dash?.anios || [2026, 2025, 2024, 2023, 2022, 2021, 2020]
  const anio = dash?.anio || 2024

  const toggleCollapsed = () => setSidebarCollapsed(c => !c)
  const sidebarW = collapsed ? 68 : 244

  const handleExport = async () => {
    if (!dash || dash.exportando) return
    dash.setExportando(true)
    dash.setExportSuccess(false)
    try {
      await exportarGastoCsv(dash.anio)
      dash.setExportSuccess(true)
      setTimeout(() => dash.setExportSuccess(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      dash.setExportando(false)
    }
  }

  return (
    <>
      <button className="sidebar-mobile-trigger" onClick={() => setMobileOpen(o => !o)} aria-label="Toggle sidebar">
        <BarChart3 size={18} />
      </button>

      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`sidebar-root ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}
        style={{ width: mobileOpen ? undefined : sidebarW }}
      >
        <div className="sidebar-inner">


          <div className="md:hidden px-3 py-2.5 space-y-2.5 mb-2" style={{ borderBottom: '1px solid var(--border-sub)' }}>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                  <Calendar size={11} style={{ color: 'var(--peru-red)' }} />
                  Ejercicio Fiscal
                </span>
                <span className="badge-peru text-[10px] font-mono font-bold">Año {anio}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {anios.map((a) => (
                  <button
                    key={a}
                    onClick={() => dash.setAnio(a)}
                    className="py-1 px-1 rounded-lg text-xs font-mono font-bold transition-all text-center"
                    style={anio === a
                      ? {
                        background: 'linear-gradient(135deg, var(--peru-red), var(--peru-red-deep))',
                        color: 'white',
                        boxShadow: '0 2px 8px rgba(200,0,10,0.35)',
                      }
                      : {
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-sub)',
                      }
                    }
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={() => { dash.setShowComparativa(true); setMobileOpen(false); }}
                className="btn-secondary py-1.5 px-2 text-xs flex items-center justify-center gap-1.5 rounded-xl font-semibold"
              >
                <ArrowLeftRight size={13} style={{ color: 'var(--peru-red)' }} />
                <span>Comparar</span>
              </button>

              <button
                onClick={handleExport}
                disabled={dash.exportando}
                className="btn-secondary py-1.5 px-2 text-xs flex items-center justify-center gap-1.5 rounded-xl font-semibold"
              >
                {dash.exportSuccess ? (
                  <>
                    <Check size={13} style={{ color: 'var(--color-success)' }} />
                    <span style={{ color: 'var(--color-success)' }}>Listo</span>
                  </>
                ) : (
                  <>
                    <Download size={13} style={{ color: 'var(--peru-red)' }} />
                    <span>{dash.exportando ? '...' : 'Exportar'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <nav className="sidebar-nav">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="sidebar-section">
                {(!collapsed || mobileOpen) && <p className="sidebar-section-title">{section.title}</p>}
                {section.items.map((item) => {
                  const Icon       = item.icon
                  const isActive   = tabActiva === item.id
                  const badgeCount = item.badge === 'alertas' ? alertCount : 0

                  return (
                    <button
                      key={item.id}
                      onClick={() => { setTabActiva(item.id); setMobileOpen(false) }}
                      onMouseEnter={() => setHovered(item.id)}
                      onMouseLeave={() => setHovered(null)}
                      className={`sidebar-nav-btn ${isActive ? 'sidebar-nav-btn-active' : ''}`}
                      title={collapsed && !mobileOpen ? item.label : undefined}
                    >
                      <span className={`sidebar-nav-icon-wrap ${isActive ? 'sidebar-nav-icon-active' : ''}`}>
                        <Icon size={16} />
                      </span>

                      {(!collapsed || mobileOpen) && (
                        <span className="sidebar-nav-label-group">
                          <span className="sidebar-nav-label">{item.label}</span>
                          {hovered === item.id && !isActive && (
                            <span className="sidebar-nav-desc">{item.description}</span>
                          )}
                        </span>
                      )}

                      {(!collapsed || mobileOpen) && badgeCount > 0 && <span className="sidebar-badge">{badgeCount}</span>}
                      {collapsed && !mobileOpen && badgeCount > 0 && <span className="sidebar-badge-dot" />}
                      {isActive && <span className="sidebar-active-bar" />}
                    </button>
                  )
                })}
              </div>
            ))}

            <div className="sidebar-section sidebar-section-links">
              {(!collapsed || mobileOpen) && <p className="sidebar-section-title">Recursos</p>}
              {QUICK_LINKS.map((link) => {
                const Icon = link.icon
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sidebar-nav-btn sidebar-nav-btn-link"
                    title={collapsed && !mobileOpen ? link.label : undefined}
                  >
                    <span className="sidebar-nav-icon-wrap"><Icon size={14} /></span>
                    {(!collapsed || mobileOpen) && (
                      <span className="sidebar-nav-label-group">
                        <span className="sidebar-nav-label">{link.label}</span>
                      </span>
                    )}
                    {(!collapsed || mobileOpen) && <ExternalLink size={10} className="sidebar-ext-icon" />}
                  </a>
                )
              })}
            </div>
          </nav>

          {(!collapsed || mobileOpen) && (
            <div style={{
              padding: '0.65rem 0.7rem 0.8rem',
              borderTop: '1px solid var(--border-sub)',
              flexShrink: 0,
            }}>
              <p style={{
                fontSize: '0.58rem', fontWeight: 700,
                color: 'var(--color-gold)',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                textAlign: 'center',
              }}>
                GastoPerú Monitor · v2.0
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
