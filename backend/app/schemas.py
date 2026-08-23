from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RegionBase(BaseModel):
    nombre: str
    ubigeo: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None


class RegionRead(RegionBase):
    id: int

    class Config:
        from_attributes = True


class RegionDetalle(RegionRead):
    porcentaje_ejecucion: Optional[float] = None
    monto_pim: Optional[float] = None
    monto_devengado: Optional[float] = None


class GastoPublicoBase(BaseModel):
    anio: int
    mes: int
    nivel_gobierno: Optional[str] = None
    entidad: Optional[str] = None
    region_id: Optional[int] = None
    sector: Optional[str] = None
    monto_pia: Optional[float] = None
    monto_pim: Optional[float] = None
    monto_devengado: Optional[float] = None
    monto_girado: Optional[float] = None


class GastoPublicoRead(GastoPublicoBase):
    id: int
    fecha_actualizacion: Optional[datetime] = None
    region: Optional[RegionRead] = None

    class Config:
        from_attributes = True


class GastoResumen(BaseModel):
    region_id: Optional[int] = None
    region_nombre: Optional[str] = None
    anio: int
    monto_pim: float
    monto_devengado: float
    porcentaje_ejecucion: Optional[float] = None


class RankingItem(BaseModel):
    region_id: Optional[int] = None
    region_nombre: Optional[str] = None
    anio: int
    porcentaje_ejecucion: float
    monto_pim: float
    monto_devengado: float
    posicion: int


class GastoMensualItem(BaseModel):
    mes: int
    mes_nombre: str
    monto_pim: float
    monto_devengado: float
    monto_girado: float
    porcentaje_ejecucion: float


class GastoSectorItem(BaseModel):
    sector: str
    monto_pim: float
    monto_devengado: float
    porcentaje_ejecucion: float


class GastoNivelItem(BaseModel):
    nivel_gobierno: str
    monto_pim: float
    monto_devengado: float
    porcentaje_ejecucion: float


class KPIsResponse(BaseModel):
    anio: int
    total_pim: float
    total_devengado: float
    total_girado: float
    porcentaje_ejecucion: float
    total_registros: int
    top_region: Optional[RankingItem] = None
    menor_region: Optional[RankingItem] = None
    alertas_activas: int


class AlertaBase(BaseModel):
    region_id: Optional[int] = None
    tipo_alerta: str
    descripcion: Optional[str] = None
    monto_relacionado: Optional[float] = None
    leida: bool = False


class AlertaRead(AlertaBase):
    id: int
    fecha: Optional[datetime] = None
    region: Optional[RegionRead] = None

    class Config:
        from_attributes = True


class ETLLogRead(BaseModel):
    id: int
    fecha_ejecucion: Optional[datetime] = None
    filas_descargadas: Optional[int] = None
    filas_procesadas: Optional[int] = None
    filas_descartadas: Optional[int] = None
    filas_corregidas: Optional[int] = None
    tiempo_segundos: Optional[float] = None
    origen_datos: Optional[str] = None
    estado: str
    detalle_error: Optional[str] = None

    class Config:
        from_attributes = True


class PrediccionPunto(BaseModel):
    mes: int
    mes_nombre: str
    anio: int
    monto_devengado: Optional[float] = None
    monto_proyectado: Optional[float] = None
    es_proyeccion: bool = False


class ComparativaModeloItem(BaseModel):
    nombre: str
    r2_score: Optional[float] = None
    mae: Optional[float] = None
    rmse: Optional[float] = None
    es_mejor: bool = False


class PrediccionResponse(BaseModel):
    region_id: Optional[int] = None
    region_nombre: str
    sector: Optional[str] = None
    anio: int
    r2_score: float
    mae: Optional[float] = None
    rmse: Optional[float] = None
    confiabilidad: str
    advertencia: Optional[str] = None
    modelo: str
    tendencia: str
    puntos: list[PrediccionPunto]
    gasto_total_estimado: float
    comparativa_modelos: Optional[list[ComparativaModeloItem]] = None


class ModeloMetricaRead(BaseModel):
    id: int
    region_id: Optional[int] = None
    sector: Optional[str] = None
    modelo_usado: str
    r2_score: Optional[float] = None
    mae: Optional[float] = None
    rmse: Optional[float] = None
    r2_ridge: Optional[float] = None
    mae_ridge: Optional[float] = None
    rmse_ridge: Optional[float] = None
    r2_rf: Optional[float] = None
    mae_rf: Optional[float] = None
    rmse_rf: Optional[float] = None
    r2_gb: Optional[float] = None
    mae_gb: Optional[float] = None
    rmse_gb: Optional[float] = None
    cantidad_datos: Optional[int] = None
    anio_validacion: Optional[int] = None
    fecha_entrenamiento: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list


class UsuarioBase(BaseModel):
    email: str
    nombre: Optional[str] = None


class UsuarioCreate(UsuarioBase):
    password: str


class UsuarioRead(UsuarioBase):
    id: int
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    temp_token: str
    email: str
    message: str
    sent_via_smtp: bool
    dev_code: Optional[str] = None


class Verify2FARequest(BaseModel):
    temp_token: str
    codigo: str


class Verify2FAResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioRead


class Resend2FARequest(BaseModel):
    temp_token: str


class ComparativaRegionData(BaseModel):
    region_id: int
    region_nombre: str
    monto_pim: float
    monto_devengado: float
    monto_girado: float
    porcentaje_ejecucion: float
    top_sectores: list[GastoSectorItem]


class ComparativaResponse(BaseModel):
    anio: int
    region1: ComparativaRegionData
    region2: ComparativaRegionData
    diferencia_porcentaje: float

