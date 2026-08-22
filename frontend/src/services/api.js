import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || ''

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 45000,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      window.location.href = '/login'
    }
    const message =
      error.response?.data?.detail ||
      error.message ||
      'Error de conexión con el servidor'
    return Promise.reject(new Error(message))
  },
)

export const loginApi = (email, password) =>
  client.post('/api/auth/login', { email, password }).then((r) => r.data)

export const verificar2FAApi = (temp_token, codigo) =>
  client.post('/api/auth/verificar-2fa', { temp_token, codigo }).then((r) => r.data)

export const reenviarCodigoApi = (temp_token) =>
  client.post('/api/auth/reenviar-codigo', { temp_token }).then((r) => r.data)

export const getMeApi = () =>
  client.get('/api/auth/me').then((r) => r.data)

export const getKPIs = (anio) =>
  client.get('/api/gasto/kpis', { params: { anio } }).then((r) => r.data)

export const getAniosDisponibles = () =>
  client.get('/api/gasto/anios').then((r) => r.data)

export const getEvolucionMensual = (anio, regionId) =>
  client.get('/api/gasto/mensual', { params: { anio, region_id: regionId } }).then((r) => r.data)

export const getSectores = (anio, regionId, limit = 8) =>
  client.get('/api/gasto/sectores', { params: { anio, region_id: regionId, limit } }).then((r) => r.data)

export const getNiveles = (anio, regionId) =>
  client.get('/api/gasto/niveles', { params: { anio, region_id: regionId } }).then((r) => r.data)

export const getResumen = (anio) =>
  client.get('/api/gasto/resumen', { params: { anio } }).then((r) => r.data)

export const getGasto = (params) =>
  client.get('/api/gasto', { params }).then((r) => r.data)

export const getRanking = (anio) =>
  client.get('/api/gasto/ranking', { params: { anio } }).then((r) => r.data)

export const getRegiones = () =>
  client.get('/api/regiones').then((r) => r.data)

export const getDetalleRegion = (regionId, anio) =>
  client.get(`/api/regiones/${regionId}/detalle`, { params: { anio } }).then((r) => r.data)

export const getAlertas = (params) =>
  client.get('/api/alertas', { params }).then((r) => r.data)

export const getEtlLogs = (limit) =>
  client.get('/api/etl-logs', { params: { limit } }).then((r) => r.data)

export const getHealth = () =>
  client.get('/api/health').then((r) => r.data)

export const getComparativa = (region1_id, region2_id, anio) =>
  client.get('/api/gasto/comparativa', { params: { region1_id, region2_id, anio } }).then((r) => r.data)

export const getPrediccion = (regionId, anio, mesesFuturos = 3, sector = null) =>
  client.get(`/api/prediccion/${regionId}`, {
    params: { anio, meses_futuros: mesesFuturos, ...(sector ? { sector } : {}) },
  }).then((r) => r.data)

export const getModeloMetricas = (regionId = null, sector = null, limit = 100) =>
  client.get('/api/modelo-metricas', {
    params: { ...(regionId ? { region_id: regionId } : {}), ...(sector ? { sector } : {}), limit },
  }).then((r) => r.data)

export const getModeloMetricasRegiones = () =>
  client.get('/api/modelo-metricas/regiones').then((r) => r.data)

export const getModeloMetricasSectores = (regionId = null) =>
  client.get('/api/modelo-metricas/sectores', {
    params: regionId ? { region_id: regionId } : {},
  }).then((r) => r.data)


export const exportarGastoCsv = async (anio, regionId) => {
  const token = localStorage.getItem('token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await client.get('/api/gasto/exportar', {
    params: { anio, region_id: regionId },
    responseType: 'blob',
    headers,
  })
  const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `reporte_gasto_mef_${anio || 'historico'}.csv`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

export default client

