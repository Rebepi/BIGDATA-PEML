import { Layers } from 'lucide-react'

const PALETTE = ['#C8000A', '#C8962D', '#22c55e', '#f59e0b', '#8B0000', '#8b5cf6', '#f97316', '#14b8a6', '#a78bfa', '#fb7185']

export default function GraficoSectores({ data = [] }) {
  if (!data?.length) {
    return (
      <div className="glass-card flex flex-col items-center justify-center h-80" style={{ color: 'var(--text-muted)' }}>
        <Layers size={36} className="mb-3 opacity-30" />
        <p className="text-sm font-medium">Sin datos sectoriales disponibles</p>
      </div>
    )
  }

  const maxDev = Math.max(...data.map((d) => d.monto_devengado))

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="pb-4" style={{ borderBottom: '1px solid var(--border-sub)' }}>
        <h2 className="section-title">
          <Layers size={18} style={{ color: 'var(--peru-red)' }} />
          Gasto por Sector Estratégico
        </h2>
        <p className="section-subtitle">
          Top {data.length} sectores por presupuesto devengado en millones de soles
        </p>
      </div>

      <div className="space-y-2.5 pt-1">
        {data.map((sector, index) => {
          const pct = maxDev > 0 ? (sector.monto_devengado / maxDev) * 100 : 0
          const color = PALETTE[index % PALETTE.length]
          const execPct = sector.porcentaje_ejecucion || 0
          const execColor = execPct >= 75 ? 'var(--color-success)' : execPct >= 50 ? 'var(--color-gold)' : 'var(--color-danger)'

          return (
            <div key={sector.sector}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {sector.sector.length > 28 ? sector.sector.slice(0, 28) + '…' : sector.sector}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                  <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    S/ {(sector.monto_devengado / 1e6).toFixed(1)}M
                  </span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono"
                    style={{ background: `${execColor}18`, color: execColor, border: `1px solid ${execColor}40` }}
                  >
                    {execPct.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="progress-bar" style={{ height: 6 }}>
                <div
                  className="progress-fill"
                  style={{ width: `${pct}%`, background: color, opacity: 0.9 }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div
        className="mt-2 pt-3 flex items-center justify-between text-[11px]"
        style={{ borderTop: '1px solid var(--border-sub)', color: 'var(--text-muted)' }}
      >
        <span>
          Total devengado:{' '}
          <span className="font-semibold font-mono" style={{ color: 'var(--text-primary)' }}>
            S/ {(data.reduce((acc, d) => acc + d.monto_devengado, 0) / 1e6).toFixed(1)}M
          </span>
        </span>
        <span>{data.length} sectores analizados</span>
      </div>
    </div>
  )
}
