import { useState } from 'react'
import {
  Map, Award, Bell, Database, BrainCircuit,
  ChevronLeft, ChevronRight, BarChart3, ExternalLink
} from 'lucide-react'
import { useDashboard } from '../context/DashboardContext'
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
      { id: 'etl',     label: 'Historial ETL',  icon: Database,     description: 'Pipelines de datos' },
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

  const [hovered, setHovered]       = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleCollapsed = () => setSidebarCollapsed(c => !c)
  const sidebarW = collapsed ? 68 : 244

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
        style={{ width: sidebarW }}
      >
        <div className="sidebar-inner">
          <div className="sidebar-header-toggle">
            {!collapsed && <span className="sidebar-menu-title">Navegación</span>}
            <button className="sidebar-collapse-btn" onClick={toggleCollapsed} title={collapsed ? 'Expandir menú' : 'Colapsar menú'}>
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          {!collapsed && (
            <div className="sidebar-peru-seal">
              <PeruFlag width={26} height={18} />
              <span className="sidebar-peru-seal-text">Gobierno del Perú</span>
            </div>
          )}

          <nav className="sidebar-nav">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="sidebar-section">
                {!collapsed && <p className="sidebar-section-title">{section.title}</p>}
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
                      title={collapsed ? item.label : undefined}
                    >
                      <span className={`sidebar-nav-icon-wrap ${isActive ? 'sidebar-nav-icon-active' : ''}`}>
                        <Icon size={16} />
                      </span>

                      {!collapsed && (
                        <span className="sidebar-nav-label-group">
                          <span className="sidebar-nav-label">{item.label}</span>
                          {hovered === item.id && !isActive && (
                            <span className="sidebar-nav-desc">{item.description}</span>
                          )}
                        </span>
                      )}

                      {!collapsed && badgeCount > 0 && <span className="sidebar-badge">{badgeCount}</span>}
                      {collapsed && badgeCount > 0 && <span className="sidebar-badge-dot" />}
                      {isActive && <span className="sidebar-active-bar" />}
                    </button>
                  )
                })}
              </div>
            ))}

            <div className="sidebar-section sidebar-section-links">
              {!collapsed && <p className="sidebar-section-title">Recursos</p>}
              {QUICK_LINKS.map((link) => {
                const Icon = link.icon
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sidebar-nav-btn sidebar-nav-btn-link"
                    title={collapsed ? link.label : undefined}
                  >
                    <span className="sidebar-nav-icon-wrap"><Icon size={14} /></span>
                    {!collapsed && (
                      <span className="sidebar-nav-label-group">
                        <span className="sidebar-nav-label">{link.label}</span>
                      </span>
                    )}
                    {!collapsed && <ExternalLink size={10} className="sidebar-ext-icon" />}
                  </a>
                )
              })}
            </div>
          </nav>

          {!collapsed && (
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
