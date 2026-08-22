import { useState } from 'react'
import {
  Database, CheckCircle2, AlertCircle, Clock, RefreshCw,
  Search, ShieldCheck, ArrowDownRight, Sparkles,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import { MOCK_ETL_LOGS } from '../data/mockData'

const PER_PAGE = 10

function Paginador({ currentPage, totalPages, onPageChange, totalItems }) {
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
        Página {currentPage} de {totalPages} &middot; {totalItems} registros
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

export default function PanelETLLogs() {
  const [logs, setLogs] = useState(MOCK_ETL_LOGS)
  const [loading, setLoading] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(1)

  const fetchLogs = () => {
    setLoading(true)
    setTimeout(() => {
      setLogs(MOCK_ETL_LOGS)
      setLoading(false)
    }, 600)
  }

  const totalProcesadas = logs.reduce((acc, l) => acc + (l.filas_procesadas || 0), 0)
  const totalDescartadas = logs.reduce((acc, l) => acc + (l.filas_descartadas || 0), 0)
  const totalCorregidas = logs.reduce((acc, l) => acc + (l.filas_corregidas || 0), 0)
  const tasaLimpieza = (totalProcesadas + totalDescartadas) > 0
    ? (((totalProcesadas) / (totalProcesadas + totalDescartadas)) * 100).toFixed(1)
    : '100'

  const filteredLogs = logs.filter((log) => {
    const estado = (log.estado || '').toUpperCase()
    if (filtroEstado === 'exitoso' && !estado.includes('EXIT')) return false
    if (filtroEstado === 'error' && !estado.includes('ERR')) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      const matchFecha = (log.fecha_ejecucion || '').toLowerCase().includes(q)
      const matchOrigen = (log.origen_datos || '').toLowerCase().includes(q)
      const matchDetalle = (log.detalle_error || '').toLowerCase().includes(q)
      if (!matchFecha && !matchOrigen && !matchDetalle) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const pageData = filteredLogs.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  const handleFilter = (id) => {
    setFiltroEstado(id)
    setPage(1)
  }

  const handleBusqueda = (v) => {
    setBusqueda(v)
    setPage(1)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ flexShrink: 0 }}>
        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Ejecuciones Totales</span>
            <div className="w-8 h-8 rounded-lg icon-box-peru flex items-center justify-center">
              <Database size={15} style={{ color: 'var(--peru-red)' }} />
            </div>
          </div>
          <p className="text-2xl font-black font-mono" style={{ color: 'var(--text-primary)' }}>{logs.length}</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Corridas registradas en Postgres</p>
        </div>

        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Filas Procesadas</span>
            <div className="w-8 h-8 rounded-lg icon-box-green flex items-center justify-center">
              <ShieldCheck size={15} style={{ color: 'var(--color-success)' }} />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-adaptive-success">
            {totalProcesadas > 1e6 ? `${(totalProcesadas / 1e6).toFixed(1)}M` : totalProcesadas.toLocaleString('es-PE')}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Registros consolidados</p>
        </div>

        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Filas Corregidas</span>
            <div className="w-8 h-8 rounded-lg icon-box-gold flex items-center justify-center">
              <Sparkles size={15} style={{ color: 'var(--color-gold)' }} />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-adaptive-gold">
            {totalCorregidas.toLocaleString('es-PE')}
          </p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Valores nulos o formatos ajustados</p>
        </div>

        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Calidad de Datos</span>
            <div className="w-8 h-8 rounded-lg icon-box-peru flex items-center justify-center">
              <ArrowDownRight size={15} style={{ color: 'var(--peru-red)' }} />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-gradient-peru">{tasaLimpieza}%</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Tasa de aceptación de registros</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="p-6 space-y-4" style={{ borderBottom: '1px solid var(--border-sub)', flexShrink: 0 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="section-title">
                <Database size={18} style={{ color: 'var(--peru-red)' }} />
                Historial de Pipelines ETL
              </h2>
              <p className="section-subtitle">
                Registro de ingestión, validación y depuración automática de fuentes MEF
              </p>
            </div>

            <button
              onClick={fetchLogs}
              disabled={loading}
              className="btn-secondary py-1.5 px-3 text-xs gap-1.5 self-start sm:self-auto"
              title="Refrescar auditoría"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refrescar
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'exitoso', label: 'Completados' },
                { id: 'error', label: 'Con Errores' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleFilter(f.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
                  style={
                    filtroEstado === f.id
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
                placeholder="Buscar fecha, fuente o error..."
                value={busqueda}
                onChange={(e) => handleBusqueda(e.target.value)}
                className="input-field pl-8 py-1.5 text-xs w-full sm:w-56"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="loading-skeleton h-12 w-full" />
            ))}
          </div>
        ) : pageData.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
            <Search size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No se encontraron logs con los filtros aplicados</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-sub)' }}>
                  <th className="table-header-cell">Estado</th>
                  <th className="table-header-cell">Fecha / Hora</th>
                  <th className="table-header-cell">Fuente / Origen</th>
                  <th className="table-header-cell text-right">Procesadas</th>
                  <th className="table-header-cell text-right">Corregidas</th>
                  <th className="table-header-cell text-right">Descartadas</th>
                  <th className="table-header-cell">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((log, idx) => {
                  const isOk = (log.estado || '').toUpperCase().includes('EXIT')
                  const fecha = log.fecha_ejecucion
                    ? new Date(log.fecha_ejecucion).toLocaleString('es-PE')
                    : 'Sin fecha'
                  return (
                    <tr
                      key={log.id || idx}
                      className="border-b transition-colors"
                      style={{ borderColor: 'var(--border-sub)' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td className="table-cell">
                        {isOk ? (
                          <span className="badge-green text-[10px]">
                            <CheckCircle2 size={11} />
                            EXITOSO
                          </span>
                        ) : (
                          <span className="badge-rose text-[10px]">
                            <AlertCircle size={11} />
                            ERROR
                          </span>
                        )}
                      </td>
                      <td className="table-cell font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} style={{ color: 'var(--text-muted)' }} />
                          {fecha}
                        </div>
                      </td>
                      <td className="table-cell font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>
                        {log.origen_datos || 'MEF API / CSV'}
                      </td>
                      <td className="table-cell text-right font-mono text-xs font-bold text-adaptive-success">
                        {(log.filas_procesadas || 0).toLocaleString('es-PE')}
                      </td>
                      <td className="table-cell text-right font-mono text-xs font-bold text-adaptive-gold">
                        {(log.filas_corregidas || 0).toLocaleString('es-PE')}
                      </td>
                      <td className="table-cell text-right font-mono text-xs" style={{ color: log.filas_descartadas > 0 ? 'var(--peru-red)' : 'var(--text-muted)' }}>
                        {(log.filas_descartadas || 0).toLocaleString('es-PE')}
                      </td>
                      <td className="table-cell text-xs max-w-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        {log.detalle_error || (isOk ? 'Completado sin anomalías' : 'Fallo en pipeline')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ flexShrink: 0 }}>
          <Paginador
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filteredLogs.length}
          />
        </div>
      </div>
    </div>

  )
}
