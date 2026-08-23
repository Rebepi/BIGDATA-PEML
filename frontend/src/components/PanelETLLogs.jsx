import { useState, useEffect } from 'react'
import {
  Database, CheckCircle2, AlertCircle, Clock, RefreshCw,
  Search, ShieldCheck, ArrowDownRight, Sparkles,
  ChevronLeft, ChevronRight, FileSpreadsheet, Filter,
  Layers, ArrowRight, Play, Trash2, Info, Check, X, Calendar
} from 'lucide-react'
import {
  getEtlLogs, getEtlColumnMap, getEtlCleaningRules,
  getEtlRawSample, getEtlCleanedSample, getEtlMetricas,
  triggerEtlRun, triggerEtlResetAndRun, getEtlPipelineYears
} from '../services/api'

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
  const [activeTab, setActiveTab] = useState('logs')
  const [aniosDisponibles, setAniosDisponibles] = useState([])
  const [anioSeleccionado, setAnioSeleccionado] = useState(null)

  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [logsError, setLogsError] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [page, setPage] = useState(1)

  const [rawSample, setRawSample] = useState(null)
  const [rawLoading, setRawLoading] = useState(false)
  const [rawSearch, setRawSearch] = useState('')
  const [rawPage, setRawPage] = useState(1)
  const [rawPageSize, setRawPageSize] = useState(50)

  const [cleanedSample, setCleanedSample] = useState(null)
  const [cleanedLoading, setCleanedLoading] = useState(false)
  const [cleanPage, setCleanPage] = useState(1)
  const [cleanPageSize, setCleanPageSize] = useState(50)

  const [columnMap, setColumnMap] = useState(null)
  const [cleaningRules, setCleaningRules] = useState([])
  const [metricas, setMetricas] = useState(null)

  const [runningEtl, setRunningEtl] = useState(false)
  const [actionMessage, setActionMessage] = useState(null)

  const fetchLogs = () => {
    setLogsLoading(true)
    setLogsError(null)
    getEtlLogs(200)
      .then((res) => {
        setLogs(Array.isArray(res) ? res : [])
      })
      .catch((err) => {
        setLogsError(err.message || 'No se pudieron cargar los registros de auditoría ETL.')
      })
      .finally(() => {
        setLogsLoading(false)
      })
  }

  const fetchRaw = (anio, p = rawPage, ps = rawPageSize) => {
    setRawLoading(true)
    getEtlRawSample(anio, p, ps)
      .then((res) => setRawSample(res))
      .catch(() => setRawSample(null))
      .finally(() => setRawLoading(false))
  }

  const fetchCleaned = (anio, p = cleanPage, ps = cleanPageSize) => {
    setCleanedLoading(true)
    getEtlCleanedSample(anio, p, ps)
      .then((res) => setCleanedSample(res))
      .catch(() => setCleanedSample(null))
      .finally(() => setCleanedLoading(false))
  }

  const fetchRulesAndMap = (anio) => {
    getEtlColumnMap(anio).then((res) => setColumnMap(res)).catch(() => {})
    getEtlCleaningRules().then((res) => setCleaningRules(res.rules || [])).catch(() => {})
    getEtlMetricas(anio).then((res) => setMetricas(res)).catch(() => {})
  }

  useEffect(() => {
    fetchLogs()
    getEtlPipelineYears()
      .then((res) => {
        if (res?.years?.length > 0) {
          setAniosDisponibles(res.years)
          setAnioSeleccionado(res.years[0])
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!anioSeleccionado) return
    if (activeTab === 'raw') fetchRaw(anioSeleccionado, rawPage, rawPageSize)
    if (activeTab === 'clean') fetchCleaned(anioSeleccionado, cleanPage, cleanPageSize)
    if (activeTab === 'rules') fetchRulesAndMap(anioSeleccionado)
  }, [activeTab, anioSeleccionado, rawPage, rawPageSize, cleanPage, cleanPageSize])

  const handleTriggerEtl = async () => {
    setRunningEtl(true)
    setActionMessage(null)
    try {
      const res = await triggerEtlRun()
      setActionMessage({ type: 'success', text: res.message || 'Pipeline iniciado en segundo plano.' })
      fetchLogs()
      let count = 0
      const interval = setInterval(() => {
        fetchLogs()
        count++
        if (count >= 6) {
          clearInterval(interval)
          setRunningEtl(false)
        }
      }, 2500)
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Error al iniciar pipeline.' })
      setRunningEtl(false)
    }
  }

  const handleResetAndRun = async () => {
    if (!window.confirm('¿Deseas reiniciar la base de datos y recolectar toda la información automáticamente?')) return
    setRunningEtl(true)
    setActionMessage(null)
    try {
      const res = await triggerEtlResetAndRun()
      setActionMessage({ type: 'success', text: res.message || 'Datos reiniciados y recolección iniciada.' })
      fetchLogs()
      let count = 0
      const interval = setInterval(() => {
        fetchLogs()
        count++
        if (count >= 6) {
          clearInterval(interval)
          setRunningEtl(false)
        }
      }, 2500)
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Error al reiniciar pipeline.' })
      setRunningEtl(false)
    }
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
    if (filtroEstado === 'proceso' && !estado.includes('PROCESO')) return false
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

  const rawColumns = rawSample?.columns || []
  const rawRows = (rawSample?.rows || []).filter((r) => {
    if (!rawSearch) return true
    return Object.values(r).some((v) => String(v).toLowerCase().includes(rawSearch.toLowerCase()))
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden', gap: '0.85rem' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 glass-card" style={{ flexShrink: 0 }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl icon-box-peru flex items-center justify-center">
            <Layers size={20} style={{ color: 'var(--peru-red)' }} />
          </div>
          <div>
            <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Centro de Ingestión y Pipeline ETL Automatizado
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Procesamiento de Big Data, limpieza de clasificadores y auditoría en tiempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleTriggerEtl}
            disabled={runningEtl}
            className="btn-primary py-2 px-3 text-xs gap-1.5"
            title="Ejecuta la descarga y limpieza automática del MEF"
          >
            <Play size={13} className={runningEtl ? 'animate-spin' : ''} />
            <span>{runningEtl ? 'Ejecutando...' : 'Ejecutar ETL Ahora'}</span>
          </button>

          <button
            onClick={handleResetAndRun}
            disabled={runningEtl}
            className="btn-secondary py-2 px-3 text-xs gap-1.5"
            style={{ color: 'var(--color-danger)', borderColor: 'rgba(200,0,10,0.3)' }}
            title="Borra la BD y recolecta todo de nuevo desde cero automáticamente"
          >
            <Trash2 size={13} />
            <span>Reiniciar y Recolectar Todo</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className="p-3 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in"
          style={{
            background: actionMessage.type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(200,0,10,0.12)',
            border: `1px solid ${actionMessage.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(200,0,10,0.3)'}`,
            color: actionMessage.type === 'success' ? 'var(--color-success)' : 'var(--peru-red)',
          }}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="btn-ghost p-1 text-xs">✕</button>
        </div>
      )}

      <div className="flex items-center gap-2 border-b pb-2 flex-wrap" style={{ borderColor: 'var(--border-sub)', flexShrink: 0 }}>
        {[
          { id: 'logs', label: 'Auditoría y Ejecuciones', icon: Database },
          { id: 'raw', label: 'CSV Crudo (63 columnas)', icon: FileSpreadsheet },
          { id: 'clean', label: 'Datos Limpios (10 columnas)', icon: ShieldCheck },
          { id: 'rules', label: 'Diccionario y Transformaciones', icon: Filter },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition-all ${
                isActive ? 'btn-primary' : 'btn-ghost'
              }`}
              style={!isActive ? { color: 'var(--text-secondary)' } : {}}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          )
        })}

        {(activeTab === 'raw' || activeTab === 'clean' || activeTab === 'rules') && (
          <div className="flex items-center gap-2 ml-auto">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-sub)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
              }}
            >
              <Calendar size={13} style={{ color: 'var(--peru-red)' }} />
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Ejercicio:
              </span>
              <select
                value={anioSeleccionado || ''}
                onChange={(e) => setAnioSeleccionado(Number(e.target.value))}
                className="select-field text-xs py-1 px-3"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontWeight: 800,
                  fontFamily: 'JetBrains Mono, monospace',
                  paddingRight: '24px'
                }}
              >
                {aniosDisponibles.map((y) => (
                  <option key={y} value={y} style={{ background: '#141418', color: '#ffffff' }}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'logs' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', minHeight: 0 }}>
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
            <div className="p-4 space-y-3" style={{ borderBottom: '1px solid var(--border-sub)', flexShrink: 0 }}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'todos', label: 'Todos' },
                    { id: 'exitoso', label: 'Completados' },
                    { id: 'proceso', label: 'En Proceso' },
                    { id: 'error', label: 'Con Errores' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => { setFiltroEstado(f.id); setPage(1) }}
                      className="px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150"
                      style={
                        filtroEstado === f.id
                          ? { background: 'linear-gradient(135deg, var(--peru-red), var(--peru-red-deep))', color: 'white' }
                          : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-sub)' }
                      }
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-2.5" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Buscar fecha o detalle..."
                      value={busqueda}
                      onChange={(e) => { setBusqueda(e.target.value); setPage(1) }}
                      className="input-field pl-8 py-1 text-xs w-full sm:w-56"
                    />
                  </div>

                  <button
                    onClick={fetchLogs}
                    disabled={logsLoading}
                    className="btn-secondary py-1 px-2.5 text-xs gap-1"
                    title="Refrescar auditoría"
                  >
                    <RefreshCw size={12} className={logsLoading ? 'animate-spin' : ''} />
                    Refrescar
                  </button>
                </div>
              </div>
            </div>

            {logsError ? (
              <div className="p-12 text-center" style={{ color: 'var(--peru-red)' }}>
                <AlertCircle size={28} className="mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold">{logsError}</p>
              </div>
            ) : logsLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="loading-skeleton h-10 w-full" />
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
                      const isEnProceso = (log.estado || '').toUpperCase().includes('PROCESO')
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
                            {isEnProceso ? (
                              <span className="badge-amber text-[10px] animate-pulse flex items-center gap-1">
                                <RefreshCw size={11} className="animate-spin" />
                                EN PROCESO
                              </span>
                            ) : isOk ? (
                              <span className="badge-green text-[10px] flex items-center gap-1">
                                <CheckCircle2 size={11} />
                                EXITOSO
                              </span>
                            ) : (
                              <span className="badge-rose text-[10px] flex items-center gap-1">
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
      )}

      {activeTab === 'raw' && (
        <div className="glass-card flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderBottom: '1px solid var(--border-sub)', flexShrink: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="badge-peru text-[10px]">Dataset Origen MEF</span>
                <span className="badge-amber text-[10px] font-mono">{rawColumns.length} Columnas originales</span>
                <span className="badge-slate text-[10px]">Total: {(rawSample?.total_rows || 0).toLocaleString('es-PE')} filas</span>
                <span className="badge-slate text-[10px]">Página {rawSample?.page || 1} de {rawSample?.total_pages || 1}</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Visualización de las 63 columnas crudas tal como son exportadas por el Sistema Integrado del MEF
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-sub)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Filas/pág:</span>
                <select
                  value={rawPageSize}
                  onChange={(e) => { setRawPageSize(Number(e.target.value)); setRawPage(1) }}
                  className="select-field text-xs py-0.5 px-1 font-bold"
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}
                >
                  {[25, 50, 100, 200].map((sz) => (
                    <option key={sz} value={sz} style={{ background: '#141418', color: '#fff' }}>{sz}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <Search size={13} className="absolute left-3 top-2.5" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filtrar en página..."
                  value={rawSearch}
                  onChange={(e) => setRawSearch(e.target.value)}
                  className="input-field pl-8 py-1 text-xs w-44"
                />
              </div>

              <button
                onClick={() => fetchRaw(anioSeleccionado, rawPage, rawPageSize)}
                disabled={rawLoading}
                className="btn-secondary py-1 px-2.5 text-xs gap-1"
              >
                <RefreshCw size={12} className={rawLoading ? 'animate-spin' : ''} />
                Recargar
              </button>
            </div>
          </div>

          {rawLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="loading-skeleton h-10 w-full" />
              ))}
            </div>
          ) : !rawSample || rawRows.length === 0 ? (
            <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
              <FileSpreadsheet size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay muestra disponible para el año seleccionado</p>
            </div>
          ) : (
            <div style={{ flex: 1, overflow: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full text-xs" style={{ whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-sub)' }}>
                    <th className="table-header-cell sticky left-0 z-20" style={{ background: 'var(--bg-elevated)' }}>#</th>
                    {rawColumns.map((col) => {
                      const isKept = rawSample.kept_columns?.includes(col.toUpperCase())
                      return (
                        <th
                          key={col}
                          className="table-header-cell text-left px-3 py-2 font-mono"
                          style={{
                            color: isKept ? 'var(--peru-red)' : 'var(--text-muted)',
                            background: isKept ? 'rgba(200,0,10,0.06)' : 'transparent',
                            borderBottom: isKept ? '2px solid var(--peru-red)' : '1px solid var(--border-sub)',
                          }}
                        >
                          <div className="flex items-center gap-1">
                            {isKept && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--peru-red)' }} />}
                            {col}
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rawRows.map((row, rIdx) => {
                    const rowNumber = ((rawSample.page - 1) * rawSample.page_size) + rIdx + 1
                    return (
                      <tr
                        key={rIdx}
                        className="border-b transition-colors"
                        style={{ borderColor: 'var(--border-sub)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td className="table-cell sticky left-0 z-10 font-mono text-[10px] text-center" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                          {rowNumber}
                        </td>
                        {rawColumns.map((col) => {
                          const isKept = rawSample.kept_columns?.includes(col.toUpperCase())
                          return (
                            <td
                              key={col}
                              className="table-cell px-3 py-1.5 font-mono text-[11px]"
                              style={{
                                color: isKept ? 'var(--text-primary)' : 'var(--text-muted)',
                                background: isKept ? 'rgba(200,0,10,0.02)' : 'transparent',
                                fontWeight: isKept ? 600 : 400,
                              }}
                            >
                              {String(row[col] ?? '')}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ flexShrink: 0 }}>
            <Paginador
              currentPage={rawSample?.page || 1}
              totalPages={rawSample?.total_pages || 1}
              onPageChange={(p) => setRawPage(p)}
              totalItems={rawSample?.total_rows || 0}
              label="filas del CSV"
            />
          </div>
        </div>
      )}

      {activeTab === 'clean' && (
        <div className="glass-card flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderBottom: '1px solid var(--border-sub)', flexShrink: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="badge-green text-[10px]">Dataset Depurado</span>
                <span className="badge-peru text-[10px] font-mono">{cleanedSample?.total_columns || 10} Columnas limpias</span>
                <span className="badge-slate text-[10px]">Total: {(cleanedSample?.total_rows || 0).toLocaleString('es-PE')} registros</span>
                <span className="badge-slate text-[10px]">Página {cleanedSample?.page || 1} de {cleanedSample?.total_pages || 1}</span>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Estructura normalizada con montos calculados, regiones estandarizadas y duplicados descartados
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-sub)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Filas/pág:</span>
                <select
                  value={cleanPageSize}
                  onChange={(e) => { setCleanPageSize(Number(e.target.value)); setCleanPage(1) }}
                  className="select-field text-xs py-0.5 px-1 font-bold"
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}
                >
                  {[25, 50, 100, 200].map((sz) => (
                    <option key={sz} value={sz} style={{ background: '#141418', color: '#fff' }}>{sz}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => fetchCleaned(anioSeleccionado, cleanPage, cleanPageSize)}
                disabled={cleanedLoading}
                className="btn-secondary py-1 px-2.5 text-xs gap-1"
              >
                <RefreshCw size={12} className={cleanedLoading ? 'animate-spin' : ''} />
                Recargar
              </button>
            </div>
          </div>

          {cleanedLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="loading-skeleton h-10 w-full" />
              ))}
            </div>
          ) : !cleanedSample || (cleanedSample.rows || []).length === 0 ? (
            <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
              <ShieldCheck size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay muestra limpia disponible</p>
            </div>
          ) : (
            <div style={{ flex: 1, overflow: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch' }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-sub)' }}>
                    <th className="table-header-cell text-center w-12">#</th>
                    <th className="table-header-cell">Año</th>
                    <th className="table-header-cell">Mes</th>
                    <th className="table-header-cell">Región</th>
                    <th className="table-header-cell">Sector</th>
                    <th className="table-header-cell">Gobierno</th>
                    <th className="table-header-cell text-right">PIA (S/)</th>
                    <th className="table-header-cell text-right">PIM (S/)</th>
                    <th className="table-header-cell text-right">Devengado (S/)</th>
                    <th className="table-header-cell text-right">Girado (S/)</th>
                  </tr>
                </thead>
                <tbody>
                  {(cleanedSample.rows || []).map((r, idx) => {
                    const rowNumber = ((cleanedSample.page - 1) * cleanedSample.page_size) + idx + 1
                    return (
                      <tr
                        key={idx}
                        className="border-b transition-colors"
                        style={{ borderColor: 'var(--border-sub)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td className="table-cell text-center font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>{rowNumber}</td>
                        <td className="table-cell font-mono font-bold" style={{ color: 'var(--peru-red)' }}>{r.anio}</td>
                        <td className="table-cell font-mono">{r.mes}</td>
                        <td className="table-cell font-semibold" style={{ color: 'var(--text-primary)' }}>{r.region}</td>
                        <td className="table-cell text-xs" style={{ color: 'var(--text-secondary)' }}>{r.sector}</td>
                        <td className="table-cell text-xs" style={{ color: 'var(--text-muted)' }}>{r.nivel_gobierno}</td>
                        <td className="table-cell text-right font-mono font-semibold" style={{ color: 'var(--text-secondary)' }}>
                          {Number(r.monto_pia || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="table-cell text-right font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                          {Number(r.monto_pim || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="table-cell text-right font-mono font-bold text-adaptive-success">
                          {Number(r.monto_devengado || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="table-cell text-right font-mono font-bold text-adaptive-gold">
                          {Number(r.monto_girado || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
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
              currentPage={cleanedSample?.page || 1}
              totalPages={cleanedSample?.total_pages || 1}
              onPageChange={(p) => setCleanPage(p)}
              totalItems={cleanedSample?.total_rows || 0}
              label="registros limpios"
            />
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div
          className="pr-2 space-y-4 custom-scrollbar"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingBottom: '5rem',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {metricas && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ flexShrink: 0 }}>
              <div className="glass-card p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Reducción de Dimensionalidad</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl font-black font-mono text-gradient-peru">63 → 10</span>
                  <span className="badge-peru text-[10px]">84% menos columnas</span>
                </div>
              </div>

              <div className="glass-card p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tasa de Calidad de Datos</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl font-black font-mono text-adaptive-success">{metricas.calidad_pct}%</span>
                  <span className="badge-green text-[10px]">Registros válidos</span>
                </div>
              </div>

              <div className="glass-card p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Peso del Archivo Original</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-2xl font-black font-mono text-adaptive-gold">{metricas.file_size_mb} MB</span>
                  <span className="badge-amber text-[10px]">Ejercicio {anioSeleccionado}</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2" style={{ borderBottom: '1px solid var(--border-sub)' }}>
                <Check size={16} style={{ color: 'var(--color-success)' }} />
                <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                  10 Columnas Conservadas y su Destino
                </h3>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-64 pr-1" style={{ overscrollBehavior: 'contain' }}>
                {(columnMap?.kept || []).map((item) => (
                  <div
                    key={item.column}
                    className="p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-sub)' }}
                  >
                    <div>
                      <span className="font-mono font-bold" style={{ color: 'var(--peru-red)' }}>{item.column}</span>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.reason}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />
                      <span className="badge-green font-mono text-[10px]">{item.canonical}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2" style={{ borderBottom: '1px solid var(--border-sub)' }}>
                <X size={16} style={{ color: 'var(--color-danger)' }} />
                <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                  53 Columnas Descartadas por el ETL (Muestra)
                </h3>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-64 pr-1" style={{ overscrollBehavior: 'contain' }}>
                {(columnMap?.discarded || []).slice(0, 15).map((item) => (
                  <div
                    key={item.column}
                    className="p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-sub)' }}
                  >
                    <div>
                      <span className="font-mono font-semibold" style={{ color: 'var(--text-secondary)' }}>{item.column}</span>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.reason}</p>
                    </div>
                    <span className="badge-rose text-[10px] flex-shrink-0">Descartada</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-black mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Filter size={15} style={{ color: 'var(--color-gold)' }} />
              Reglas de Negocio y Algoritmos de Limpieza Aplicados
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {cleaningRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-3.5 rounded-xl flex flex-col justify-between gap-2"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-sub)' }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="badge-amber font-mono text-[9px]">Regla #{rule.id}</span>
                      <span className="badge-slate text-[9px] uppercase">{rule.tipo}</span>
                    </div>
                    <h4 className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{rule.nombre}</h4>
                    <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{rule.descripcion}</p>
                  </div>
                  <div className="pt-2 border-t text-[10px] font-semibold text-adaptive-gold" style={{ borderColor: 'var(--border-sub)' }}>
                    Impacto: {rule.impacto}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
