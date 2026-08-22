import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, TrendingUp, DollarSign, Zap, BarChart3,
  MapPin, Calendar, Layers, Download, Check, ShieldCheck,
  Search, AlertTriangle, Brain, Sparkles, Info, Star,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import ErrorBoundary from '../components/ErrorBoundary'
import {
  MOCK_ANIOS, MOCK_RESUMEN,
  getMockMensualRegion, getMockSectoresRegion, getMockPrediccionRegion
} from '../data/mockData'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const validPayload = payload.filter((entry) => entry.value !== null && entry.value !== undefined)
  if (!validPayload.length) return null

  return (
    <div className="tooltip-dark">
      <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {validPayload.map((entry) => (
        <div key={entry.dataKey} className="flex justify-between gap-4 text-xs mb-1 last:mb-0">
          <span className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
            {entry.dataKey.includes('porcentaje')
              ? `${Number(entry.value).toFixed(1)}%`
              : `S/ ${(Number(entry.value) / 1e6).toFixed(1)}M`}
          </span>
        </div>
      ))}
    </div>
  )
}

function KPICard({ label, value, sub, color, icon: Icon }) {
  const c = {
    blue: { card: 'kpi-card-blue', icon: 'icon-box-peru', text: 'text-gradient-peru' },
    green: { card: 'kpi-card-green', icon: 'icon-box-green', text: 'text-gradient-green' },
    amber: { card: 'kpi-card-amber', icon: 'icon-box-gold', text: 'text-gradient-gold' },
    rose: { card: 'kpi-card-rose', icon: 'icon-box-rose', text: 'var(--peru-red)' },
  }[color] || { card: 'kpi-card-blue', icon: 'icon-box-peru', text: 'text-gradient-peru' }

  return (
    <div className={c.card}>
      <div className={`${c.icon} icon-box w-9 h-9 mb-3`}>
        <Icon size={16} />
      </div>
      <p className={`text-2xl font-black font-mono tracking-tight ${c.text}`}>{value}</p>
      <p className="text-sm font-semibold mt-1.5" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}

export default function DetalleRegion() {
  const { regionId } = useParams()
  const navigate = useNavigate()

  const [anios] = useState(MOCK_ANIOS)
  const [anio, setAnio] = useState(2024)
  const [regionData, setRegionData] = useState(null)
  const [mensual, setMensual] = useState([])
  const [prediccion, setPrediccion] = useState(null)
  const [mostrarPrediccion, setMostrarPrediccion] = useState(true)
  const [sectores, setSectores] = useState([])
  const [sectorSearch, setSectorSearch] = useState('')
  const [sectorPage, setSectorPage] = useState(1)
  const SECTORES_PER_PAGE = 6
  const [loading] = useState(false)
  const [error] = useState(null)
  const [exportando, setExportando] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [sectorPrediccion] = useState(null)

  useEffect(() => {
    const found = MOCK_RESUMEN.find(r => r.region_id === parseInt(regionId, 10))
    setRegionData(found || MOCK_RESUMEN[0])
    setMensual(getMockMensualRegion(regionId))
    setSectores(getMockSectoresRegion(regionId))
    setPrediccion(getMockPrediccionRegion(regionId))
  }, [regionId, anio])

  const handleExport = () => {
    if (exportando) return
    setExportando(true)
    setExportSuccess(false)
    setTimeout(() => {
      setExportSuccess(true)
      setExportando(false)
      setTimeout(() => setExportSuccess(false), 3000)
    }, 800)
  }

  const pim = regionData?.monto_pim || 0
  const dev = regionData?.monto_devengado || 0
  const gir = regionData?.monto_girado || 0
  const pct = regionData?.porcentaje_ejecucion || 0
  const pctColor = pct >= 75 ? '#22c55e' : pct >= 50 ? 'var(--peru-gold)' : 'var(--peru-red)'
  const filteredSectores = sectores.filter((s) =>
    s.sector.toLowerCase().includes(sectorSearch.toLowerCase())
  )
  const sectorTotalPages = Math.max(1, Math.ceil(filteredSectores.length / SECTORES_PER_PAGE))
  const sectorCurrentPage = Math.min(sectorPage, sectorTotalPages)
  const sectorPageData = filteredSectores.slice((sectorCurrentPage - 1) * SECTORES_PER_PAGE, sectorCurrentPage * SECTORES_PER_PAGE)

  const chartData = (prediccion?.puntos || mensual).map((item) => {
    const menItem = mensual.find((m) => m.mes_nombre === item.mes_nombre)
    return {
      mes_nombre: item.mes_nombre,
      monto_devengado: item.monto_devengado ?? (menItem ? menItem.monto_devengado : null),
      monto_proyectado: item.monto_proyectado ?? null,
      es_proyeccion: item.es_proyeccion ?? false,
    }
  })

  const esBajaConfiabilidad = prediccion && (prediccion.confiabilidad === 'BAJA' || prediccion.r2_score < 0.50)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="btn-secondary p-2.5"
              title="Volver"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="badge-peru text-[10px] font-bold tracking-widest uppercase">
                  <MapPin size={9} /> Vista Regional
                </span>
                <span className="badge-slate text-[10px]">
                  {anios.includes(anio) ? `Ejercicio ${anio}` : ''}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {regionData?.region_nombre || 'Región'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            <button
              onClick={handleExport}
              disabled={exportando}
              className="btn-secondary py-2 px-3 text-xs gap-1.5"
              title="Descargar datos de esta región en CSV"
            >
              {exportSuccess ? (
                <>
                  <Check size={13} style={{ color: 'var(--color-success)' }} />
                  <span className="font-semibold text-adaptive-success">Descargado</span>
                </>
              ) : (
                <>
                  <Download size={13} style={{ color: 'var(--peru-red)' }} />
                  <span>{exportando ? 'Generando...' : 'Exportar Región'}</span>
                </>
              )}
            </button>

            <div
              className="flex items-center gap-1 p-1 rounded-xl"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-sub)' }}
            >
              <Calendar size={13} className="ml-2 mr-1 hidden sm:block" style={{ color: 'var(--text-muted)' }} />
              {anios.map((a) => (
                <button
                  key={a}
                  onClick={() => setAnio(a)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150"
                  style={
                    anio === a
                      ? {
                          background: 'linear-gradient(135deg, var(--peru-red), var(--peru-red-deep))',
                          color: 'white',
                          boxShadow: '0 2px 8px rgba(200,0,10,0.4)',
                        }
                      : { color: 'var(--text-muted)' }
                  }
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div
          className="p-4 rounded-xl flex items-center gap-3 text-sm animate-fade-in"
          style={{ background: 'rgba(200,0,10,0.08)', border: '1px solid rgba(200,0,10,0.25)', color: 'var(--peru-red)' }}
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <ErrorBoundary>
        {loading ? (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-6">
                <div className="loading-skeleton w-9 h-9 rounded-xl mb-3" />
                <div className="loading-skeleton h-8 w-28 mb-2" />
                <div className="loading-skeleton h-4 w-20" />
              </div>
            ))}
          </div>
        ) : regionData ? (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
              <KPICard icon={DollarSign} label="PIM Asignado" value={`S/ ${(pim / 1e6).toFixed(2)}M`} sub={`Ejercicio ${anio}`} color="blue" />
              <KPICard icon={TrendingUp} label="Monto Devengado" value={`S/ ${(dev / 1e6).toFixed(2)}M`} sub="Gasto comprometido" color="green" />
              <KPICard icon={Zap} label="% de Ejecución" value={`${pct.toFixed(1)}%`} sub={pct >= 75 ? 'Nivel óptimo' : pct >= 50 ? 'En progreso' : 'Nivel crítico'} color={pct >= 75 ? 'green' : pct >= 50 ? 'amber' : 'rose'} />
              <KPICard icon={BarChart3} label="Monto Girado" value={`S/ ${(gir / 1e6).toFixed(2)}M`} sub="Pago efectivo completado" color="amber" />
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="section-title text-base">
                  <TrendingUp size={16} style={{ color: 'var(--peru-red)' }} />
                  Avance Presupuestal Consolidado
                </h3>
                <span className="text-xl font-black font-mono" style={{ color: pctColor }}>
                  {pct.toFixed(1)}%
                </span>
              </div>
              <div className="progress-bar" style={{ height: 10 }}>
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${pctColor}aa, ${pctColor})` }}
                />
              </div>
              <div className="flex justify-between text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>
                <span>Devengado: S/ {(dev / 1e6).toFixed(1)}M</span>
                <span className="font-mono">PIM Total: S/ {(pim / 1e6).toFixed(1)}M (100%)</span>
              </div>
            </div>
          </>
        ) : !error && (
          <div className="glass-card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
            <MapPin size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No hay datos para esta región en {anio}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="glass-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4" style={{ borderBottom: '1px solid var(--border-sub)' }}>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="section-title">
                    <BarChart3 size={18} style={{ color: 'var(--peru-red)' }} />
                    Evolución Mensual & Proyección
                  </h2>
                  {prediccion && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-mono"
                      style={
                        esBajaConfiabilidad
                          ? { background: 'rgba(245,158,11,0.12)', color: 'var(--color-gold)', border: '1px solid rgba(245,158,11,0.3)' }
                          : { background: 'rgba(200,0,10,0.12)', color: 'var(--peru-red)', border: '1px solid rgba(200,0,10,0.3)' }
                      }
                    >
                      <Brain size={11} /> ML R²: {prediccion.r2_score}
                    </span>
                  )}
                </div>
                <p className="section-subtitle">Gasto ejecutado y proyección futura en {anio}</p>
              </div>

              {prediccion && (
                <button
                  onClick={() => setMostrarPrediccion((p) => !p)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={
                    mostrarPrediccion
                      ? { background: 'rgba(200,150,45,0.15)', color: 'var(--color-gold)', border: '1px solid rgba(200,150,45,0.4)' }
                      : { background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-sub)' }
                  }
                  title="Alternar proyección ML estimada"
                >
                  <Sparkles size={12} />
                  Proyección
                </button>
              )}
            </div>

            {chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
                Sin datos mensuales para este ejercicio
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gDevR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--peru-red)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--peru-red)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-sub)" />
                  <XAxis dataKey="mes_nombre" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 6, color: 'var(--text-secondary)' }} />
                  <Area type="monotone" dataKey="monto_devengado" name="Devengado Real" stroke="var(--peru-red)" strokeWidth={2.5} fill="url(#gDevR)" dot={{ fill: 'var(--peru-red)', r: 3 }} />
                  {prediccion && mostrarPrediccion && (
                    <Line
                      type="monotone"
                      dataKey="monto_proyectado"
                      name="Proyección Futura (ML)"
                      stroke="#c084fc"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      connectNulls={false}
                      dot={{ fill: '#c084fc', r: 4 }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            )}

            {prediccion && (
              <div className="space-y-2 pt-1">
                <div
                  className="p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs"
                  style={{ background: 'rgba(200,150,45,0.08)', border: '1px solid rgba(200,150,45,0.25)' }}
                >
                  <div className="flex items-center gap-2">
                    <Brain size={14} style={{ color: 'var(--color-gold)' }} className="flex-shrink-0" />
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Modelo: <strong style={{ color: 'var(--text-primary)' }}>{prediccion.modelo}</strong> · Tendencia:{' '}
                      <strong style={{ color: 'var(--color-gold)' }}>{prediccion.tendencia}</strong>
                    </span>
                  </div>
                  <div className="font-mono text-[11px] flex flex-wrap gap-2" style={{ color: 'var(--color-gold)' }}>
                    <span>R²: {prediccion.r2_score}</span>
                    {prediccion.mae != null && <span>MAE: S/ {(prediccion.mae / 1e6).toFixed(2)}M</span>}
                    {prediccion.rmse != null && <span>RMSE: S/ {(prediccion.rmse / 1e6).toFixed(2)}M</span>}
                    <span>Confiabilidad: <strong>{prediccion.confiabilidad}</strong></span>
                  </div>
                </div>

                {prediccion.comparativa_modelos && prediccion.comparativa_modelos.length > 0 && (
                  <div
                    className="p-3 rounded-xl text-xs"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-sub)' }}
                  >
                    <p className="uppercase tracking-widest font-bold text-[10px] mb-2" style={{ color: 'var(--text-muted)' }}>Comparativa de Modelos (val. {prediccion.anio_validacion ?? ''})</p>
                    <div className="space-y-1.5">
                      {prediccion.comparativa_modelos.map((c) => {
                        const r2Color = c.r2_score >= 0.7 ? 'var(--color-success)' : c.r2_score >= 0.5 ? 'var(--color-gold)' : 'var(--color-danger)'
                        return (
                          <div key={c.nombre} className="flex items-center gap-2">
                            {c.es_mejor && <Star size={11} className="fill-amber-400 text-amber-400 inline flex-shrink-0" />}
                            {!c.es_mejor && <span className="w-4" />}
                            <span className="w-32 font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{c.nombre}</span>
                            <div className="flex-1 h-1.5 rounded overflow-hidden" style={{ background: 'var(--bg-overlay)' }}>
                              <div className="h-full rounded" style={{ width: `${Math.max(0, (c.r2_score ?? 0)) * 100}%`, background: r2Color }} />
                            </div>
                            <span className="font-mono text-[10px] w-16 text-right" style={{ color: r2Color }}>{(c.r2_score ?? 0).toFixed(4)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {esBajaConfiabilidad && (
                  <div
                    className="p-3 rounded-xl flex items-start gap-2.5 text-xs animate-fade-in"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}
                  >
                    <AlertTriangle size={15} style={{ color: 'var(--color-warning)' }} className="flex-shrink-0 mt-0.5" />
                    <div style={{ color: 'var(--text-secondary)' }} className="leading-relaxed">
                      <strong style={{ color: 'var(--color-warning)' }}>Advertencia Estadística (R² = {prediccion.r2_score} &lt; 0.50): </strong>
                      {prediccion.advertencia || 'La serie de gasto público presenta alta dispersión estacional e irregularidad en los desembolsos. La proyección es referencial.'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="glass-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4" style={{ borderBottom: '1px solid var(--border-sub)' }}>
              <div>
                <h2 className="section-title">
                  <Layers size={18} style={{ color: 'var(--peru-red)' }} />
                  Sectores Estratégicos
                </h2>
                <p className="section-subtitle">Distribución del presupuesto devengado por función</p>
              </div>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-2" style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filtrar sector..."
                  value={sectorSearch}
                  onChange={(e) => { setSectorSearch(e.target.value); setSectorPage(1) }}
                  className="input-field pl-8 py-1 text-xs w-full sm:w-40"
                />
              </div>
            </div>

            {filteredSectores.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
                No hay sectores coincidentes
              </div>
            ) : (
              <>
                <div className="space-y-3 pt-1">
                  {sectorPageData.map((s, idx) => {
                    const globalIdx = (sectorCurrentPage - 1) * SECTORES_PER_PAGE + idx
                    const maxDev = filteredSectores[0]?.monto_devengado || 1
                    const barW = (s.monto_devengado / maxDev) * 100
                    const color = ['var(--peru-red)', 'var(--peru-gold)', '#22c55e', '#8B0000', '#f97316', '#a855f7'][globalIdx % 6]
                    return (
                      <div key={s.sector || idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>
                            {s.sector || 'Sin sector'}
                          </span>
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span style={{ color: 'var(--text-muted)' }}>S/ {(s.monto_devengado / 1e6).toFixed(2)}M</span>
                            <span className="font-bold" style={{ color }}>{s.porcentaje_ejecucion.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="progress-bar" style={{ height: 6 }}>
                          <div
                            className="progress-fill"
                            style={{ width: `${barW}%`, background: color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
                {sectorTotalPages > 1 && (
                  <div
                    className="flex items-center justify-between pt-3 mt-1"
                    style={{ borderTop: '1px solid var(--border-sub)' }}
                  >
                    <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Pág. {sectorCurrentPage}/{sectorTotalPages} · {filteredSectores.length} sectores
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSectorPage((p) => Math.max(1, p - 1))}
                        disabled={sectorCurrentPage === 1}
                        className="btn-ghost p-1 disabled:opacity-30"
                      >
                        <ChevronLeft size={13} />
                      </button>
                      {Array.from({ length: sectorTotalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setSectorPage(p)}
                          className="w-6 h-6 rounded-md text-[11px] font-bold transition-all"
                          style={
                            sectorCurrentPage === p
                              ? { background: 'linear-gradient(135deg, var(--peru-red), var(--peru-red-deep))', color: 'white' }
                              : { color: 'var(--text-muted)' }
                          }
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => setSectorPage((p) => Math.min(sectorTotalPages, p + 1))}
                        disabled={sectorCurrentPage === sectorTotalPages}
                        className="btn-ghost p-1 disabled:opacity-30"
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </ErrorBoundary>
    </div>
  )
}
