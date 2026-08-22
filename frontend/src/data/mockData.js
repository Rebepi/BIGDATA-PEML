export const MOCK_ANIOS = [2026, 2025, 2024, 2023, 2022, 2021, 2020]

export const MOCK_KPIS = {
  total_pim: 48320000000,
  total_devengado: 39142800000,
  total_girado: 37284500000,
  porcentaje_ejecucion: 81.0,
}

export const MOCK_RESUMEN = [
  { region_id: 1, region_nombre: 'Amazonas', monto_pim: 980000000, monto_devengado: 724800000, monto_girado: 698400000, porcentaje_ejecucion: 73.9 },
  { region_id: 2, region_nombre: 'Ancash', monto_pim: 1840000000, monto_devengado: 1509800000, monto_girado: 1447200000, porcentaje_ejecucion: 82.1 },
  { region_id: 3, region_nombre: 'Apurimac', monto_pim: 1120000000, monto_devengado: 851200000, monto_girado: 813000000, porcentaje_ejecucion: 76.0 },
  { region_id: 4, region_nombre: 'Arequipa', monto_pim: 2950000000, monto_devengado: 2566500000, monto_girado: 2441700000, porcentaje_ejecucion: 87.0 },
  { region_id: 5, region_nombre: 'Ayacucho', monto_pim: 1290000000, monto_devengado: 1006200000, monto_girado: 962900000, porcentaje_ejecucion: 78.0 },
  { region_id: 6, region_nombre: 'Cajamarca', monto_pim: 2100000000, monto_devengado: 1596000000, monto_girado: 1530900000, porcentaje_ejecucion: 76.0 },
  { region_id: 7, region_nombre: 'Callao', monto_pim: 1760000000, monto_devengado: 1548800000, monto_girado: 1476200000, porcentaje_ejecucion: 88.0 },
  { region_id: 8, region_nombre: 'Cusco', monto_pim: 2680000000, monto_devengado: 2144000000, monto_girado: 2049400000, porcentaje_ejecucion: 80.0 },
  { region_id: 9, region_nombre: 'Huancavelica', monto_pim: 960000000, monto_devengado: 691200000, monto_girado: 657600000, porcentaje_ejecucion: 72.0 },
  { region_id: 10, region_nombre: 'Huanuco', monto_pim: 1380000000, monto_devengado: 1021200000, monto_girado: 980500000, porcentaje_ejecucion: 74.0 },
  { region_id: 11, region_nombre: 'Ica', monto_pim: 1560000000, monto_devengado: 1388400000, monto_girado: 1326100000, porcentaje_ejecucion: 89.0 },
  { region_id: 12, region_nombre: 'Junin', monto_pim: 2230000000, monto_devengado: 1806300000, monto_girado: 1726000000, porcentaje_ejecucion: 81.0 },
  { region_id: 13, region_nombre: 'La Libertad', monto_pim: 2870000000, monto_devengado: 2382100000, monto_girado: 2269700000, porcentaje_ejecucion: 83.0 },
  { region_id: 14, region_nombre: 'Lambayeque', monto_pim: 1980000000, monto_devengado: 1603800000, monto_girado: 1528900000, porcentaje_ejecucion: 81.0 },
  { region_id: 15, region_nombre: 'Lima', monto_pim: 9400000000, monto_devengado: 8366000000, monto_girado: 7982400000, porcentaje_ejecucion: 89.0 },
  { region_id: 16, region_nombre: 'Loreto', monto_pim: 1650000000, monto_devengado: 1221000000, monto_girado: 1166500000, porcentaje_ejecucion: 74.0 },
  { region_id: 17, region_nombre: 'Madre de Dios', monto_pim: 580000000, monto_devengado: 478500000, monto_girado: 456200000, porcentaje_ejecucion: 82.5 },
  { region_id: 18, region_nombre: 'Moquegua', monto_pim: 890000000, monto_devengado: 800100000, monto_girado: 762300000, porcentaje_ejecucion: 89.9 },
  { region_id: 19, region_nombre: 'Pasco', monto_pim: 720000000, monto_devengado: 518400000, monto_girado: 494200000, porcentaje_ejecucion: 72.0 },
  { region_id: 20, region_nombre: 'Piura', monto_pim: 2740000000, monto_devengado: 2247200000, monto_girado: 2148400000, porcentaje_ejecucion: 82.0 },
  { region_id: 21, region_nombre: 'Puno', monto_pim: 2060000000, monto_devengado: 1606800000, monto_girado: 1528500000, porcentaje_ejecucion: 78.0 },
  { region_id: 22, region_nombre: 'San Martin', monto_pim: 1310000000, monto_devengado: 1034900000, monto_girado: 987100000, porcentaje_ejecucion: 79.0 },
  { region_id: 23, region_nombre: 'Tacna', monto_pim: 870000000, monto_devengado: 783000000, monto_girado: 748500000, porcentaje_ejecucion: 90.0 },
  { region_id: 24, region_nombre: 'Tumbes', monto_pim: 640000000, monto_devengado: 499200000, monto_girado: 476400000, porcentaje_ejecucion: 78.0 },
  { region_id: 25, region_nombre: 'Ucayali', monto_pim: 980000000, monto_devengado: 749700000, monto_girado: 715200000, porcentaje_ejecucion: 76.5 },
]

export const MOCK_REGIONES = MOCK_RESUMEN.map(r => ({ id: r.region_id, nombre: r.region_nombre }))

export const MOCK_RANKING = [...MOCK_RESUMEN]
  .sort((a, b) => b.porcentaje_ejecucion - a.porcentaje_ejecucion)
  .map((r, i) => ({ ...r, ranking: i + 1 }))

export const MOCK_MENSUAL = [
  { mes: 1, mes_nombre: 'Enero', monto_pim: 3850000000, monto_devengado: 1540000000, monto_girado: 1452000000, porcentaje_ejecucion: 40.0 },
  { mes: 2, mes_nombre: 'Febrero', monto_pim: 3850000000, monto_devengado: 2695000000, monto_girado: 2541000000, porcentaje_ejecucion: 70.0 },
  { mes: 3, mes_nombre: 'Marzo', monto_pim: 3850000000, monto_devengado: 2772000000, monto_girado: 2618000000, porcentaje_ejecucion: 72.0 },
  { mes: 4, mes_nombre: 'Abril', monto_pim: 3980000000, monto_devengado: 2986000000, monto_girado: 2818000000, porcentaje_ejecucion: 75.0 },
  { mes: 5, mes_nombre: 'Mayo', monto_pim: 4020000000, monto_devengado: 3176000000, monto_girado: 2994000000, porcentaje_ejecucion: 79.0 },
  { mes: 6, mes_nombre: 'Junio', monto_pim: 4020000000, monto_devengado: 3176000000, monto_girado: 2994000000, porcentaje_ejecucion: 79.0 },
  { mes: 7, mes_nombre: 'Julio', monto_pim: 4100000000, monto_devengado: 3362000000, monto_girado: 3189000000, porcentaje_ejecucion: 82.0 },
  { mes: 8, mes_nombre: 'Agosto', monto_pim: 4100000000, monto_devengado: 3485000000, monto_girado: 3302000000, porcentaje_ejecucion: 85.0 },
  { mes: 9, mes_nombre: 'Septiembre', monto_pim: 4200000000, monto_devengado: 3486000000, monto_girado: 3302000000, porcentaje_ejecucion: 83.0 },
  { mes: 10, mes_nombre: 'Octubre', monto_pim: 4200000000, monto_devengado: 3528000000, monto_girado: 3340000000, porcentaje_ejecucion: 84.0 },
  { mes: 11, mes_nombre: 'Noviembre', monto_pim: 4250000000, monto_devengado: 3612500000, monto_girado: 3429000000, porcentaje_ejecucion: 85.0 },
  { mes: 12, mes_nombre: 'Diciembre', monto_pim: 4250000000, monto_devengado: 3655000000, monto_girado: 3468000000, porcentaje_ejecucion: 86.0 },
]

export const MOCK_SECTORES = [
  { sector: 'Educacion', monto_pim: 12400000000, monto_devengado: 10788000000, porcentaje_ejecucion: 87.0 },
  { sector: 'Salud', monto_pim: 8900000000, monto_devengado: 7476000000, porcentaje_ejecucion: 84.0 },
  { sector: 'Transporte', monto_pim: 6700000000, monto_devengado: 5226000000, porcentaje_ejecucion: 78.0 },
  { sector: 'Agricultura', monto_pim: 3200000000, monto_devengado: 2368000000, porcentaje_ejecucion: 74.0 },
  { sector: 'Vivienda', monto_pim: 2900000000, monto_devengado: 2059000000, porcentaje_ejecucion: 71.0 },
  { sector: 'Interior', monto_pim: 4800000000, monto_devengado: 3984000000, porcentaje_ejecucion: 83.0 },
  { sector: 'Energia y Minas', monto_pim: 2100000000, monto_devengado: 1659000000, porcentaje_ejecucion: 79.0 },
  { sector: 'Ambiente', monto_pim: 1320000000, monto_devengado: 936720000, porcentaje_ejecucion: 71.0 },
]

export const MOCK_NIVELES = [
  { nivel: 'Gobierno Nacional', monto_pim: 28400000000, monto_devengado: 24140000000, porcentaje_ejecucion: 85.0 },
  { nivel: 'Gobierno Regional', monto_pim: 13200000000, monto_devengado: 10032000000, porcentaje_ejecucion: 76.0 },
  { nivel: 'Gobierno Local', monto_pim: 6720000000, monto_devengado: 4973000000, porcentaje_ejecucion: 74.0 },
]

export const MOCK_ALERTAS = [
  { id: 1, tipo_alerta: 'ejecucion_baja', descripcion: 'Amazonas presenta ejecucion por debajo del 75% - riesgo de subejecucion al cierre del ejercicio.', monto_relacionado: 255200000, region: { id: 1, nombre: 'Amazonas' }, fecha: '2024-11-15', anio: 2024 },
  { id: 2, tipo_alerta: 'gasto_atipico', descripcion: 'Pasco registra caida atipica del 18% en devengado respecto al mes anterior, posible bloqueo presupuestal.', monto_relacionado: 93600000, region: { id: 19, nombre: 'Pasco' }, fecha: '2024-10-28', anio: 2024 },
  { id: 3, tipo_alerta: 'ejecucion_baja', descripcion: 'Huancavelica alcanza solo el 72% de ejecucion, requiere aceleracion urgente en los sectores de salud y transporte.', monto_relacionado: 268800000, region: { id: 9, nombre: 'Huancavelica' }, fecha: '2024-11-02', anio: 2024 },
  { id: 4, tipo_alerta: 'gasto_atipico', descripcion: 'Cajamarca presenta pico de gasto no planificado en el sector Vivienda durante el mes de octubre.', monto_relacionado: 142000000, region: { id: 6, nombre: 'Cajamarca' }, fecha: '2024-10-31', anio: 2024 },
  { id: 5, tipo_alerta: 'advertencia', descripcion: 'San Martin muestra retraso en la certificacion de creditos presupuestales para el cuarto trimestre.', monto_relacionado: 78500000, region: { id: 22, nombre: 'San Martin' }, fecha: '2024-11-10', anio: 2024 },
  { id: 6, tipo_alerta: 'ejecucion_baja', descripcion: 'Loreto registra deficit de ejecucion en sector Transporte (52%) comprometiendo obras de infraestructura vial.', monto_relacionado: 188400000, region: { id: 16, nombre: 'Loreto' }, fecha: '2024-11-08', anio: 2024 },
  { id: 7, tipo_alerta: 'advertencia', descripcion: 'Ucayali presenta variacion interanual negativa del 9.3% en el monto devengado frente al ejercicio 2023.', monto_relacionado: 68300000, region: { id: 25, nombre: 'Ucayali' }, fecha: '2024-11-05', anio: 2024 },
]

export const MOCK_ETL_LOGS = [
  { id: 1, estado: 'EXITOSO', fecha_ejecucion: '2024-11-20T03:00:00Z', origen_datos: 'MEF API / SIAF', filas_procesadas: 485200, filas_descartadas: 1240, filas_corregidas: 8730, detalle_error: null },
  { id: 2, estado: 'EXITOSO', fecha_ejecucion: '2024-11-19T03:00:00Z', origen_datos: 'MEF API / SIAF', filas_procesadas: 481800, filas_descartadas: 920, filas_corregidas: 7420, detalle_error: null },
  { id: 3, estado: 'EXITOSO', fecha_ejecucion: '2024-11-18T03:00:00Z', origen_datos: 'MEF CSV / Datos Abiertos', filas_procesadas: 479100, filas_descartadas: 1560, filas_corregidas: 9100, detalle_error: null },
  { id: 4, estado: 'ERROR', fecha_ejecucion: '2024-11-17T03:00:00Z', origen_datos: 'MEF API / SIAF', filas_procesadas: 0, filas_descartadas: 0, filas_corregidas: 0, detalle_error: 'Timeout al conectar con el servicio SIAF - reintentado a las 04:15 UTC.' },
  { id: 5, estado: 'EXITOSO', fecha_ejecucion: '2024-11-17T04:15:00Z', origen_datos: 'MEF API / SIAF', filas_procesadas: 477500, filas_descartadas: 1100, filas_corregidas: 6850, detalle_error: null },
  { id: 6, estado: 'EXITOSO', fecha_ejecucion: '2024-11-16T03:00:00Z', origen_datos: 'MEF CSV / Datos Abiertos', filas_procesadas: 475300, filas_descartadas: 880, filas_corregidas: 7200, detalle_error: null },
  { id: 7, estado: 'EXITOSO', fecha_ejecucion: '2024-11-15T03:00:00Z', origen_datos: 'MEF API / SIAF', filas_procesadas: 472900, filas_descartadas: 1340, filas_corregidas: 8010, detalle_error: null },
  { id: 8, estado: 'EXITOSO', fecha_ejecucion: '2024-11-14T03:00:00Z', origen_datos: 'MEF CSV / Datos Abiertos', filas_procesadas: 469700, filas_descartadas: 790, filas_corregidas: 6540, detalle_error: null },
  { id: 9, estado: 'ERROR', fecha_ejecucion: '2024-11-13T03:00:00Z', origen_datos: 'MEF API / SIAF', filas_procesadas: 0, filas_descartadas: 0, filas_corregidas: 0, detalle_error: 'Error 503 en endpoint /api/gasto - servidor MEF en mantenimiento programado.' },
  { id: 10, estado: 'EXITOSO', fecha_ejecucion: '2024-11-12T03:00:00Z', origen_datos: 'MEF API / SIAF', filas_procesadas: 466100, filas_descartadas: 1020, filas_corregidas: 7890, detalle_error: null },
  { id: 11, estado: 'EXITOSO', fecha_ejecucion: '2024-11-11T03:00:00Z', origen_datos: 'MEF CSV / Datos Abiertos', filas_procesadas: 463400, filas_descartadas: 870, filas_corregidas: 6710, detalle_error: null },
  { id: 12, estado: 'EXITOSO', fecha_ejecucion: '2024-11-10T03:00:00Z', origen_datos: 'MEF API / SIAF', filas_procesadas: 460800, filas_descartadas: 1130, filas_corregidas: 8240, detalle_error: null },
]

export const MOCK_PREDICCION = {
  region_id: 0,
  region: 'Nacional',
  anio: 2024,
  modelo: 'GradientBoosting',
  tendencia: 'CRECIENTE',
  r2_score: 0.8621,
  mae: 124500000,
  rmse: 189300000,
  confiabilidad: 'ALTA',
  advertencia: null,
  anio_validacion: 2023,
  comparativa_modelos: [
    { nombre: 'GradientBoosting', r2_score: 0.8621, mae: 124500000, rmse: 189300000, es_mejor: true },
    { nombre: 'RandomForest', r2_score: 0.8204, mae: 148700000, rmse: 212600000, es_mejor: false },
    { nombre: 'Ridge', r2_score: 0.6847, mae: 198400000, rmse: 274100000, es_mejor: false },
  ],
  puntos: [
    { mes: 1, mes_nombre: 'Enero', monto_devengado: 1540000000, monto_proyectado: null, es_proyeccion: false },
    { mes: 2, mes_nombre: 'Febrero', monto_devengado: 2695000000, monto_proyectado: null, es_proyeccion: false },
    { mes: 3, mes_nombre: 'Marzo', monto_devengado: 2772000000, monto_proyectado: null, es_proyeccion: false },
    { mes: 4, mes_nombre: 'Abril', monto_devengado: 2986000000, monto_proyectado: null, es_proyeccion: false },
    { mes: 5, mes_nombre: 'Mayo', monto_devengado: 3176000000, monto_proyectado: null, es_proyeccion: false },
    { mes: 6, mes_nombre: 'Junio', monto_devengado: 3176000000, monto_proyectado: null, es_proyeccion: false },
    { mes: 7, mes_nombre: 'Julio', monto_devengado: 3362000000, monto_proyectado: null, es_proyeccion: false },
    { mes: 8, mes_nombre: 'Agosto', monto_devengado: 3485000000, monto_proyectado: null, es_proyeccion: false },
    { mes: 9, mes_nombre: 'Septiembre', monto_devengado: 3486000000, monto_proyectado: null, es_proyeccion: false },
    { mes: 10, mes_nombre: 'Octubre', monto_devengado: 3528000000, monto_proyectado: null, es_proyeccion: false },
    { mes: 11, mes_nombre: 'Noviembre', monto_devengado: null, monto_proyectado: 3640000000, es_proyeccion: true },
    { mes: 12, mes_nombre: 'Diciembre', monto_devengado: null, monto_proyectado: 3720000000, es_proyeccion: true },
    { mes: 13, mes_nombre: 'Enero +1', monto_devengado: null, monto_proyectado: 3810000000, es_proyeccion: true },
  ],
}

export const MOCK_MODELO_METRICAS = [
  { id: 1, region_id: 4, sector: null, modelo_usado: 'GradientBoosting', r2_ridge: 0.6721, mae_ridge: 198400000, rmse_ridge: 265100000, r2_rf: 0.8104, mae_rf: 148700000, rmse_rf: 212600000, r2_gb: 0.8621, mae_gb: 124500000, rmse_gb: 189300000, cantidad_datos: 12, anio_validacion: 2023 },
  { id: 2, region_id: 15, sector: null, modelo_usado: 'GradientBoosting', r2_ridge: 0.7142, mae_ridge: 320100000, rmse_ridge: 421500000, r2_rf: 0.8432, mae_rf: 240800000, rmse_rf: 318700000, r2_gb: 0.9021, mae_gb: 182300000, rmse_gb: 241400000, cantidad_datos: 12, anio_validacion: 2023 },
  { id: 3, region_id: 13, sector: null, modelo_usado: 'RandomForest', r2_ridge: 0.6890, mae_ridge: 210500000, rmse_ridge: 278400000, r2_rf: 0.8240, mae_rf: 162100000, rmse_rf: 214600000, r2_gb: 0.7960, mae_gb: 178300000, rmse_gb: 234700000, cantidad_datos: 12, anio_validacion: 2023 },
  { id: 4, region_id: 8, sector: null, modelo_usado: 'GradientBoosting', r2_ridge: 0.6340, mae_ridge: 187200000, rmse_ridge: 249800000, r2_rf: 0.7820, mae_rf: 142600000, rmse_rf: 196400000, r2_gb: 0.8340, mae_gb: 118700000, rmse_gb: 165200000, cantidad_datos: 12, anio_validacion: 2023 },
  { id: 5, region_id: 20, sector: null, modelo_usado: 'GradientBoosting', r2_ridge: 0.7020, mae_ridge: 204600000, rmse_ridge: 271300000, r2_rf: 0.8190, mae_rf: 158200000, rmse_rf: 208900000, r2_gb: 0.8730, mae_gb: 128400000, rmse_gb: 172600000, cantidad_datos: 12, anio_validacion: 2023 },
  { id: 6, region_id: 2, sector: null, modelo_usado: 'RandomForest', r2_ridge: 0.6510, mae_ridge: 162400000, rmse_ridge: 218700000, r2_rf: 0.8010, mae_rf: 126300000, rmse_rf: 174100000, r2_gb: 0.7780, mae_gb: 138400000, rmse_gb: 186300000, cantidad_datos: 12, anio_validacion: 2023 },
  { id: 7, region_id: 1, sector: null, modelo_usado: 'Ridge', r2_ridge: 0.7210, mae_ridge: 89400000, rmse_ridge: 121300000, r2_rf: 0.6840, mae_rf: 102700000, rmse_rf: 139200000, r2_gb: 0.6980, mae_gb: 97600000, rmse_gb: 132400000, cantidad_datos: 12, anio_validacion: 2023 },
  { id: 8, region_id: 9, sector: null, modelo_usado: 'Ridge', r2_ridge: 0.6920, mae_ridge: 74100000, rmse_ridge: 102800000, r2_rf: 0.5940, mae_rf: 91200000, rmse_rf: 124600000, r2_gb: 0.6120, mae_gb: 87300000, rmse_gb: 118700000, cantidad_datos: 12, anio_validacion: 2023 },
]

export function getMockMensualRegion(regionId) {
  const factor = (parseInt(regionId, 10) % 5) * 0.1 + 0.6
  return MOCK_MENSUAL.map(m => ({
    ...m,
    monto_pim: m.monto_pim * factor * 0.08,
    monto_devengado: m.monto_devengado * factor * 0.08,
    monto_girado: m.monto_girado * factor * 0.08,
  }))
}

export function getMockSectoresRegion(regionId) {
  const factor = (parseInt(regionId, 10) % 5) * 0.1 + 0.5
  return MOCK_SECTORES.map(s => ({
    ...s,
    monto_pim: s.monto_pim * factor * 0.06,
    monto_devengado: s.monto_devengado * factor * 0.06,
  }))
}

export function getMockPrediccionRegion(regionId) {
  const region = MOCK_RESUMEN.find(r => r.region_id === parseInt(regionId, 10)) || MOCK_RESUMEN[0]
  const mensual = getMockMensualRegion(regionId)
  return {
    ...MOCK_PREDICCION,
    region_id: region.region_id,
    region: region.region_nombre,
    puntos: mensual.map((m, i) => ({
      mes: i + 1,
      mes_nombre: m.mes_nombre,
      monto_devengado: i < 10 ? m.monto_devengado : null,
      monto_proyectado: i >= 9 ? m.monto_devengado * 1.05 : null,
      es_proyeccion: i >= 10,
    })),
  }
}
