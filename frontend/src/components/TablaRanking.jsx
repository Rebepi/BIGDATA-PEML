import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Trophy, Award, Medal, ExternalLink, Download } from 'lucide-react'

function getExecColor(pct) {
  if (pct >= 80) return { bg: 'rgba(34,197,94,0.14)', border: 'rgba(34,197,94,0.35)', text: 'var(--color-success)' }
  if (pct >= 60) return { bg: 'rgba(200,150,45,0.14)', border: 'rgba(200,150,45,0.35)', text: 'var(--color-gold)' }
  if (pct >= 40) return { bg: 'rgba(249,115,22,0.14)', border: 'rgba(249,115,22,0.35)', text: 'var(--color-warning)' }
  return { bg: 'rgba(200,0,10,0.14)', border: 'rgba(200,0,10,0.35)', text: 'var(--color-danger)' }
}

function RankBadge({ position }) {
  if (position === 0) {
    return (
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black font-mono"
        style={{
          background: 'linear-gradient(135deg, var(--peru-gold-light), var(--peru-gold))',
          color: '#ffffff',
          boxShadow: '0 2px 8px rgba(200,150,45,0.4)',
        }}
        title="1° Lugar"
      >
        <Trophy size={13} style={{ color: 'white' }} />
      </span>
    )
  }
  if (position === 1) {
    return (
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black font-mono"
        style={{
          background: 'linear-gradient(135deg, #94a3b8, #64748b)',
          color: '#ffffff',
          boxShadow: '0 2px 8px rgba(148,163,184,0.3)',
        }}
        title="2° Lugar"
      >
        <Award size={13} style={{ color: 'white' }} />
      </span>
    )
  }
  if (position === 2) {
    return (
      <span
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black font-mono"
        style={{
          background: 'linear-gradient(135deg, var(--peru-red), var(--peru-red-deep))',
          color: '#ffffff',
          boxShadow: '0 2px 8px rgba(200,0,10,0.3)',
        }}
        title="3° Lugar"
      >
        <Medal size={13} style={{ color: 'white' }} />
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold font-mono"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-sub)',
        color: 'var(--text-muted)',
      }}
    >
      {position + 1}
    </span>
  )
}

export default function TablaRanking({ ranking = [], loading = false }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortDir, setSortDir] = useState('desc')
  const [filtroRango, setFiltroRango] = useState('todos')
  const PER_PAGE = 8

  const filtered = ranking
    .filter((r) => {
      const matchName = (r.region_nombre || '').toLowerCase().includes(search.toLowerCase())
      if (!matchName) return false
      const pct = r.porcentaje_ejecucion || 0
      if (filtroRango === 'optimo') return pct >= 80
      if (filtroRango === 'medio') return pct >= 60 && pct < 80
      if (filtroRango === 'critico') return pct < 60
      return true
    })
    .sort((a, b) => sortDir === 'desc'
      ? b.porcentaje_ejecucion - a.porcentaje_ejecucion
      : a.porcentaje_ejecucion - b.porcentaje_ejecucion
    )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const pageData = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)

  const globalPos = (idx) => (currentPage - 1) * PER_PAGE + idx

  const handleExportRankingCsv = () => {
    const headers = ['Posicion', 'Region', 'PIM (S/)', 'Devengado (S/)', 'Ejecucion (%)']
    const rows = filtered.map((r, i) => [
      i + 1,
      `"${r.region_nombre || ''}"`,
      r.monto_pim || 0,
      r.monto_devengado || 0,
      `${(r.porcentaje_ejecucion || 0).toFixed(2)}%`
    ])
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ranking_regiones_gasto.csv'
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  if (loading) {
    return (
      <div className="glass-card overflow-hidden">
        <div className="p-6" style={{ borderBottom: '1px solid var(--border-sub)' }}>
          <div className="loading-skeleton h-6 w-48 mb-2" />
          <div className="loading-skeleton h-3 w-64" />
        </div>
        <div className="p-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="loading-skeleton h-14 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="p-4 sm:p-6 space-y-4" style={{ borderBottom: '1px solid var(--border-sub)', flexShrink: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="section-title">
              <Trophy size={18} style={{ color: 'var(--peru-red)' }} />
              Ranking Regional de Ejecución
            </h2>
            <p className="section-subtitle mt-0.5">
              {ranking.length} regiones ordenadas por porcentaje de ejecución presupuestal
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportRankingCsv}
              className="btn-secondary py-1.5 px-3 text-xs gap-1.5"
              title="Descargar esta tabla en CSV"
            >
              <Download size={13} style={{ color: 'var(--peru-red)' }} />
              Exportar
            </button>
            <button
              onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
              className="btn-secondary py-1.5 px-3 text-xs gap-1.5"
              title={sortDir === 'desc' ? 'Mayor a menor' : 'Menor a mayor'}
            >
              <ArrowUpDown size={13} />
              {sortDir === 'desc' ? 'Mayor %' : 'Menor %'}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'todos', label: 'Todas' },
              { id: 'optimo', label: '≥ 80%' },
              { id: 'medio', label: '60% – 80%' },
              { id: 'critico', label: '< 60%' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => { setFiltroRango(f.id); setPage(1) }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
                style={
                  filtroRango === f.id
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
              placeholder="Buscar región..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="input-field pl-8 py-1.5 text-xs w-full sm:w-48"
            />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-sub)' }}>
              <th className="table-header-cell w-14 text-center">#</th>
              <th className="table-header-cell">Región</th>
              <th className="table-header-cell text-right hidden md:table-cell">PIM</th>
              <th className="table-header-cell text-right">Devengado</th>
              <th className="table-header-cell text-center">Ejecución</th>
              <th className="table-header-cell w-20 hidden sm:table-cell"></th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Search size={24} className="mx-auto mb-2 opacity-30" />
                  No se encontraron regiones con los filtros aplicados
                </td>
              </tr>
            ) : (
              pageData.map((r, idx) => {
                const pos = globalPos(idx)
                const pct = r.porcentaje_ejecucion || 0
                const ec = getExecColor(pct)
                return (
                  <tr
                    key={r.region_id || idx}
                    className="border-b transition-colors group cursor-pointer"
                    style={{ borderColor: 'var(--border-sub)' }}
                    onClick={() => r.region_id && navigate(`/region/${r.region_id}`)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td className="table-cell text-center">
                      <div className="flex justify-center">
                        <RankBadge position={pos} />
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="font-semibold transition-colors" style={{ color: 'var(--text-primary)' }}>
                        {r.region_nombre || 'Sin nombre'}
                      </span>
                    </td>
                    <td className="table-cell hidden md:table-cell text-right font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      S/ {((r.monto_pim || 0) / 1e6).toFixed(1)}M
                    </td>
                    <td className="table-cell text-right font-mono text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      S/ {((r.monto_devengado || 0) / 1e6).toFixed(1)}M
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-col items-center gap-1.5">
                        <span
                          className="text-xs font-black px-2.5 py-1 rounded-full font-mono"
                          style={{ background: ec.bg, color: ec.text, border: `1px solid ${ec.border}` }}
                        >
                          {pct.toFixed(1)}%
                        </span>
                        <div className="progress-bar w-20" style={{ height: 4 }}>
                          <div
                            className="progress-fill"
                            style={{ width: `${Math.min(pct, 100)}%`, background: ec.text }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="table-cell hidden sm:table-cell">
                      <span className="flex items-center gap-1 text-[11px] transition-colors" style={{ color: 'var(--text-muted)' }}>
                        <ExternalLink size={11} />
                        Detalle
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderTop: '1px solid var(--border-sub)', background: 'var(--bg-elevated)', flexShrink: 0 }}
        >
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Página {currentPage} de {totalPages} · {filtered.length} regiones
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-ghost p-1.5 disabled:opacity-30"
            >
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-7 h-7 rounded-lg text-xs font-bold transition-all"
                  style={
                    currentPage === p
                      ? { background: 'linear-gradient(135deg, var(--peru-red), var(--peru-red-deep))', color: 'white' }
                      : { color: 'var(--text-muted)' }
                  }
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-ghost p-1.5 disabled:opacity-30"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
