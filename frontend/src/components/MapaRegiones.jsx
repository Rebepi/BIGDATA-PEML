import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { MapContainer, GeoJSON, useMap } from 'react-leaflet'
import {
  Map, Activity, Info, X, TrendingUp, DollarSign,
  Zap, BarChart3, ArrowUpRight, ArrowDownRight,
  ChevronRight, MapPin, Layers, RotateCcw, Search,
  Award, AlertTriangle, CheckCircle2, ChevronLeft
} from 'lucide-react'
import { getEvolucionMensual, getSectores } from '../services/api'
import peruGeoJSON from '../data/peru-departamentos.json'

const NOMBRE_MAP = {
  'AMAZONAS': 'Amazonas', 'ANCASH': 'Áncash', 'APURIMAC': 'Apurímac',
  'AREQUIPA': 'Arequipa', 'AYACUCHO': 'Ayacucho', 'CAJAMARCA': 'Cajamarca',
  'CALLAO': 'Callao', 'CUSCO': 'Cusco', 'HUANCAVELICA': 'Huancavelica',
  'HUANUCO': 'Huánuco', 'ICA': 'Ica', 'JUNIN': 'Junín',
  'LA LIBERTAD': 'La Libertad', 'LAMBAYEQUE': 'Lambayeque', 'LIMA': 'Lima',
  'LORETO': 'Loreto', 'MADRE DE DIOS': 'Madre de Dios', 'MOQUEGUA': 'Moquegua',
  'PASCO': 'Pasco', 'PIURA': 'Piura', 'PUNO': 'Puno',
  'SAN MARTIN': 'San Martín', 'TACNA': 'Tacna', 'TUMBES': 'Tumbes', 'UCAYALI': 'Ucayali',
}

function getHeatColor(pct) {
  if (pct === null || pct === undefined) return { fill: '#1a1010', stroke: '#4a2020', opacity: 0.7 }
  if (pct >= 80) return { fill: '#15803d', stroke: '#22c55e', opacity: 0.88 }
  if (pct >= 65) return { fill: '#166534', stroke: '#4ade80', opacity: 0.84 }
  if (pct >= 50) return { fill: '#9a3412', stroke: '#f59e0b', opacity: 0.85 }
  if (pct >= 35) return { fill: '#991b1b', stroke: '#f97316', opacity: 0.85 }
  return { fill: '#881337', stroke: '#f43f5e', opacity: 0.88 }
}

function getLabelColor(pct) {
  if (pct === null || pct === undefined) return 'var(--text-muted)'
  if (pct >= 80) return 'var(--color-success)'
  if (pct >= 65) return 'var(--color-success)'
  if (pct >= 50) return 'var(--color-gold)'
  if (pct >= 35) return 'var(--color-warning)'
  return 'var(--color-danger)'
}

function getTierLabel(pct) {
  if (pct === null || pct === undefined) return 'Sin datos'
  if (pct >= 80) return 'Óptimo'
  if (pct >= 65) return 'Regular'
  if (pct >= 50) return 'Moderado'
  if (pct >= 35) return 'Bajo'
  return 'Crítico'
}

const PERU_BOUNDS = [[-18.40, -81.40], [-0.03, -68.60]]
const PERU_CENTER = [-9.25, -74.90]

const LEGEND = [
  { color: 'var(--color-success)', fill: '#15803d', label: '≥ 80%', tier: 'Óptimo' },
  { color: 'var(--color-success)', fill: '#166534', label: '65–80%', tier: 'Regular' },
  { color: 'var(--color-gold)', fill: '#9a3412', label: '50–65%', tier: 'Moderado' },
  { color: 'var(--color-warning)', fill: '#991b1b', label: '35–50%', tier: 'Bajo' },
  { color: 'var(--color-danger)', fill: '#881337', label: '< 35%', tier: 'Crítico' },
]

function MapController({ resetTrigger }) {
  const map = useMap()

  useEffect(() => {
    const fit = () => {
      map.invalidateSize()
      map.fitBounds(PERU_BOUNDS, { padding: [8, 8], animate: false })
    }
    fit()
    const timer1 = setTimeout(fit, 60)
    const timer2 = setTimeout(fit, 300)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [map, resetTrigger])

  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize()
      map.fitBounds(PERU_BOUNDS, { padding: [8, 8] })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [map])

  return null
}

function MapTooltip({ data, visible, pos }) {
  if (!visible || !data) return null
  const color = getLabelColor(data.pct)
  const tier = getTierLabel(data.pct)

  return (
    <div style={{
      position: 'absolute',
      left: Math.min(pos.x + 16, window.innerWidth - 260),
      top: Math.max(10, pos.y - 30),
      zIndex: 9999,
      pointerEvents: 'none',
      minWidth: 200,
      maxWidth: 240,
      background: 'var(--glass-bg)',
      border: `1px solid ${color}50`,
      borderRadius: 12,
      padding: '10px 12px',
      boxShadow: `0 12px 36px rgba(0,0,0,0.5), 0 0 0 1px ${color}25`,
      backdropFilter: 'blur(16px)',
      fontFamily: 'Outfit, sans-serif',
      transition: 'opacity 0.15s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontWeight: 800, fontSize: 12, color: 'var(--text-primary)' }}>{data.nombre}</span>
        <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 999, background: `${color}18`, color, border: `1px solid ${color}35`, textTransform: 'uppercase' }}>{tier}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 6 }}>
        <span style={{ fontSize: 24, fontWeight: 900, color, fontFamily: 'monospace', lineHeight: 1 }}>
          {data.pct !== null ? data.pct.toFixed(1) : '—'}
        </span>
        <span style={{ fontSize: 13, color, fontWeight: 700, marginBottom: 2 }}>%</span>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2, marginLeft: 2 }}>ejecución</span>
      </div>
      <div style={{ height: 4, borderRadius: 4, background: 'var(--bg-overlay)', marginBottom: 6, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 4, width: `${Math.min(data.pct ?? 0, 100)}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }} />
      </div>
      <div style={{ fontSize: 9, color: 'var(--peru-red)', display: 'flex', alignItems: 'center', gap: 2, fontWeight: 600 }}>
        <ChevronRight size={10} />
        <span>Clic para ver analítica</span>
      </div>
    </div>
  )
}

function PanelDetalle({ region, resumenData, anio, onClose }) {
  const [mensual, setMensual] = useState([])
  const [sectores, setSectores] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!region?.id) return
    setLoading(true)
    Promise.all([
      getEvolucionMensual(anio, region.id).catch(() => []),
      getSectores(anio, region.id, 5).catch(() => []),
    ]).then(([men, sec]) => {
      setMensual(men)
      setSectores(sec)
      setLoading(false)
    })
  }, [region?.id, anio])

  const pct = resumenData?.porcentaje_ejecucion ?? 0
  const pim = resumenData?.monto_pim ?? 0
  const dev = resumenData?.monto_devengado ?? 0
  const gir = resumenData?.monto_girado ?? 0
  const color = getLabelColor(pct)
  const tier = getTierLabel(pct)
  const { fill } = getHeatColor(pct)

  const maxMensual = Math.max(...mensual.map(m => m.monto_devengado || 0), 1)

  return (
    <div className="mapa-panel-sidebar animate-fade-in flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="mapa-panel-header py-2 px-3">
        <div className="mapa-panel-header-main">
          <div className="mapa-panel-region-icon" style={{ background: `${fill}33`, border: `1px solid ${color}50` }}>
            <MapPin size={13} style={{ color }} />
          </div>
          <div>
            <p className="mapa-panel-region-label">Región seleccionada</p>
            <h3 className="mapa-panel-region-name">{region.nombre}</h3>
          </div>
        </div>
        <button onClick={onClose} className="mapa-panel-close" title="Volver a vista nacional">
          <X size={14} />
        </button>
      </div>

      <div className="mapa-panel-body py-2.5 px-3">
        <div className="mapa-panel-pct-block p-2.5" style={{ background: 'var(--bg-elevated)', border: `1px solid ${color}35` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="mapa-panel-tier-badge" style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
              {tier}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Ejercicio {anio}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginTop: 4 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color, fontFamily: 'monospace', lineHeight: 1 }}>
              {pct.toFixed(1)}
            </span>
            <span style={{ fontSize: 16, color, fontWeight: 700, marginBottom: 3 }}>%</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, marginLeft: 3 }}>ejecutado</span>
          </div>
          <div className="mapa-panel-progress" style={{ marginTop: 6 }}>
            <div style={{ height: '100%', borderRadius: 4, width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${color}70, ${color})`, boxShadow: `0 0 8px ${color}50` }} />
          </div>
        </div>

        <div className="mapa-panel-kpis">
          <div className="mapa-panel-kpi-item py-1.5 px-2.5">
            <DollarSign size={12} style={{ color: 'var(--peru-gold)' }} className="flex-shrink-0" />
            <div>
              <p style={{ fontSize: 8.5, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>PIM Asignado</p>
              <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>S/ {(pim/1e6).toFixed(2)}M</p>
            </div>
          </div>
          <div className="mapa-panel-kpi-item py-1.5 px-2.5">
            <TrendingUp size={12} style={{ color, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 8.5, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Devengado</p>
              <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>S/ {(dev/1e6).toFixed(2)}M</p>
            </div>
          </div>
          <div className="mapa-panel-kpi-item py-1.5 px-2.5">
            <Zap size={12} style={{ color: 'var(--color-success)' }} className="flex-shrink-0" />
            <div>
              <p style={{ fontSize: 8.5, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Monto Girado</p>
              <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-success)', fontFamily: 'monospace' }}>S/ {(gir/1e6).toFixed(2)}M</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mapa-panel-loading">
            <div className="mapa-panel-skeleton" style={{ height: 12, width: '60%' }} />
            <div className="mapa-panel-skeleton" style={{ height: 48, width: '100%' }} />
            <div className="mapa-panel-skeleton" style={{ height: 12, width: '50%' }} />
            <div className="mapa-panel-skeleton" style={{ height: 40, width: '100%' }} />
          </div>
        ) : (
          <>
            {mensual.length > 0 && (
              <div className="mapa-panel-section">
                <p className="mapa-panel-section-title">
                  <BarChart3 size={11} style={{ color: 'var(--peru-red)' }} /> Evolución mensual devengado
                </p>
                <div className="mapa-panel-mini-bars" style={{ height: 48, padding: '0.3rem' }}>
                  {mensual.map((m, i) => {
                    const h = Math.max(4, ((m.monto_devengado || 0) / maxMensual) * 40)
                    return (
                      <div key={i} className="mapa-panel-mini-bar-col" title={`${m.mes_nombre}: S/ ${(m.monto_devengado/1e6).toFixed(2)}M`}>
                        <div className="mapa-panel-mini-bar" style={{ height: h, background: color, opacity: 0.7 + (i / mensual.length) * 0.3 }} />
                        <span className="mapa-panel-mini-bar-label">{m.mes_nombre?.slice(0,2)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {sectores.length > 0 && (
              <div className="mapa-panel-section">
                <p className="mapa-panel-section-title">
                  <Layers size={11} style={{ color: 'var(--peru-gold)' }} /> Sectores prioritarios
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {sectores.slice(0, 4).map((s, i) => {
                    const sColors = ['var(--peru-red)','var(--peru-gold)','#22c55e','#8B0000']
                    const sc = sColors[i % 4]
                    const maxS = sectores[0]?.monto_devengado || 1
                    return (
                      <div key={s.sector || i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{s.sector}</span>
                          <span style={{ fontSize: 10, color: sc, fontWeight: 800, fontFamily: 'monospace', flexShrink: 0 }}>{s.porcentaje_ejecucion?.toFixed(1)}%</span>
                        </div>
                        <div style={{ height: 3, borderRadius: 3, background: 'var(--bg-overlay)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(s.monto_devengado/maxS)*100}%`, background: sc, borderRadius: 3 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function PanelVisionNacional({ resumen, anio, onSelectRegion, regiones }) {
  const [search, setSearch] = useState('')

  const sorted = useMemo(() => {
    if (!resumen || resumen.length === 0) return []
    return [...resumen].sort((a, b) => (b.porcentaje_ejecucion || 0) - (a.porcentaje_ejecucion || 0))
  }, [resumen])

  const top3 = sorted.slice(0, 3)
  const bottom3 = sorted.slice(-3).reverse()

  const avgPct = useMemo(() => {
    if (!resumen || resumen.length === 0) return 0
    const sum = resumen.reduce((acc, r) => acc + (r.porcentaje_ejecucion || 0), 0)
    return sum / resumen.length
  }, [resumen])

  const filteredRegions = useMemo(() => {
    if (!regiones) return []
    if (!search.trim()) return regiones
    return regiones.filter(r => r.nombre.toLowerCase().includes(search.toLowerCase()))
  }, [regiones, search])

  const findResumen = (regionId) => (resumen || []).find(r => r.region_id === regionId)

  return (
    <div className="mapa-panel-sidebar animate-fade-in flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="mapa-panel-header py-2 px-3">
        <div className="mapa-panel-header-main">
          <div className="mapa-panel-region-icon icon-box-peru">
            <Activity size={13} style={{ color: 'var(--peru-red)' }} />
          </div>
          <div>
            <p className="mapa-panel-region-label">Monitor Territorial</p>
            <h3 className="mapa-panel-region-name">Panorama Nacional {anio}</h3>
          </div>
        </div>
      </div>

      <div className="mapa-panel-body py-2.5 px-3">
        <div className="mapa-panel-pct-block p-2.5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-main)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9.5, color: 'var(--peru-red)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Promedio Nacional</span>
            <span style={{ fontSize: 9.5, color: 'var(--text-muted)' }}>{resumen.length} Dptos.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginTop: 3 }}>
            <span className="text-gradient-peru" style={{ fontSize: 28, fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>
              {avgPct.toFixed(1)}
            </span>
            <span style={{ fontSize: 14, color: 'var(--peru-red)', fontWeight: 700, marginBottom: 2 }}>%</span>
            <span style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 2, marginLeft: 3 }}>avance medio</span>
          </div>
          <div className="mapa-panel-progress" style={{ marginTop: 6 }}>
            <div style={{ height: '100%', borderRadius: 4, width: `${Math.min(avgPct, 100)}%`, background: 'linear-gradient(90deg, var(--peru-red), var(--peru-gold))', boxShadow: '0 0 8px rgba(200,0,10,0.4)' }} />
          </div>
        </div>

        <div className="mapa-panel-section">
          <p className="mapa-panel-section-title" style={{ color: 'var(--color-success)' }}>
            <Award size={11} /> Mayor Avance Presupuestal
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {top3.map((r, i) => {
              const regObj = regiones.find(reg => reg.id === r.region_id)
              const pctVal = r.porcentaje_ejecucion || 0
              return (
                <button
                  key={r.region_id || i}
                  onClick={() => regObj && onSelectRegion(regObj, r)}
                  className="mapa-region-item-btn py-1 px-2"
                >
                  <span style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--color-success)', width: 12 }}>#{i + 1}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-primary)', flex: 1, textAlign: 'left' }}>{r.region_nombre}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--color-success)', fontFamily: 'monospace' }}>{pctVal.toFixed(1)}%</span>
                  <ChevronRight size={11} style={{ color: 'var(--text-muted)' }} />
                </button>
              )
            })}
          </div>
        </div>

        <div className="mapa-panel-section">
          <p className="mapa-panel-section-title" style={{ color: 'var(--peru-red)' }}>
            <AlertTriangle size={11} /> Requieren Atención / Menor Avance
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {bottom3.map((r, i) => {
              const regObj = regiones.find(reg => reg.id === r.region_id)
              const pctVal = r.porcentaje_ejecucion || 0
              return (
                <button
                  key={r.region_id || i}
                  onClick={() => regObj && onSelectRegion(regObj, r)}
                  className="mapa-region-item-btn py-1 px-2"
                >
                  <span style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--peru-red)', width: 12 }}>#{sorted.length - i}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-primary)', flex: 1, textAlign: 'left' }}>{r.region_nombre}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--peru-red)', fontFamily: 'monospace' }}>{pctVal.toFixed(1)}%</span>
                  <ChevronRight size={11} style={{ color: 'var(--text-muted)' }} />
                </button>
              )
            })}
          </div>
        </div>

        <div className="mapa-panel-section" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <p className="mapa-panel-section-title">
              <MapPin size={11} style={{ color: 'var(--peru-red)' }} /> Explorar Regiones ({filteredRegions.length})
            </p>
          </div>
          <div className="relative" style={{ marginBottom: 3 }}>
            <Search size={11} className="absolute left-2 top-2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar región..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-6 py-1 text-[11px]"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2.5, flex: 1, overflowY: 'auto', minHeight: 70 }}>
            {filteredRegions.map(reg => {
              const resData = findResumen(reg.id)
              const pctVal = resData?.porcentaje_ejecucion ?? 0
              const col = getLabelColor(pctVal)
              return (
                <button
                  key={reg.id}
                  onClick={() => onSelectRegion(reg, resData)}
                  className="mapa-region-item-btn py-1 px-2"
                >
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: col, flexShrink: 0 }} />
                  <span style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-secondary)', flex: 1, textAlign: 'left' }}>{reg.nombre}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: col, fontFamily: 'monospace' }}>{pctVal.toFixed(1)}%</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function CapaRegiones({ resumenMap, regiones, onRegionClick, onHover, onLeave, selectedRegionId }) {
  const activeLayerRef = useRef(null)
  const activeStyleRef = useRef(null)

  const getRegionData = useCallback((nombreGeo) => {
    const nombreNorm = NOMBRE_MAP[nombreGeo] || nombreGeo
    if (!regiones) return null
    return regiones.find(r =>
      r.nombre?.toUpperCase() === nombreNorm.toUpperCase() ||
      r.nombre?.toUpperCase() === nombreGeo.toUpperCase()
    ) || null
  }, [regiones])

  const getResumenData = useCallback((region) => {
    if (!region || !resumenMap) return null
    return resumenMap[region.id] || null
  }, [resumenMap])

  const styleFeature = useCallback((feature) => {
    const nombreGeo = feature.properties.NOMBDEP
    const region = getRegionData(nombreGeo)
    const resumen = getResumenData(region)
    const pct = resumen?.porcentaje_ejecucion ?? null
    const { fill, stroke, opacity } = getHeatColor(pct)
    const isSelected = region && selectedRegionId === region.id

    return {
      fillColor: fill,
      color: isSelected ? 'var(--peru-gold)' : stroke,
      weight: isSelected ? 3 : 1.5,
      opacity: 1,
      fillOpacity: isSelected ? Math.min(opacity + 0.2, 1) : opacity,
    }
  }, [getRegionData, getResumenData, selectedRegionId])

  const onEachFeature = useCallback((feature, layer) => {
    const nombreGeo = feature.properties.NOMBDEP
    const region = getRegionData(nombreGeo)
    const resumen = getResumenData(region)
    const pct = resumen?.porcentaje_ejecucion ?? null

    layer.on({
      mouseover: (e) => {
        if (activeLayerRef.current && activeLayerRef.current !== layer) {
          activeLayerRef.current.setStyle(activeStyleRef.current)
        }
        activeLayerRef.current = layer
        activeStyleRef.current = styleFeature(feature)

        layer.setStyle({
          weight: 2.5,
          color: getLabelColor(pct),
          fillOpacity: Math.min((getHeatColor(pct).opacity + 0.15), 1),
          fillColor: getHeatColor(pct).fill,
        })
        layer.bringToFront()

        onHover({
          nombre: region?.nombre || NOMBRE_MAP[nombreGeo] || nombreGeo,
          pct,
          pim: resumen?.monto_pim ?? null,
          devengado: resumen?.monto_devengado ?? null,
          regionId: region?.id,
        }, { x: e.containerPoint.x, y: e.containerPoint.y })
      },
      mousemove: (e) => {
        onHover(null, { x: e.containerPoint.x, y: e.containerPoint.y }, true)
      },
      mouseout: () => {
        layer.setStyle(styleFeature(feature))
        if (activeLayerRef.current === layer) {
          activeLayerRef.current = null
          activeStyleRef.current = null
        }
        onLeave()
      },
      click: () => {
        if (region) onRegionClick(region, resumen)
      },
    })
  }, [getRegionData, getResumenData, styleFeature, onHover, onLeave, onRegionClick])

  return (
    <GeoJSON
      data={peruGeoJSON}
      style={styleFeature}
      onEachFeature={onEachFeature}
      key={`${JSON.stringify(resumenMap ? Object.keys(resumenMap).length : 0)}-${selectedRegionId || 0}`}
    />
  )
}

export default function MapaRegiones({ regiones, resumen, anio }) {
  const [tooltip, setTooltip] = useState({ visible: false, data: null, pos: { x: 0, y: 0 } })
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [selectedResumen, setSelectedResumen] = useState(null)
  const [resetTrigger, setResetTrigger] = useState(0)
  const containerRef = useRef(null)

  const resumenMap = useMemo(() => {
    const map = {}
    if (resumen) {
      resumen.forEach((r) => { if (r.region_id) map[r.region_id] = r })
    }
    return map
  }, [resumen])

  const handleHover = useCallback((data, pos, moveOnly = false) => {
    if (moveOnly) {
      setTooltip(prev => ({ ...prev, pos }))
    } else {
      setTooltip({ visible: true, data, pos })
    }
  }, [])

  const handleLeave = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }))
  }, [])

  const handleSelectRegion = useCallback((region, resData) => {
    setSelectedRegion(region)
    setSelectedResumen(resData || resumenMap[region.id] || null)
    setTooltip(prev => ({ ...prev, visible: false }))
  }, [resumenMap])

  const handleReset = useCallback(() => {
    setSelectedRegion(null)
    setSelectedResumen(null)
    setResetTrigger(p => p + 1)
  }, [])

  const totalRegiones = (resumen || []).length
  const conDatos = (resumen || []).filter(r => r.porcentaje_ejecucion > 0).length

  return (
    <div className="glass-card flex-1 flex flex-col min-h-0 overflow-hidden" style={{ position: 'relative' }}>
      <div className="px-3.5 sm:px-5 py-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-sub)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="section-title text-sm sm:text-base">
              <Map size={16} style={{ color: 'var(--peru-red)' }} />
              Mapa Interactivo de Ejecución Presupuestal
            </h2>
            <div className="flex items-center gap-1.5 flex-wrap">
              {LEGEND.map(l => (
                <div key={l.label} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold cursor-default" style={{ background: 'var(--bg-elevated)', border: `1px solid ${l.color}40`, color: l.color }}>
                  <span className="w-1.5 h-1.5 rounded-sm" style={{ background: l.fill, border: `1px solid ${l.color}` }} />
                  {l.label}
                  <span style={{ color: 'var(--text-muted)', fontSize: 8.5 }}>·</span>
                  <span style={{ color: l.color, fontSize: 8.5, fontWeight: 600 }}>{l.tier}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
            <button
              onClick={handleReset}
              className="btn-secondary py-1 px-2.5 text-xs gap-1"
              title="Restablecer vista general de Perú"
            >
              <RotateCcw size={11} style={{ color: 'var(--peru-red)' }} />
              <span>Vista General</span>
            </button>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold badge-peru">
              <Activity size={10} />
              {conDatos}/{totalRegiones} activas
            </div>
          </div>
        </div>
      </div>

      <div className="mapa-layout-split flex-1 flex flex-col lg:flex-row min-h-0">
        <div ref={containerRef} className="mapa-container-wrap flex-1 flex flex-col relative min-h-[300px] lg:min-h-0">
          <MapContainer
            center={PERU_CENTER}
            zoom={5.2}
            style={{ height: '100%', width: '100%', flex: 1, background: 'var(--bg-base)' }}
            zoomControl={true}
            scrollWheelZoom={true}
            maxBounds={[[-20, -83], [2, -67]]}
            maxBoundsViscosity={0.8}
            minZoom={4}
            maxZoom={10}
          >
            <CapaRegiones
              resumenMap={resumenMap}
              regiones={regiones}
              onRegionClick={handleSelectRegion}
              onHover={handleHover}
              onLeave={handleLeave}
              selectedRegionId={selectedRegion?.id}
            />
            <MapController resetTrigger={resetTrigger} />
          </MapContainer>

          <MapTooltip visible={tooltip.visible} data={tooltip.data} pos={tooltip.pos} />
        </div>

        <div className="mapa-panel-wrap">
          {selectedRegion ? (
            <PanelDetalle
              region={selectedRegion}
              resumenData={selectedResumen}
              anio={anio}
              onClose={() => { setSelectedRegion(null); setSelectedResumen(null) }}
            />
          ) : (
            <PanelVisionNacional
              resumen={resumen}
              regiones={regiones}
              anio={anio}
              onSelectRegion={handleSelectRegion}
            />
          )}
        </div>
      </div>
    </div>
  )
}
