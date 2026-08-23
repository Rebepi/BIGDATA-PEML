import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, AlertTriangle, TrendingDown, Info, CheckCircle2,
  Search, ExternalLink, ChevronLeft, ChevronRight, Check,
  CheckCheck, Trash2, RefreshCw, Eye, EyeOff, Sparkles, Filter
} from 'lucide-react'
import {
  marcarAlertaLeida, marcarTodasAlertasLeidas,
  eliminarAlerta, eliminarTodasAlertas, regenerarAlertas
} from '../services/api'

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

export default function PanelAlertas({ alertas = [], loading = false, onAlertasChange }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filtroSeveridad, setFiltroSeveridad] = useState('todos')
  const [filtroLectura, setFiltroLectura] = useState('todos')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState(false)
  const [mensajeExito, setMensajeExito] = useState(null)

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

  const noLeidasCount = alertas.filter(a => !a.leida).length
  const criticasCount = alertas.filter(a => getSeverity(a) === 'danger').length
  const advertenciasCount = alertas.filter(a => getSeverity(a) === 'warning').length

  const filteredAlertas = alertas.filter((a) => {
    const severity = getSeverity(a)
    if (filtroSeveridad !== 'todos' && severity !== filtroSeveridad) return false

    if (filtroLectura === 'no_leidas' && a.leida) return false
    if (filtroLectura === 'leidas' && !a.leida) return false

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

  const handleToggleLeida = async (alerta) => {
    if (!alerta?.id) return
    setActionLoading(true)
    try {
      await marcarAlertaLeida(alerta.id, !alerta.leida)
      if (onAlertasChange) await onAlertasChange()
    } catch {
    } finally {
      setActionLoading(false)
    }
  }

  const handleMarcarTodasLeidas = async () => {
    setActionLoading(true)
    try {
      const res = await marcarTodasAlertasLeidas()
      setMensajeExito(res.message || 'Todas las alertas han sido marcadas como leídas.')
      setTimeout(() => setMensajeExito(null), 3000)
      if (onAlertasChange) await onAlertasChange()
    } catch {
    } finally {
      setActionLoading(false)
    }
  }

  const handleEliminarAlerta = async (id) => {
    if (!id) return
    if (!window.confirm('¿Deseas eliminar esta alerta?')) return
    setActionLoading(true)
    try {
      await eliminarAlerta(id)
      if (onAlertasChange) await onAlertasChange()
    } catch {
    } finally {
      setActionLoading(false)
    }
  }

  const handleEliminarTodas = async () => {
    if (!window.confirm('¿Estás seguro de eliminar todas las alertas registradas?')) return
    setActionLoading(true)
    try {
      const res = await eliminarTodasAlertas()
      setMensajeExito(res.message || 'Todas las alertas fueron eliminadas.')
      setTimeout(() => setMensajeExito(null), 3000)
      if (onAlertasChange) await onAlertasChange()
    } catch {
    } finally {
      setActionLoading(false)
    }
  }

  const handleRegenerar = async () => {
    setActionLoading(true)
    try {
      const res = await regenerarAlertas()
      setMensajeExito(res.message || 'Detección de anomalías ejecutada con éxito.')
      setTimeout(() => setMensajeExito(null), 3000)
      if (onAlertasChange) await onAlertasChange()
    } catch {
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="glass-card overflow-hidden" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="p-5 space-y-4" style={{ borderBottom: '1px solid var(--border-sub)', flexShrink: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="section-title">
                <Bell size={18} style={{ color: 'var(--peru-red)' }} />
                Centro de Detección de Anomalías & Alertas
              </h2>
              {noLeidasCount > 0 && (
                <span className="badge-rose font-bold text-[10px]">
                  {noLeidasCount} {noLeidasCount === 1 ? 'nueva' : 'nuevas'}
                </span>
              )}
            </div>
            <p className="section-subtitle">
              Identificación estadística de subejecución y desvíos presupuestales en tiempo real
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRegenerar}
              disabled={actionLoading}
              className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 rounded-lg"
              style={{ border: '1px solid var(--border-sub)', background: 'var(--bg-elevated)' }}
              title="Volver a escanear anomalías en la base de datos"
            >
              <RefreshCw size={13} className={actionLoading ? 'animate-spin' : ''} />
              <span>Escanear Anomalías</span>
            </button>

            {alertas.length > 0 && (
              <>
                <button
                  onClick={handleMarcarTodasLeidas}
                  disabled={actionLoading || noLeidasCount === 0}
                  className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 rounded-lg disabled:opacity-40"
                  style={{ border: '1px solid var(--border-sub)', background: 'var(--bg-elevated)', color: 'var(--color-success)' }}
                >
                  <CheckCheck size={14} />
                  <span>Marcar todas leídas</span>
                </button>

                <button
                  onClick={handleEliminarTodas}
                  disabled={actionLoading}
                  className="btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1 rounded-lg text-adaptive-danger"
                  style={{ border: '1px solid var(--border-sub)', background: 'var(--bg-elevated)' }}
                  title="Eliminar todas las alertas"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}
          </div>
        </div>

        {mensajeExito && (
          <div className="p-3 rounded-xl flex items-center gap-2 text-xs font-semibold text-adaptive-success animate-fade-in" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <CheckCircle2 size={14} />
            <span>{mensajeExito}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-xl flex items-center justify-between" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-sub)' }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total Alertas</p>
              <p className="text-lg font-black font-mono mt-0.5" style={{ color: 'var(--text-primary)' }}>{alertas.length}</p>
            </div>
            <span className="badge-slate text-[10px]">Histórico</span>
          </div>

          <div className="p-2.5 rounded-xl flex items-center justify-between" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-sub)' }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>No Leídas</p>
              <p className="text-lg font-black font-mono text-gradient-peru mt-0.5">{noLeidasCount}</p>
            </div>
            <span className="badge-peru text-[10px]">Pendientes</span>
          </div>

          <div className="p-2.5 rounded-xl flex items-center justify-between" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-sub)' }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Críticas</p>
              <p className="text-lg font-black font-mono text-adaptive-danger mt-0.5">{criticasCount}</p>
            </div>
            <span className="badge-rose text-[10px]">Subejecución</span>
          </div>

          <div className="p-2.5 rounded-xl flex items-center justify-between" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-sub)' }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Advertencias</p>
              <p className="text-lg font-black font-mono text-adaptive-gold mt-0.5">{advertenciasCount}</p>
            </div>
            <span className="badge-amber text-[10px]">Atípicos</span>
          </div>
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

            <div className="h-4 w-px mx-1" style={{ background: 'var(--border-sub)' }} />

            <button
              onClick={() => setFiltroLectura(filtroLectura === 'no_leidas' ? 'todos' : 'no_leidas')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5"
              style={
                filtroLectura === 'no_leidas'
                  ? { background: 'rgba(200,0,10,0.15)', color: 'var(--peru-red)', border: '1px solid var(--peru-red)' }
                  : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-sub)' }
              }
            >
              <EyeOff size={12} />
              <span>Solo No Leídas</span>
            </button>
          </div>

          <div className="relative">
            <Search size={13} className="absolute left-3 top-2.5" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar por región o descripción..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="input-field pl-8 py-1.5 text-xs w-full sm:w-64"
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
              {search || filtroSeveridad !== 'todos' || filtroLectura !== 'todos'
                ? 'No hay alertas con los filtros aplicados'
                : 'Sin alertas activas'}
            </p>
            <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>
              {search || filtroSeveridad !== 'todos' || filtroLectura !== 'todos'
                ? 'Prueba ajustando el término de búsqueda o cambiando el filtro seleccionado.'
                : 'El sistema no ha detectado anomalías presupuestales pendientes de revisión.'}
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
              const estaLeida = Boolean(alerta.leida)

              return (
                <div
                  key={alerta.id || idx}
                  className="p-4 sm:p-5 flex items-start gap-4 transition-all"
                  style={{
                    background: estaLeida ? 'transparent' : 'rgba(200,0,10,0.03)',
                    opacity: estaLeida ? 0.72 : 1,
                    borderBottom: '1px solid var(--border-sub)',
                  }}
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
                      {estaLeida ? (
                        <span className="badge-slate text-[10px]">Leída</span>
                      ) : (
                        <span className="badge-peru text-[10px] font-bold">Nueva</span>
                      )}
                      {regionNombre && (
                        <span className="badge-slate text-[10px] font-semibold">{regionNombre}</span>
                      )}
                      {fechaStr && (
                        <span className="badge-slate text-[10px]">{fechaStr}</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold leading-snug" style={{ color: estaLeida ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                      {alerta.descripcion || alerta.mensaje || 'Anomalía detectada en ejecución presupuestal'}
                    </p>
                    {monto > 0 && (
                      <p className="text-xs mt-1 font-mono font-semibold" style={{ color: 'var(--color-gold)' }}>
                        Monto observado: S/ {(monto / 1e6).toFixed(2)}M
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleToggleLeida(alerta)}
                      disabled={actionLoading}
                      className="btn-ghost text-xs p-2 rounded-lg flex items-center justify-center transition-colors"
                      style={{
                        color: estaLeida ? 'var(--text-muted)' : 'var(--color-success)',
                        border: '1px solid var(--border-sub)',
                        background: 'var(--bg-elevated)'
                      }}
                      title={estaLeida ? 'Marcar como no leída' : 'Marcar como leída'}
                    >
                      {estaLeida ? <EyeOff size={13} /> : <Check size={13} />}
                    </button>

                    {regionId && (
                      <button
                        onClick={() => navigate(`/region/${regionId}`)}
                        className="btn-ghost text-xs p-2 rounded-lg flex items-center justify-center"
                        style={{ color: 'var(--text-muted)', border: '1px solid var(--border-sub)', background: 'var(--bg-elevated)' }}
                        title="Ver detalle regional"
                      >
                        <ExternalLink size={13} />
                      </button>
                    )}

                    <button
                      onClick={() => handleEliminarAlerta(alerta.id)}
                      disabled={actionLoading}
                      className="btn-ghost text-xs p-2 rounded-lg flex items-center justify-center text-adaptive-danger"
                      style={{ border: '1px solid var(--border-sub)', background: 'var(--bg-elevated)' }}
                      title="Eliminar alerta"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
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
            {filteredAlertas.length} {filteredAlertas.length === 1 ? 'alerta visible' : 'alertas visibles'} ({noLeidasCount} no leídas)
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-adaptive-success">
            <span className="dot-live scale-75" />
            Monitoreo en tiempo real
          </span>
        </div>
      </div>
    </div>
  )
}
