import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, AlertTriangle, TrendingDown, Info, CheckCircle2, Search, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'

const ICON_MAP = {
  danger: AlertTriangle,
  warning: TrendingDown,
  info: Info,
  success: CheckCircle2,
}

const COLOR_MAP = {
  danger: { bg: 'rgba(200,0,10,0.08)', border: 'rgba(200,0,10,0.28)', icon: 'var(--color-danger)', badge: 'badge-rose', label: 'Crítico' },
  warning: { bg: 'rgba(200,150,45,0.08)', border: 'rgba(200,150,45,0.28)', icon: 'var(--color-gold)', badge: 'badge-amber', label: 'Advertencia' },
  info: { bg: 'rgba(200,0,10,0.05)', border: 'rgba(200,0,10,0.2)', icon: 'var(--peru-red)', badge: 'badge-peru', label: 'Información' },
  success: { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', icon: 'var(--color-success)', badge: 'badge-green', label: 'Normal' },
}

const PER_PAGE = 8

function getRegionName(alerta) {
  if (!alerta) return ''
  if (typeof alerta.region === 'object' && alerta.region !== null) {
    return alerta.region.nombre || ''
  }
  if (typeof alerta.region === 'string') {
    return alerta.region
  }
  return alerta.region_nombre || ''
}

function getRegionId(alerta) {
  if (!alerta) return null
  if (typeof alerta.region === 'object' && alerta.region !== null) {
    return alerta.region.id || null
  }
  return alerta.region_id || null
}

function getSeverity(alerta) {
  if (!alerta) return 'info'
  const tipo = String(alerta.tipo_alerta || alerta.tipo || '').toLowerCase()
  if (tipo.includes('baja') || tipo.includes('critico') || tipo.includes('danger')) return 'danger'
  if (tipo.includes('atipico') || tipo.includes('advertencia') || tipo.includes('warning')) return 'warning'
  const monto = Math.abs(Number(alerta.monto_relacionado || alerta.monto_devengado || 0))
  const region = getRegionName(alerta).toUpperCase()
  if (monto > 50e6 || region.includes('NACIONAL')) return 'danger'
  if (monto > 10e6) return 'warning'
  return 'info'
}

function Paginador({ currentPage, totalPages, onPageChange, totalItems, label = 'alertas' }) {
  if (totalPages <= 1) return null

  const pages = []
  const start = Math.max(1, currentPage - 2)
  const end = Math.min(totalPages, currentPage + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div
      className="flex items-center justify-between px-6 py-3.5"
      style={{ borderTop: '1px solid var(--border-sub)', background: 'var(--bg-elevated)' }}
    >
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Página {currentPage} de {totalPages} &middot; {totalItems} {label}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="btn-ghost p-1.5 disabled:opacity-30 text-xs"
          title="Primera página"
        >
          «
        </button>
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="btn-ghost p-1.5 disabled:opacity-30"
        >
          <ChevronLeft size={14} />
        </button>
        {start > 1 && <span className="px-1 text-xs" style={{ color: 'var(--text-muted)' }}>…</span>}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className="w-7 h-7 rounded-lg text-xs font-bold transition-all"
            style={
              currentPage === p
                ? { background: 'linear-gradient(135deg, var(--peru-red), var(--peru-red-deep))', color: 'white' }
                : { color: 'var(--text-muted)' }
            }
          >
            {p}
          </button>
        ))}
        {end < totalPages && <span className="px-1 text-xs" style={{ color: 'var(--text-muted)' }}>…</span>}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="btn-ghost p-1.5 disabled:opacity-30"
        >
          <ChevronRight size={14} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="btn-ghost p-1.5 disabled:opacity-30 text-xs"
          title="Última página"
        >
          »
        </button>
      </div>
    </div>
  )
}

export default function PanelAlertas({ alertas = [], loading = false }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filtroSeveridad, setFiltroSeveridad] = useState('todos')
  const [page, setPage] = useState(1)

  if (loading) {
    return (
      <div className="glass-card p-6 space-y-3">
        <div className="loading-skeleton h-6 w-40 mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="loading-skeleton h-20 w-full" />
        ))}
      </div>
    )
  }

  const filteredAlertas = alertas.filter((a) => {
    const severity = getSeverity(a)
    if (filtroSeveridad !== 'todos' && severity !== filtroSeveridad) return false
    const reg = getRegionName(a).toLowerCase()
    const desc = (a.descripcion || a.mensaje || '').toLowerCase()
    const query = search.toLowerCase()
    return reg.includes(query) || desc.includes(query)
  })

  const totalPages = Math.max(1, Math.ceil(filteredAlertas.length / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const pageData = filteredAlertas.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  const handleFilter = (id) => {
    setFiltroSeveridad(id)
    setPage(1)
  }

  const handleSearch = (v) => {
    setSearch(v)
    setPage(1)
  }

  return (
    <div className="glass-card overflow-hidden" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="p-6 space-y-4" style={{ borderBottom: '1px solid var(--border-sub)', flexShrink: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="section-title">
              <Bell size={18} style={{ color: 'var(--peru-red)' }} />
              Panel de Alertas del Sistema
            </h2>
            <p className="section-subtitle">
              Detección automática de desviaciones presupuestales significativas
            </p>
          </div>
          {alertas.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="dot-live" />
              <span className="text-xs font-semibold text-adaptive-success">Monitoreo activo</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'todos', label: 'Todas' },
              { id: 'danger', label: 'Críticas' },
              { id: 'warning', label: 'Advertencias' },
              { id: 'info', label: 'Informativas' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => handleFilter(f.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
                style={
                  filtroSeveridad === f.id
                    ? {
                        background: 'linear-gradient(135deg, var(--peru-red), var(--peru-red-deep))',
                        color: 'white',
                        boxShadow: '0 2px 8px rgba(200,0,10,0.35)',
                      }
                    : {
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-sub)',
                      }
                }
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search size={13} className="absolute left-3 top-2.5" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar en alertas..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="input-field pl-8 py-1.5 text-xs w-full sm:w-52"
            />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {pageData.length === 0 ? (
          <div className="p-12 flex flex-col items-center text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}
            >
              <CheckCircle2 size={26} style={{ color: 'var(--color-success)' }} />
            </div>
            <p className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {search || filtroSeveridad !== 'todos'
                ? 'No hay alertas con estos filtros'
                : 'Sin alertas activas'}
            </p>
            <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>
              {search || filtroSeveridad !== 'todos'
                ? 'Prueba ajustando el término de búsqueda o cambiando el filtro.'
                : 'El sistema no ha detectado anomalías presupuestales en este ejercicio fiscal.'}
            </p>
          </div>
        ) : (
          <div>
            {pageData.map((alerta, idx) => {
              const severity = getSeverity(alerta)
              const cfg = COLOR_MAP[severity] || COLOR_MAP.info
              const Icon = ICON_MAP[severity] || Info
              const monto = Math.abs(Number(alerta.monto_relacionado || alerta.monto_devengado || alerta.diferencia || 0))
              const regionNombre = getRegionName(alerta)
              const regionId = getRegionId(alerta)
              const fechaStr = alerta.fecha ? new Date(alerta.fecha).toLocaleDateString('es-PE') : null

              return (
                <div
                  key={alerta.id || idx}
                  className="p-5 flex items-start gap-4 transition-colors group"
                  style={{ background: idx % 2 === 0 ? 'transparent' : 'var(--bg-elevated)', borderBottom: '1px solid var(--border-sub)' }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                  >
                    <Icon size={16} style={{ color: cfg.icon }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`${cfg.badge} text-[10px]`}>{cfg.label}</span>
                      {regionNombre && (
                        <span className="badge-slate text-[10px] font-semibold">{regionNombre}</span>
                      )}
                      {fechaStr && (
                        <span className="badge-slate text-[10px]">{fechaStr}</span>
                      )}
                      {alerta.anio && (
                        <span className="badge-slate text-[10px]">Ejercicio {alerta.anio}</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
                      {alerta.descripcion || alerta.mensaje || 'Anomalía detectada en ejecución presupuestal'}
                    </p>
                    {monto > 0 && (
                      <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
                        Monto observado: S/ {(monto / 1e6).toFixed(2)}M
                      </p>
                    )}
                  </div>

                  {regionId && (
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => navigate(`/region/${regionId}`)}
                        className="btn-ghost text-xs p-1.5 flex items-center gap-1"
                        style={{ color: 'var(--text-muted)' }}
                        title="Ver detalle de región"
                      >
                        <ExternalLink size={13} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0 }}>
        <Paginador
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={filteredAlertas.length}
          label="alertas"
        />
        <div
          className="px-6 py-3 flex items-center justify-between text-[11px]"
          style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-sub)', color: 'var(--text-muted)' }}
        >
          <span>
            {filteredAlertas.length} {filteredAlertas.length === 1 ? 'alerta encontrada' : 'alertas encontradas'} · Análisis automático
          </span>
          <span className="flex items-center gap-1.5">
            <span className="dot-live scale-75" />
            Tiempo real
          </span>
        </div>
      </div>
    </div>
  )
}
