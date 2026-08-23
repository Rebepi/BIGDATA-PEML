import { useState } from 'react'
import {
  ComposedChart, Area, BarChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { BarChart3, TrendingUp, Percent, Sparkles, Brain, AlertTriangle } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const validPayload = payload.filter((entry) => entry.value !== null && entry.value !== undefined)
  if (!validPayload.length) return null

  return (
    <div className="tooltip-dark">
      <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {validPayload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 mb-1 last:mb-0">
          <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="text-xs font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
            {entry.dataKey.includes('porcentaje')
              ? `${Number(entry.value).toFixed(1)}%`
              : `S/ ${(Number(entry.value) / 1e6).toFixed(1)}M`}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function GraficoEjecucion({ data = [], prediccion = null }) {
  const [vista, setVista] = useState('montos')
  const [mostrarPrediccion, setMostrarPrediccion] = useState(true)

  if (!data || data.length === 0) {
    return (
      <div
        className="glass-card flex flex-col items-center justify-center h-80"
        style={{ minHeight: 320, color: 'var(--text-muted)' }}
      >
        <BarChart3 size={36} className="mb-3 opacity-30" />
        <p className="text-sm font-medium">Sin datos mensuales disponibles</p>
        <p className="text-xs mt-1 opacity-60">Selecciona un año con registros mensuales</p>
      </div>
    )
  }

  const chartData = (prediccion?.puntos || data).map((item, idx) => {
    const itemMes = item.mes || (idx + 1)
    const dataItem = data.find((d) => d.mes === itemMes || d.mes_nombre === item.mes_nombre)
    return {
      mes: itemMes,
      mes_nombre: item.mes_nombre || dataItem?.mes_nombre || `M${itemMes}`,
      monto_pim: dataItem ? dataItem.monto_pim : null,
      monto_devengado: dataItem ? dataItem.monto_devengado : item.monto_devengado,
      monto_girado: dataItem ? dataItem.monto_girado : null,
      porcentaje_ejecucion: dataItem ? dataItem.porcentaje_ejecucion : null,
      monto_proyectado: item.monto_proyectado ?? null,
      es_proyeccion: item.es_proyeccion ?? false,
    }
  })

  const esBajaConfiabilidad = prediccion && (prediccion.confiabilidad === 'BAJA' || prediccion.r2_score < 0.50)

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4" style={{ borderBottom: '1px solid var(--border-sub)' }}>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="section-title">
              <TrendingUp size={18} style={{ color: 'var(--peru-red)' }} />
              Evolución Presupuestal Mensual
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
          <p className="section-subtitle">
            PIM, Devengado, Girado y proyección lineal estimada
          </p>
        </div>

        <div className="flex items-center gap-2">
          {prediccion && (
            <button
              onClick={() => setMostrarPrediccion((p) => !p)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={
                mostrarPrediccion
                  ? { background: 'rgba(200,150,45,0.15)', color: 'var(--color-gold)', border: '1px solid rgba(200,150,45,0.4)' }
                  : { background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-sub)' }
              }
              title="Alternar proyección de gasto estimada con Scikit-Learn"
            >
              <Sparkles size={12} />
              Proyección ML
            </button>
          )}

          <div
            className="flex items-center p-1 rounded-xl gap-0.5"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-sub)' }}
          >
            <button
              onClick={() => setVista('montos')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={
                vista === 'montos'
                  ? { background: 'linear-gradient(135deg, var(--peru-red), var(--peru-red-deep))', color: 'white', boxShadow: '0 2px 8px rgba(200,0,10,0.3)' }
                  : { color: 'var(--text-muted)' }
              }
            >
              <BarChart3 size={12} /> Montos (S/)
            </button>
            <button
              onClick={() => setVista('porcentaje')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={
                vista === 'porcentaje'
                  ? { background: 'linear-gradient(135deg, var(--peru-red), var(--peru-red-deep))', color: 'white', boxShadow: '0 2px 8px rgba(200,0,10,0.3)' }
                  : { color: 'var(--text-muted)' }
              }
            >
              <Percent size={12} /> % Ejecución
            </button>
          </div>
        </div>
      </div>

      {vista === 'montos' ? (
        <ResponsiveContainer width="100%" height={270}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gPim" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--peru-gold)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--peru-gold)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gDev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--peru-red)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--peru-red)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gGir" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-sub)" />
            <XAxis dataKey="mes_nombre" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 8, color: 'var(--text-secondary)' }} />
            <Area type="monotone" dataKey="monto_pim" name="PIM Real" stroke="var(--peru-gold)" strokeWidth={2} fill="url(#gPim)" />
            <Area type="monotone" dataKey="monto_devengado" name="Devengado Real" stroke="var(--peru-red)" strokeWidth={2.5} fill="url(#gDev)" dot={{ fill: 'var(--peru-red)', r: 3 }} />
            <Area type="monotone" dataKey="monto_girado" name="Girado Real" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="4 3" fill="url(#gGir)" />
            {prediccion && mostrarPrediccion && (
              <Line
                type="monotone"
                dataKey="monto_proyectado"
                name="Proyección Futura (ML)"
                stroke="#c084fc"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                connectNulls={false}
                dot={{ fill: '#c084fc', r: 4 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={270}>
          <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-sub)" vertical={false} />
            <XAxis dataKey="mes_nombre" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={75} stroke="#22c55e" strokeDasharray="4 3" label={{ value: '75%', fill: '#22c55e', fontSize: 10, position: 'right' }} />
            <ReferenceLine y={50} stroke="var(--peru-red)" strokeDasharray="4 3" label={{ value: '50%', fill: 'var(--peru-red)', fontSize: 10, position: 'right' }} />
            <Bar dataKey="porcentaje_ejecucion" name="% Ejecución" fill="var(--peru-red)" radius={[5, 5, 0, 0]} maxBarSize={32} />
          </BarChart>
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
                <span style={{ color: 'var(--color-gold)' }} className="font-semibold">{prediccion.tendencia}</span>
              </span>
            </div>
            <div className="font-mono text-[11px]" style={{ color: 'var(--color-gold)' }}>
              R² Score: <strong>{prediccion.r2_score}</strong> · Confiabilidad: <strong>{prediccion.confiabilidad}</strong>
            </div>
          </div>

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
  )
}
