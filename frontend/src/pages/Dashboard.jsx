import { useState, useEffect } from 'react'
import {
  DollarSign, TrendingUp, Activity, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Minus, PieChart, ShieldCheck
} from 'lucide-react'
import MapaRegiones from '../components/MapaRegiones'
import GraficoEjecucion from '../components/GraficoEjecucion'
import GraficoSectores from '../components/GraficoSectores'
import GraficoNiveles from '../components/GraficoNiveles'
import TablaRanking from '../components/TablaRanking'
import PanelAlertas from '../components/PanelAlertas'
import PanelETLLogs from '../components/PanelETLLogs'
import ComparativaRegiones from '../components/ComparativaRegiones'
import ComparativaModelos from '../components/ComparativaModelos'
import ErrorBoundary from '../components/ErrorBoundary'
import Sidebar from '../components/Sidebar'
import PeruFlag from '../components/PeruFlag'
import { useDashboard } from '../context/DashboardContext'
import {
  MOCK_ANIOS, MOCK_KPIS, MOCK_RESUMEN, MOCK_RANKING,
  MOCK_REGIONES, MOCK_ALERTAS, MOCK_MENSUAL,
  MOCK_SECTORES, MOCK_NIVELES, MOCK_PREDICCION
} from '../data/mockData'

function KPICard({ label, value, sub, icon: Icon, color, trend, trendLabel, delay = 0 }) {
  const config = {
    blue:  { card: 'kpi-card-blue',  icon: 'icon-box-peru',  value: 'text-gradient-peru',  trend: 'var(--peru-red)' },
    green: { card: 'kpi-card-green', icon: 'icon-box-green', value: 'text-gradient-green', trend: 'var(--color-success)' },
    amber: { card: 'kpi-card-amber', icon: 'icon-box-gold',  value: 'text-gradient-gold',  trend: 'var(--color-gold)' },
    rose:  { card: 'kpi-card-rose',  icon: 'icon-box-peru',  value: 'text-gradient-peru',  trend: 'var(--color-danger)' },
  }[color] || { card: 'kpi-card-blue', icon: 'icon-box-peru', value: 'text-gradient-peru', trend: 'var(--peru-red)' }

  return (
    <div
      className={`${config.card} animate-scale-in flex flex-col justify-between`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontSize: '0.63rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {label}
          </span>
          <div className={`${config.icon} icon-box w-9 h-9`}><Icon size={16} /></div>
        </div>
        <p
          className={`text-2xl sm:text-3xl font-black tracking-tight ${config.value}`}
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          {value}
        </p>
      </div>
      <div style={{ paddingTop: '0.6rem', marginTop: '0.6rem', borderTop: '1px solid var(--border-sub)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {sub && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</p>}
        {trend && (
          <span style={{ fontSize: '0.68rem', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto', flexShrink: 0, color: config.trend }}>
            {trend === 'up'      && <ArrowUpRight size={13} />}
            {trend === 'down'    && <ArrowDownRight size={13} />}
            {trend === 'neutral' && <Minus size={13} />}
            {trendLabel}
          </span>
        )}
      </div>
    </div>
  )
}

function MiniStatCard({ label, value, color, icon: Icon }) {
  return (
    <div
      style={{ padding: '0.9rem 1rem', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border-sub)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.2s ease' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-sub)'}
    >
      <div>
        <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--peru-red)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</p>
        <p style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: 2, fontFamily: 'JetBrains Mono, monospace', color: color || 'var(--text-secondary)' }}>{value}</p>
      </div>
      {Icon && (
        <div className="icon-box-peru icon-box" style={{ width: 34, height: 34 }}>
          <Icon size={15} />
        </div>
      )}
    </div>
  )
}

function DashboardHero({ anio, pctGlobal, loading }) {
  return (
    <div style={{
      position: 'relative',
      padding: '0.9rem 1.1rem 0.8rem',
      borderRadius: 18,
      background: 'var(--glass-bg)',
      border: '1px solid var(--border-main)',
      overflow: 'hidden',
      flexShrink: 0,
      marginBottom: '0.85rem',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,0,10,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -30, left: '40%', width: 200, height: 80, background: 'radial-gradient(ellipse, rgba(200,150,45,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <PeruFlag width={42} height={28} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', fontFamily: 'Outfit, sans-serif' }}>
                Monitor de Ejecución del Gasto Público
              </h2>
              <span className="badge-peru" style={{ fontSize: '0.6rem' }}>Tiempo Real</span>
            </div>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Ministerio de Economía y Finanzas · Ejercicio Fiscal {anio}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem 0.9rem', borderRadius: 12, background: 'rgba(200,0,10,0.07)', border: '1px solid rgba(200,0,10,0.18)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.58rem', fontWeight: 700, color: 'var(--peru-red)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ejecución Global</p>
            <p className="text-gradient-peru" style={{ fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.1, fontFamily: 'JetBrains Mono, monospace' }}>
              {loading ? '—' : `${pctGlobal.toFixed(1)}%`}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.75rem', borderRadius: 999, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'block', animation: 'livePulse 2.5s ease-in-out infinite' }} />
            <span className="text-adaptive-success" style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em' }}>EN VIVO</span>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--peru-red) 0%, var(--peru-gold) 50%, var(--peru-red) 100%)', backgroundSize: '200% 100%', animation: 'progressFlow 4s ease infinite', opacity: 0.5 }} />
    </div>
  )
}

export default function Dashboard() {
  const dash = useDashboard()
  const anio            = dash?.anio            || 2024
  const setAnios        = dash?.setAnios        || (() => {})
  const tabActiva       = dash?.tabActiva       || 'resumen'
  const showComparativa     = dash?.showComparativa     || false
  const setShowComparativa  = dash?.setShowComparativa  || (() => {})
  const setAlertCount   = dash?.setAlertCount   || (() => {})
  const sidebarCollapsed = dash?.sidebarCollapsed || false

  const [loading] = useState(false)
  const [kpis]       = useState(MOCK_KPIS)
  const [resumen]    = useState(MOCK_RESUMEN)
  const [ranking]    = useState(MOCK_RANKING)
  const [regiones]   = useState(MOCK_REGIONES)
  const [alertas]    = useState(MOCK_ALERTAS)
  const [mensual]    = useState(MOCK_MENSUAL)
  const [sectores]   = useState(MOCK_SECTORES)
  const [niveles]    = useState(MOCK_NIVELES)
  const [prediccion] = useState(MOCK_PREDICCION)

  useEffect(() => {
    setAnios(MOCK_ANIOS)
    setAlertCount(MOCK_ALERTAS.length)
  }, [setAnios, setAlertCount])

  const totalPim  = kpis?.total_pim            ?? 0
  const totalDev  = kpis?.total_devengado      ?? 0
  const totalGir  = kpis?.total_girado         ?? 0
  const pctGlobal = kpis?.porcentaje_ejecucion ?? 0
  const brechaPresupuestal = Math.max(0, totalPim - totalDev)

  const leftPad = `calc(${sidebarCollapsed ? 68 : 244}px + 0.9rem)`

  return (
    <div className="dashboard-shell">
      <Sidebar />

      <div
        className="dashboard-content animate-fade-in"
        style={{ paddingLeft: leftPad, transition: 'padding-left 0.3s cubic-bezier(0.16,1,0.3,1)' }}
      >

        <ErrorBoundary>
          {tabActiva === 'resumen' && (
            <div className="space-y-4 animate-fade-in flex-1 overflow-y-auto pr-1 pb-4">
              <DashboardHero anio={anio} pctGlobal={pctGlobal} loading={loading} />

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <KPICard label="Presupuesto PIM" value={loading ? '—' : `S/ ${(totalPim/1e6).toFixed(1)}M`} sub="Presupuesto Institucional Modificado" icon={DollarSign} color="blue" trend="up" trendLabel={`Año ${anio}`} delay={0} />
                <KPICard label="Monto Devengado" value={loading ? '—' : `S/ ${(totalDev/1e6).toFixed(1)}M`} sub="Gasto ejecutado y reconocido" icon={TrendingUp} color="green" trend={pctGlobal >= 75 ? 'up' : 'neutral'} trendLabel={`${pctGlobal.toFixed(1)}% meta`} delay={80} />
                <KPICard label="Tasa de Ejecución" value={loading ? '—' : `${pctGlobal.toFixed(1)}%`} sub={pctGlobal >= 75 ? 'Nivel de avance óptimo' : pctGlobal >= 50 ? 'Nivel regular' : 'Alerta: avance bajo'} icon={Activity} color={pctGlobal >= 75 ? 'green' : pctGlobal >= 50 ? 'amber' : 'rose'} trend={pctGlobal >= 75 ? 'up' : 'down'} trendLabel={pctGlobal >= 75 ? 'Óptimo' : 'Bajo'} delay={160} />
                <KPICard label="Alertas Activas" value={loading ? '—' : alertas.length} sub="Anomalías presupuestales detectadas" icon={AlertTriangle} color={alertas.length === 0 ? 'green' : alertas.length < 5 ? 'amber' : 'rose'} trend={alertas.length > 0 ? 'down' : 'neutral'} trendLabel={alertas.length > 0 ? `${alertas.length} alertas` : 'Sin alertas'} delay={240} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <MiniStatCard label="Brecha Presupuestal" value={`S/ ${(brechaPresupuestal/1e6).toFixed(2)}M por devengar`} icon={PieChart} />
                <MiniStatCard label="Monto Girado Total" value={`S/ ${(totalGir/1e6).toFixed(2)}M pagados`} color="var(--color-success)" icon={ShieldCheck} />
                <MiniStatCard label="Ratio Girado / Devengado" value={`${totalDev > 0 ? ((totalGir/totalDev)*100).toFixed(1) : 0}% completado`} color="var(--color-gold)" icon={TrendingUp} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <GraficoEjecucion data={mensual} prediccion={prediccion} />
                <GraficoSectores data={sectores} />
              </div>
              <GraficoNiveles data={niveles} />
            </div>
          )}

          {tabActiva === 'mapa' && (
            <div className="animate-fade-in flex-1 flex flex-col min-h-0 overflow-hidden">
              <MapaRegiones regiones={regiones} resumen={resumen} anio={anio} />
            </div>
          )}

          {tabActiva === 'ranking' && (
            <div className="animate-fade-in flex-1 flex flex-col min-h-0 overflow-hidden">
              <TablaRanking ranking={ranking} loading={loading} />
            </div>
          )}

          {tabActiva === 'alertas' && (
            <div className="animate-fade-in flex-1 flex flex-col min-h-0 overflow-hidden">
              <PanelAlertas alertas={alertas} loading={loading} />
            </div>
          )}

          {tabActiva === 'etl' && (
            <div className="animate-fade-in flex-1 flex flex-col min-h-0 overflow-hidden">
              <PanelETLLogs />
            </div>
          )}

          {tabActiva === 'ml' && (
            <div className="animate-fade-in flex-1 flex flex-col min-h-0 overflow-hidden">
              <ComparativaModelos />
            </div>
          )}
        </ErrorBoundary>

        {showComparativa && (
          <ComparativaRegiones regiones={regiones} anio={anio} onClose={() => setShowComparativa(false)} />
        )}
      </div>
    </div>
  )
}
