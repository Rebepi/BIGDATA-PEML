import { BrowserRouter, Routes, Route, NavLink, useLocation, Navigate, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  TrendingUp, Globe, LogOut, Database,
  Menu, X, LayoutDashboard, ChevronDown,
  Calendar, ArrowLeftRight, Download, Check,
  Sun, Moon
} from 'lucide-react'
import Dashboard from './pages/Dashboard'
import DetalleRegion from './pages/DetalleRegion'
import Login from './pages/Login'
import ErrorBoundary from './components/ErrorBoundary'
import AccessibilityFloating from './components/AccessibilityMenu'
import PeruFlag from './components/PeruFlag'
import { DashboardProvider, useDashboard } from './context/DashboardContext'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

function ThemeToggleBtn() {
  const dash = useDashboard()
  const theme = dash?.theme || 'dark'
  const toggleTheme = dash?.toggleTheme || (() => {})

  const [animating, setAnimating] = useState(false)

  const handleClick = () => {
    setAnimating(true)
    toggleTheme()
    setTimeout(() => setAnimating(false), 400)
  }

  return (
    <button
      className="btn-theme"
      onClick={handleClick}
      title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
      style={{
        animation: animating ? 'themeToggle 0.4s cubic-bezier(0.16,1,0.3,1)' : 'none',
      }}
    >
      {theme === 'dark' ? (
        <Sun size={16} style={{ color: 'var(--peru-gold-light)' }} />
      ) : (
        <Moon size={16} style={{ color: 'var(--peru-red)' }} />
      )}
    </button>
  )
}

function Navbar({ onMobileMenuToggle, mobileMenuOpen }) {
  const location = useLocation()
  const navigate = useNavigate()
  const dash = useDashboard()

  const [usuario, setUsuario] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const raw = localStorage.getItem('usuario')
    if (raw) {
      try { setUsuario(JSON.parse(raw)) } catch { setUsuario(null) }
    } else { setUsuario(null) }
  }, [location])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
    setUserMenuOpen(false)
    navigate('/login')
  }

  const handleExport = () => {
    if (!dash || dash.exportando) return
    dash.setExportando(true)
    dash.setExportSuccess(false)
    setTimeout(() => {
      dash.setExportSuccess(true)
      dash.setExportando(false)
      setTimeout(() => dash.setExportSuccess(false), 3000)
    }, 800)
  }

  const isLoginPage = location.pathname === '/login'
  const isDashboard = location.pathname === '/'

  const timeStr = currentTime.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = currentTime.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })
  const userInitial = (usuario?.nombre || usuario?.email || 'U')[0].toUpperCase()

  const anios = dash?.anios || [2026, 2025, 2024, 2023, 2022, 2021, 2020]
  const anio = dash?.anio || 2024

  return (
    <header className={`navbar-root ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-inner">
        <div className="navbar-left">
          {!isLoginPage && usuario && (
            <button
              className="navbar-mobile-menu-btn"
              onClick={onMobileMenuToggle}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}

          <div className="navbar-brand">
            <PeruFlag width={44} height={29} />
            <div className="navbar-brand-icon">
              <TrendingUp size={16} />
            </div>
            <div className="navbar-brand-text">
              <span className="navbar-brand-title">GastoPerú</span>
              <span className="navbar-brand-sep">·</span>
              <span className="navbar-brand-subtitle">Monitor Fiscal</span>
            </div>
          </div>

          {!isLoginPage && isDashboard && (
            <div
              className="navbar-title-wrap hidden lg:flex items-center gap-2 pl-3 ml-2"
              style={{ borderLeft: '1px solid var(--border-main)' }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Monitor de Ejecución del Gasto Público
              </span>
              <span className="badge-peru" style={{ fontSize: '0.6rem', padding: '2px 8px' }}>
                MEF · Datos Abiertos
              </span>
            </div>
          )}

          {!isLoginPage && !isDashboard && (
            <div className="navbar-breadcrumb">
              <span className="navbar-breadcrumb-sep">/</span>
              <span className="navbar-breadcrumb-page">
                {location.pathname.startsWith('/region/') ? 'Detalle Regional' : 'Página'}
              </span>
            </div>
          )}
        </div>

        <div className="navbar-right">
          {!isLoginPage && usuario && (
            <>
              {isDashboard && dash && (
                <div className="navbar-dashboard-controls hidden sm:flex items-center gap-1.5">
                  <div
                    className="flex items-center gap-0.5 p-0.5 rounded-xl"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-main)' }}
                  >
                    <Calendar size={11} style={{ color: 'var(--text-muted)', marginLeft: 6, marginRight: 2 }} className="hidden md:block" />
                    {anios.map((a) => (
                      <button
                        key={a}
                        onClick={() => dash.setAnio(a)}
                        className="px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all duration-150"
                        style={anio === a
                          ? {
                              background: 'linear-gradient(135deg, var(--peru-red), var(--peru-red-deep))',
                              color: 'white',
                              boxShadow: '0 2px 10px rgba(200,0,10,0.45)',
                            }
                          : { color: 'var(--text-muted)' }
                        }
                      >
                        {a}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => dash.setShowComparativa(true)}
                    className="btn-secondary py-1 px-2.5 text-xs gap-1"
                    title="Comparar dos regiones"
                  >
                    <ArrowLeftRight size={12} style={{ color: 'var(--peru-red)' }} />
                    <span className="hidden xl:inline">Comparar</span>
                  </button>

                  <button
                    onClick={handleExport}
                    disabled={dash.exportando}
                    className="btn-secondary py-1 px-2.5 text-xs gap-1"
                    title="Exportar CSV del ejercicio"
                  >
                    {dash.exportSuccess ? (
                      <>
                        <Check size={12} style={{ color: 'var(--color-success)' }} />
                        <span style={{ color: 'var(--color-success)', fontWeight: 600 }} className="text-xs">Descargado</span>
                      </>
                    ) : (
                      <>
                        <Download size={12} style={{ color: 'var(--peru-red)' }} />
                        <span className="text-xs hidden xl:inline">{dash.exportando ? '...' : 'Exportar CSV'}</span>
                      </>
                    )}
                  </button>

                  <div className="navbar-divider" />
                </div>
              )}

              <div className="navbar-clock hidden md:flex">
                <span className="navbar-clock-time">{timeStr}</span>
                <span className="navbar-clock-date">{dateStr}</span>
              </div>

              <div className="navbar-live-indicator hidden lg:flex">
                <span className="navbar-live-dot" />
                <span className="navbar-live-text">EN VIVO</span>
              </div>

              <div className="navbar-divider hidden sm:block" />
            </>
          )}

          <ThemeToggleBtn />

          {!isLoginPage && usuario && (
            <div className="navbar-user-menu-wrap">
              <button
                className="navbar-user-btn"
                onClick={() => setUserMenuOpen(o => !o)}
              >
                <div className="navbar-user-avatar">{userInitial}</div>
                <div className="navbar-user-info">
                  <span className="navbar-user-name">{usuario.nombre?.split(' ')[0] || 'Usuario'}</span>
                  <span className="navbar-user-role">Analista MEF</span>
                </div>
                <ChevronDown size={13} className={`navbar-user-chevron ${userMenuOpen ? 'navbar-user-chevron-open' : ''}`} />
              </button>

              {userMenuOpen && (
                <>
                  <div className="navbar-user-backdrop" onClick={() => setUserMenuOpen(false)} />
                  <div className="navbar-user-dropdown">
                    <div className="navbar-dropdown-header">
                      <div className="navbar-dropdown-avatar">{userInitial}</div>
                      <div>
                        <p className="navbar-dropdown-name">{usuario.nombre || 'Usuario'}</p>
                        <p className="navbar-dropdown-email">{usuario.email}</p>
                      </div>
                    </div>
                    <div className="navbar-dropdown-divider" />
                    <a
                      href="https://datosabiertos.mef.gob.pe/dataset/presupuesto-y-ejecucion-de-gasto"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="navbar-dropdown-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Database size={13} />
                      Portal de Datos MEF
                    </a>
                    <div className="navbar-dropdown-divider" />
                    <button
                      onClick={handleLogout}
                      className="navbar-dropdown-item navbar-dropdown-logout"
                    >
                      <LogOut size={13} />
                      Cerrar Sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {(isLoginPage || !usuario) && !isLoginPage && (
            <NavLink to="/login" className="btn-primary text-xs py-2 px-3">
              Acceder
            </NavLink>
          )}
        </div>
      </div>
      <div className="navbar-progress-bar" />
    </header>
  )
}

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <BrowserRouter>
      <DashboardProvider>
        <div className="app-shell">
          <Navbar
            onMobileMenuToggle={() => setMobileMenuOpen(o => !o)}
            mobileMenuOpen={mobileMenuOpen}
          />
          <div className="app-body">
            <main className="app-main">
              <ErrorBoundary>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/region/:regionId" element={<ProtectedRoute><DetalleRegion /></ProtectedRoute>} />
                  <Route
                    path="*"
                    element={
                      <div className="not-found-wrap animate-fade-in">
                        <div className="icon-box-peru icon-box w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                          <Globe size={28} />
                        </div>
                        <p className="text-5xl font-black text-gradient-peru mb-3">404</p>
                        <p className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Página no encontrada</p>
                        <p className="mb-8 text-sm" style={{ color: 'var(--text-muted)' }}>La ruta solicitada no existe en el sistema.</p>
                        <NavLink to="/" className="btn-primary">
                          <LayoutDashboard size={15} /> Volver al Dashboard
                        </NavLink>
                      </div>
                    }
                  />
                </Routes>
              </ErrorBoundary>
            </main>
          </div>
          <AccessibilityFloating />
        </div>
      </DashboardProvider>
    </BrowserRouter>
  )
}
