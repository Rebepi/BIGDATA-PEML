import { useState, useEffect, useCallback } from 'react'
import { BrainCircuit, RefreshCw, Star, AlertTriangle } from 'lucide-react'
import { MOCK_MODELO_METRICAS, MOCK_REGIONES } from '../data/mockData'
import './ComparativaModelos.css'

const MODELO_LABELS = {
  Ridge: 'Ridge',
  RandomForest: 'Random Forest',
  GradientBoosting: 'Gradient Boosting',
}

const MODELO_COLORS = {
  Ridge: 'var(--peru-gold)',
  RandomForest: '#22c55e',
  GradientBoosting: 'var(--peru-red)',
}

function R2Bar({ value }) {
  const pct = Math.max(0, Math.min(1, value ?? 0)) * 100
  const color = value >= 0.7 ? '#22c55e' : value >= 0.5 ? 'var(--peru-gold)' : 'var(--peru-red)'
  return (
    <div className="cm-r2bar-wrap">
      <div className="cm-r2bar-bg">
        <div className="cm-r2bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="cm-r2bar-label" style={{ color }}>
        {value != null ? value.toFixed(4) : 'N/A'}
      </span>
    </div>
  )
}

function formatMonto(val) {
  if (val == null) return 'N/A'
  if (val >= 1e9) return `S/ ${(val / 1e9).toFixed(2)} mil M`
  if (val >= 1e6) return `S/ ${(val / 1e6).toFixed(2)} M`
  if (val >= 1e3) return `S/ ${(val / 1e3).toFixed(0)} K`
  return `S/ ${val.toFixed(0)}`
}

function ModeloChip({ nombre, esMejor }) {
  const color = MODELO_COLORS[nombre] || 'var(--text-muted)'
  return (
    <span className="cm-chip" style={{ borderColor: color, color }}>
      {esMejor && <Star size={10} className="cm-chip-star fill-amber-400 text-amber-400" />}
      {MODELO_LABELS[nombre] || nombre}
    </span>
  )
}

export default function ComparativaModelos() {
  const [regiones] = useState(MOCK_REGIONES)
  const [sectores] = useState([])
  const [regionId, setRegionId] = useState(null)
  const [sector, setSector] = useState(null)
  const [metricas, setMetricas] = useState(MOCK_MODELO_METRICAS)
  const [loading, setLoading] = useState(false)
  const [error] = useState(null)

  const cargar = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      const filtradas = regionId
        ? MOCK_MODELO_METRICAS.filter(m => m.region_id === regionId)
        : MOCK_MODELO_METRICAS
      setMetricas(filtradas)
      setLoading(false)
    }, 400)
  }, [regionId, sector])

  useEffect(() => { cargar() }, [cargar])

  const rows = metricas.map((m) => {
    const candidatos = [
      { nombre: 'Ridge', r2: m.r2_ridge, mae: m.mae_ridge, rmse: m.rmse_ridge },
      { nombre: 'RandomForest', r2: m.r2_rf, mae: m.mae_rf, rmse: m.rmse_rf },
      { nombre: 'GradientBoosting', r2: m.r2_gb, mae: m.mae_gb, rmse: m.rmse_gb },
    ]
    return { ...m, candidatos }
  })

  return (
    <div className="cm-root">
      <div className="cm-header">
        <div className="cm-header-title">
          <div className="w-10 h-10 rounded-xl icon-box-peru flex items-center justify-center flex-shrink-0">
            <BrainCircuit size={20} style={{ color: 'var(--peru-red)' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Comparativa de Modelos ML</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Evaluación con split temporal — conjunto de validación: último año disponible</p>
          </div>
        </div>
        <div className="cm-filters">
          <div className="cm-filter-group">
            <label htmlFor="cm-sel-region">Región</label>
            <select
              id="cm-sel-region"
              value={regionId ?? ''}
              onChange={(e) => setRegionId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Todas las regiones</option>
              {regiones.map((r) => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
          <div className="cm-filter-group">
            <label htmlFor="cm-sel-sector">Sector</label>
            <select
              id="cm-sel-sector"
              value={sector ?? ''}
              onChange={(e) => setSector(e.target.value || null)}
              disabled={sectores.length === 0}
            >
              <option value="">Todos los sectores</option>
              {sectores.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button className="cm-btn-refresh flex items-center gap-1.5" onClick={cargar} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      <div className="cm-legend">
        {['Ridge', 'RandomForest', 'GradientBoosting'].map((n) => (
          <span key={n} className="cm-legend-item">
            <span className="cm-legend-dot" style={{ background: MODELO_COLORS[n] }} />
            {MODELO_LABELS[n]}
          </span>
        ))}
        <span className="cm-legend-item cm-legend-winner flex items-center gap-1">
          <Star size={11} className="fill-amber-400 text-amber-400" />
          <span>Modelo elegido automáticamente</span>
        </span>
      </div>

      {error && (
        <div className="cm-error flex items-center gap-2">
          <AlertTriangle size={15} style={{ color: 'var(--peru-red)' }} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="cm-loading">
          <div className="cm-spinner" />
          <span>Entrenando y evaluando modelos...</span>
        </div>
      ) : rows.length === 0 ? (
        <div className="cm-empty">
          <span>Sin datos. Consulte la API de predicción primero para generar métricas.</span>
        </div>
      ) : (
        <div className="cm-table-wrap">
          <table className="cm-table">
            <thead>
              <tr>
                <th>Región</th>
                <th>Sector</th>
                <th>Modelo Elegido</th>
                <th colSpan="3">Ridge</th>
                <th colSpan="3">Random Forest</th>
                <th colSpan="3">Gradient Boosting</th>
                <th>Datos</th>
                <th>Año val.</th>
              </tr>
              <tr className="cm-subheader">
                <th /><th /><th />
                <th>R²</th><th>MAE</th><th>RMSE</th>
                <th>R²</th><th>MAE</th><th>RMSE</th>
                <th>R²</th><th>MAE</th><th>RMSE</th>
                <th /><th />
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const regionNombre = regiones.find((r) => r.id === m.region_id)?.nombre || (m.region_id ? `#${m.region_id}` : 'Nacional')
                return (
                  <tr key={m.id} className="cm-row">
                    <td className="cm-td-region">{regionNombre}</td>
                    <td className="cm-td-sector">{m.sector || '—'}</td>
                    <td className="cm-td-elegido">
                      <ModeloChip nombre={m.modelo_usado} esMejor />
                    </td>
                    <td><R2Bar value={m.r2_ridge} /></td>
                    <td className="cm-td-mono">{formatMonto(m.mae_ridge)}</td>
                    <td className="cm-td-mono">{formatMonto(m.rmse_ridge)}</td>
                    <td><R2Bar value={m.r2_rf} /></td>
                    <td className="cm-td-mono">{formatMonto(m.mae_rf)}</td>
                    <td className="cm-td-mono">{formatMonto(m.rmse_rf)}</td>
                    <td><R2Bar value={m.r2_gb} /></td>
                    <td className="cm-td-mono">{formatMonto(m.mae_gb)}</td>
                    <td className="cm-td-mono">{formatMonto(m.rmse_gb)}</td>
                    <td className="cm-td-mono">{m.cantidad_datos ?? '—'} m</td>
                    <td className="cm-td-mono">{m.anio_validacion ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
