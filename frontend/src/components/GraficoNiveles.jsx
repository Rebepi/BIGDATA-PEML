import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Globe } from 'lucide-react'

const COLORS = ['#C8000A', '#C8962D', '#22c55e', '#8B0000', '#f59e0b']

const NivelTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="tooltip-dark">
      <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{d.nivel_gobierno}</p>
      <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
        Devengado: <strong className="text-adaptive-success font-mono">S/ {(d.monto_devengado / 1e6).toFixed(2)}M</strong>
      </p>
      <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
        PIM: <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>S/ {(d.monto_pim / 1e6).toFixed(2)}M</strong>
      </p>
      <p className="text-[11px]" style={{ color: 'var(--peru-red)' }}>
        Ejecución: <strong className="font-mono">{d.porcentaje_ejecucion.toFixed(1)}%</strong>
      </p>
    </div>
  )
}

export default function GraficoNiveles({ data = [] }) {
  if (!data?.length) {
    return (
      <div className="glass-card flex flex-col items-center justify-center h-48" style={{ color: 'var(--text-muted)' }}>
        <Globe size={32} className="mb-3 opacity-30" />
        <p className="text-sm font-medium">Sin datos por nivel de gobierno</p>
      </div>
    )
  }

  const totalDev = data.reduce((acc, d) => acc + d.monto_devengado, 0)
  const pieData = data.map((d) => ({
    ...d,
    share: totalDev > 0 ? (d.monto_devengado / totalDev) * 100 : 0,
  }))

  return (
    <div className="glass-card p-6">
      <div className="pb-4 mb-5" style={{ borderBottom: '1px solid var(--border-sub)' }}>
        <h2 className="section-title">
          <Globe size={18} style={{ color: 'var(--peru-red)' }} />
          Distribución por Nivel de Gobierno
        </h2>
        <p className="section-subtitle">
          Participación del Gobierno Nacional, Regional y Local en la ejecución del gasto
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
        <div className="md:col-span-2 flex justify-center" style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="monto_devengado"
                nameKey="nivel_gobierno"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                strokeWidth={0}
              >
                {pieData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<NivelTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="md:col-span-3 space-y-3">
          {pieData.map((d, index) => {
            const color = COLORS[index % COLORS.length]
            const execColor = d.porcentaje_ejecucion >= 75 ? 'var(--color-success)' : d.porcentaje_ejecucion >= 50 ? 'var(--color-gold)' : 'var(--color-danger)'
            return (
              <div
                key={d.nivel_gobierno}
                className="p-4 rounded-xl transition-all"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-sub)',
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{d.nivel_gobierno}</span>
                  </div>
                  <span className="text-base font-black font-mono" style={{ color }}>
                    {d.share.toFixed(1)}%
                  </span>
                </div>
                <div className="progress-bar mb-2" style={{ height: 5 }}>
                  <div className="progress-fill" style={{ width: `${Math.min(d.share, 100)}%`, background: color }} />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono" style={{ color: 'var(--text-muted)' }}>
                    Dev: S/ {(d.monto_devengado / 1e6).toFixed(1)}M
                  </span>
                  <span className="font-bold font-mono" style={{ color: execColor }}>
                    {d.porcentaje_ejecucion.toFixed(1)}% ejec.
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
