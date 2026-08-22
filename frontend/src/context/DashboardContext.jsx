import { createContext, useContext, useState, useEffect } from 'react'

const DashboardContext = createContext(null)

export function DashboardProvider({ children }) {
  const [anios, setAnios] = useState([2026, 2025, 2024, 2023, 2022, 2021, 2020])
  const [anio, setAnio] = useState(2024)
  const [tabActiva, setTabActiva] = useState('resumen')
  const [showComparativa, setShowComparativa] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('gp-theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('gp-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <DashboardContext.Provider
      value={{
        anios, setAnios,
        anio, setAnio,
        tabActiva, setTabActiva,
        showComparativa, setShowComparativa,
        exportando, setExportando,
        exportSuccess, setExportSuccess,
        alertCount, setAlertCount,
        sidebarCollapsed, setSidebarCollapsed,
        theme, toggleTheme,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  return useContext(DashboardContext)
}
