import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight, X, Loader2, Sparkles,
  ExternalLink, BarChart3, Layers, MapPin,
  ChevronDown, Search, Check, TrendingUp, DollarSign
} from 'lucide-react'
import { getComparativa } from '../services/api'

function CustomRegionSelect({
  regiones = [],
  selectedId,
  onSelect,
  label,
  theme = 'blue'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  const selectedRegion = regiones.find((r) => r.id === selectedId) || regiones[0]

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEsc)
      if (searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 50)
      }
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen])

  const filteredRegiones = regiones.filter((r) =>
    r.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isBlue = theme === 'blue'

  const borderGradient = isBlue
    ? 'rgba(200, 0, 10, 0.45)'
    : 'rgba(200, 150, 45, 0.45)'
  const iconColor = isBlue ? 'var(--peru-red)' : 'var(--peru-gold)'
  const iconBg = isBlue ? 'icon-box-peru' : 'icon-box-gold'
  const activeBadgeBg = isBlue
    ? 'badge-rose'
    : 'badge-amber'

  return (
    <div ref={dropdownRef} className="relative w-full min-w-0">
      <div className="flex items-center justify-between mb-1 px-0.5">
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: iconColor }}>
          {label}
        </span>
        <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Ejercicio 2024</span>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-left cursor-pointer"
        style={{
          background: 'var(--bg-elevated)',
          border: `1px solid ${isOpen ? (isBlue ? 'var(--peru-red)' : 'var(--peru-gold)') : borderGradient}`,
          boxShadow: isOpen
            ? `0 0 20px ${isBlue ? 'rgba(200, 0, 10, 0.25)' : 'rgba(200, 150, 45, 0.25)'}`
            : 'var(--shadow-card)',
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
            <MapPin size={16} style={{ color: iconColor }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm sm:text-base font-black tracking-wide truncate" style={{ color: 'var(--text-primary)' }}>
              {selectedRegion?.nombre || 'Seleccionar región'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${activeBadgeBg}`}>
            {isBlue ? 'REG A' : 'REG B'}
          </span>
          <ChevronDown
            size={16}
            style={{ color: 'var(--text-muted)' }}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-50 glass-card rounded-xl overflow-hidden animate-scale-in flex flex-col"
          style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--border-main)',
            boxShadow: 'var(--shadow-card)',
            maxHeight: '260px',
          }}
        >
          <div className="p-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-sub)', background: 'var(--bg-elevated)' }}>
            <Search size={14} className="flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar región por nombre..."
              className="w-full bg-transparent text-xs sm:text-sm placeholder-slate-500 outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 p-1.5 space-y-0.5">
            {filteredRegiones.length === 0 ? (
              <div className="py-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                No se encontraron regiones
              </div>
            ) : (
              filteredRegiones.map((r) => {
                const isSelected = r.id === selectedId
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      onSelect(r.id)
                      setIsOpen(false)
                      setSearchTerm('')
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs sm:text-sm transition-colors duration-150"
                    style={{
                      background: isSelected
                        ? isBlue
                          ? 'rgba(200, 0, 10, 0.15)'
                          : 'rgba(200, 150, 45, 0.15)'
                        : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: isSelected ? (isBlue ? 'var(--peru-red)' : 'var(--peru-gold)') : 'var(--text-muted)' }}
                      />
                      <span className="font-semibold truncate" style={{ color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {r.nombre}
                      </span>
                    </div>
                    {isSelected && (
                      <Check size={14} className="flex-shrink-0" style={{ color: isBlue ? 'var(--peru-red)' : 'var(--peru-gold)' }} />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ComparativaRegiones({ regiones = [], anio = 2024, onClose }) {
  const navigate = useNavigate()
  const [region1Id, setRegion1Id] = useState(regiones[0]?.id || 1)
  const [region2Id, setRegion2Id] = useState(regiones[1]?.id || (regiones[0]?.id ? regiones[0].id + 1 : 2))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && onClose) onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    if (!region1Id || !region2Id) return
    let isMounted = true
    setLoading(true)
    setError(null)

    getComparativa(region1Id, region2Id, anio)
      .then((res) => {
        if (isMounted) setData(res)
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'No se pudo cargar la comparativa.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => { isMounted = false }
  }, [region1Id, region2Id, anio])

  const handleSwap = () => {
    const temp = region1Id
    setRegion1Id(region2Id)
    setRegion2Id(temp)
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose()
      }}
    >
      <div
        className="glass-card w-[98vw] max-w-[1760px] max-h-[92vh] flex flex-col animate-scale-in overflow-hidden shadow-2xl"
        style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--border-main)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-sub)', background: 'var(--bg-elevated)' }}>
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl icon-box-peru flex items-center justify-center flex-shrink-0">
              <ArrowLeftRight size={20} style={{ color: 'var(--peru-red)' }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="badge-peru text-[10px] font-bold tracking-widest uppercase py-0.5 px-2">
                  Módulo de Análisis Comparativo
                </span>
                <span className="badge-slate text-[10px] py-0.5 px-2">Ejercicio Fiscal {anio}</span>
              </div>
              <h2 className="text-sm sm:text-base md:text-lg font-black tracking-tight leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
                Comparativa de Ejecución Presupuestal Regional
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={handleSwap}
              className="btn-ghost text-xs py-1.5 px-3.5 hidden sm:inline-flex items-center gap-1.5"
              style={{ color: 'var(--text-muted)' }}
              title="Invertir orden de comparación"
            >
              <ArrowLeftRight size={14} />
              <span>Invertir A ↔ B</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl transition-colors flex-shrink-0"
                style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-sub)', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5 md:p-6 overflow-y-auto flex-1 min-h-0 space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
            <div className="lg:col-span-5 flex items-center">
              <CustomRegionSelect
                regiones={regiones}
                selectedId={region1Id}
                onSelect={(id) => setRegion1Id(id)}
                label="Región Principal (A)"
                theme="blue"
              />
            </div>

            <div className="lg:col-span-2 flex flex-col items-center justify-center">
              {data && !loading ? (
                <div
                  className="w-full h-full min-h-[58px] p-2.5 rounded-xl text-center border flex flex-col justify-center items-center"
                  style={{
                    background: 'var(--bg-elevated)',
                    borderColor: 'var(--border-sub)',
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: 'var(--text-muted)' }}>
                    Brecha de Ejecución
                  </span>
                  <span className="text-lg sm:text-xl font-black font-mono text-gradient-peru block leading-tight mt-0.5">
                    {data.diferencia_porcentaje.toFixed(2)}%
                  </span>
                  <span className="text-[10px] truncate block mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {data.region1.porcentaje_ejecucion > data.region2.porcentaje_ejecucion
                      ? `${data.region1.region_nombre} lidera`
                      : data.region2.porcentaje_ejecucion > data.region1.porcentaje_ejecucion
                      ? `${data.region2.region_nombre} lidera`
                      : 'Misma tasa'}
                  </span>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-sub)', color: 'var(--text-muted)' }}>
                  VS
                </div>
              )}
            </div>

            <div className="lg:col-span-5 flex items-center">
              <CustomRegionSelect
                regiones={regiones}
                selectedId={region2Id}
                onSelect={(id) => setRegion2Id(id)}
                label="Región de Contraste (B)"
                theme="amber"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center" style={{ color: 'var(--text-muted)' }}>
              <Loader2 size={36} className="animate-spin mb-3" style={{ color: 'var(--peru-red)' }} />
              <p className="text-sm font-medium">Cruzando datos presupuestales del MEF...</p>
            </div>
          ) : error ? (
            <div
              className="p-4 rounded-xl text-center text-sm"
              style={{ background: 'rgba(200,0,10,0.08)', border: '1px solid rgba(200,0,10,0.3)', color: 'var(--peru-red)' }}
            >
              {error}
            </div>
          ) : data ? (
            <div className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[data.region1, data.region2].map((reg, idx) => {
                  const isFirst = idx === 0
                  const other = isFirst ? data.region2 : data.region1
                  const isLeader = reg.porcentaje_ejecucion >= other.porcentaje_ejecucion
                  const color = isLeader ? '#22c55e' : 'var(--peru-gold)'
                  const saldo = Math.max(0, reg.monto_pim - reg.monto_devengado)

                  return (
                    <div
                      key={reg.region_id}
                      className="p-4 sm:p-5 rounded-2xl space-y-3.5"
                      style={{
                        background: 'var(--bg-elevated)',
                        border: `1px solid ${isLeader ? 'rgba(34,197,94,0.45)' : 'var(--border-sub)'}`,
                        boxShadow: isLeader ? '0 4px 24px rgba(34,197,94,0.1)' : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between pb-2.5" style={{ borderBottom: '1px solid var(--border-sub)' }}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg ${isFirst ? 'icon-box-peru' : 'icon-box-gold'} flex items-center justify-center font-black text-xs flex-shrink-0`}>
                            {isFirst ? 'A' : 'B'}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm sm:text-base md:text-lg font-black tracking-tight leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
                              {reg.region_nombre}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isLeader ? (
                            <span className="badge-green text-[10px] font-bold py-0.5 px-2">Mayor Avance</span>
                          ) : (
                            <span className="badge-slate text-[10px] py-0.5 px-2">Comparativa</span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (onClose) onClose()
                              navigate(`/region/${reg.region_id}`)
                            }}
                            className="btn-ghost text-xs p-1.5"
                            style={{ color: 'var(--text-muted)' }}
                            title="Abrir ficha completa de esta región"
                          >
                            <ExternalLink size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="p-2.5 rounded-xl min-w-0" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-sub)' }}>
                          <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>PIM</p>
                          <p className="text-xs sm:text-sm lg:text-base font-bold font-mono mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                            S/ {(reg.monto_pim / 1e6).toFixed(1)}M
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl min-w-0" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-sub)' }}>
                          <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Devengado</p>
                          <p className="text-xs sm:text-sm lg:text-base font-bold text-adaptive-success font-mono mt-0.5 truncate">
                            S/ {(reg.monto_devengado / 1e6).toFixed(1)}M
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl min-w-0" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-sub)' }}>
                          <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Girado</p>
                          <p className="text-xs sm:text-sm lg:text-base font-bold font-mono mt-0.5 truncate" style={{ color: 'var(--color-gold)' }}>
                            S/ {(reg.monto_girado / 1e6).toFixed(1)}M
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl min-w-0" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-sub)' }}>
                          <p className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Ejecución</p>
                          <p className="text-xs sm:text-sm lg:text-base font-black font-mono mt-0.5 truncate" style={{ color }}>
                            {reg.porcentaje_ejecucion.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1 font-medium">
                          <span style={{ color: 'var(--text-muted)' }}>Progreso presupuestal</span>
                          <span className="font-bold font-mono text-xs" style={{ color }}>
                            {reg.porcentaje_ejecucion.toFixed(1)}%
                          </span>
                        </div>
                        <div className="progress-bar" style={{ height: 6 }}>
                          <div
                            className="progress-fill"
                            style={{ width: `${Math.min(reg.porcentaje_ejecucion, 100)}%`, background: color }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] mt-1 flex-wrap gap-1" style={{ color: 'var(--text-muted)' }}>
                          <span>Saldo restante: S/ {(saldo / 1e6).toFixed(1)}M</span>
                          <span>Pagado: {reg.monto_devengado > 0 ? ((reg.monto_girado / reg.monto_devengado) * 100).toFixed(1) : 0}%</span>
                        </div>
                      </div>

                      {reg.top_sectores && reg.top_sectores.length > 0 && (
                        <div className="pt-2" style={{ borderTop: '1px solid var(--border-sub)' }}>
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                            <Layers size={12} style={{ color: 'var(--peru-red)' }} />
                            Principales Sectores de Inversión
                          </p>
                          <div className="space-y-1.5">
                            {reg.top_sectores.slice(0, 3).map((s) => {
                              const maxDev = reg.top_sectores[0]?.monto_devengado || 1
                              const barW = (s.monto_devengado / maxDev) * 100
                              return (
                                <div key={s.sector} className="space-y-0.5">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-medium truncate max-w-[200px] sm:max-w-[280px]" style={{ color: 'var(--text-secondary)' }}>
                                      {s.sector}
                                    </span>
                                    <span className="font-mono font-semibold text-[10px] flex-shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>
                                      S/ {(s.monto_devengado / 1e6).toFixed(1)}M ({s.porcentaje_ejecucion.toFixed(0)}%)
                                    </span>
                                  </div>
                                  <div className="progress-bar" style={{ height: 3 }}>
                                    <div
                                      className="progress-fill"
                                      style={{ width: `${barW}%`, background: 'linear-gradient(90deg, var(--peru-red), var(--peru-gold))' }}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="glass-card overflow-hidden">
                <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-sub)', background: 'var(--bg-elevated)' }}>
                  <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                    <BarChart3 size={14} style={{ color: 'var(--peru-red)' }} />
                    Tabla Comparativa Directa de Indicadores
                  </h4>
                  <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>Valores en Millones de Soles (PEN)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-sub)' }}>
                        <th className="table-header-cell py-2">Indicador Presupuestal</th>
                        <th className="table-header-cell py-2 text-right" style={{ color: 'var(--peru-red)' }}>{data.region1.region_nombre} (A)</th>
                        <th className="table-header-cell py-2 text-right" style={{ color: 'var(--peru-gold)' }}>{data.region2.region_nombre} (B)</th>
                        <th className="table-header-cell py-2 text-right">Diferencia Absoluta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border-sub)' }}>
                      <tr>
                        <td className="table-cell py-2 font-medium" style={{ color: 'var(--text-secondary)' }}>Presupuesto PIM</td>
                        <td className="table-cell py-2 text-right font-mono" style={{ color: 'var(--text-primary)' }}>S/ {(data.region1.monto_pim / 1e6).toFixed(2)}M</td>
                        <td className="table-cell py-2 text-right font-mono" style={{ color: 'var(--text-primary)' }}>S/ {(data.region2.monto_pim / 1e6).toFixed(2)}M</td>
                        <td className="table-cell py-2 text-right font-mono" style={{ color: 'var(--text-muted)' }}>S/ {(Math.abs(data.region1.monto_pim - data.region2.monto_pim) / 1e6).toFixed(2)}M</td>
                      </tr>
                      <tr>
                        <td className="table-cell py-2 font-medium" style={{ color: 'var(--text-secondary)' }}>Monto Devengado (Gasto)</td>
                        <td className="table-cell py-2 text-right font-mono text-adaptive-success font-semibold">S/ {(data.region1.monto_devengado / 1e6).toFixed(2)}M</td>
                        <td className="table-cell py-2 text-right font-mono text-adaptive-success font-semibold">S/ {(data.region2.monto_devengado / 1e6).toFixed(2)}M</td>
                        <td className="table-cell py-2 text-right font-mono" style={{ color: 'var(--text-muted)' }}>S/ {(Math.abs(data.region1.monto_devengado - data.region2.monto_devengado) / 1e6).toFixed(2)}M</td>
                      </tr>
                      <tr>
                        <td className="table-cell py-2 font-medium" style={{ color: 'var(--text-secondary)' }}>Monto Girado (Pagos Efectivos)</td>
                        <td className="table-cell py-2 text-right font-mono font-semibold" style={{ color: 'var(--color-gold)' }}>S/ {(data.region1.monto_girado / 1e6).toFixed(2)}M</td>
                        <td className="table-cell py-2 text-right font-mono font-semibold" style={{ color: 'var(--color-gold)' }}>S/ {(data.region2.monto_girado / 1e6).toFixed(2)}M</td>
                        <td className="table-cell py-2 text-right font-mono" style={{ color: 'var(--text-muted)' }}>S/ {(Math.abs(data.region1.monto_girado - data.region2.monto_girado) / 1e6).toFixed(2)}M</td>
                      </tr>
                      <tr>
                        <td className="table-cell py-2 font-medium" style={{ color: 'var(--text-secondary)' }}>Saldo Pendiente por Ejecutar</td>
                        <td className="table-cell py-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>S/ {(Math.max(0, data.region1.monto_pim - data.region1.monto_devengado) / 1e6).toFixed(2)}M</td>
                        <td className="table-cell py-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>S/ {(Math.max(0, data.region2.monto_pim - data.region2.monto_devengado) / 1e6).toFixed(2)}M</td>
                        <td className="table-cell py-2 text-right font-mono" style={{ color: 'var(--text-muted)' }}>
                          S/ {(Math.abs(Math.max(0, data.region1.monto_pim - data.region1.monto_devengado) - Math.max(0, data.region2.monto_pim - data.region2.monto_devengado)) / 1e6).toFixed(2)}M
                        </td>
                      </tr>
                      <tr style={{ background: 'rgba(200,0,10,0.06)' }}>
                        <td className="table-cell py-2 font-bold" style={{ color: 'var(--text-primary)' }}>Tasa de Ejecución Presupuestal (%)</td>
                        <td className="table-cell py-2 text-right font-mono font-bold text-xs sm:text-sm" style={{ color: 'var(--peru-red)' }}>{data.region1.porcentaje_ejecucion.toFixed(2)}%</td>
                        <td className="table-cell py-2 text-right font-mono font-bold text-xs sm:text-sm" style={{ color: 'var(--color-gold)' }}>{data.region2.porcentaje_ejecucion.toFixed(2)}%</td>
                        <td className="table-cell py-2 text-right font-mono font-bold text-adaptive-success text-xs sm:text-sm">{data.diferencia_porcentaje.toFixed(2)}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="px-5 py-3 flex items-center justify-between flex-shrink-0" style={{ borderTop: '1px solid var(--border-sub)', background: 'var(--bg-elevated)' }}>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Fuente de Datos: Ministerio de Economía y Finanzas (MEF) &bull; Datos Abiertos de Consulta Amigable
          </p>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs py-1.5 px-4"
          >
            Cerrar Comparativa
          </button>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent
}
