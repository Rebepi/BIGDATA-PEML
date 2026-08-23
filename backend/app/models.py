from sqlalchemy import (
    Column, Integer, String, Numeric, Float, Text, DateTime, Boolean, ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Region(Base):
    __tablename__ = "regiones"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, unique=True)
    ubigeo = Column(String(10), nullable=True)
    latitud = Column(Float, nullable=True)
    longitud = Column(Float, nullable=True)

    gastos = relationship("GastoPublico", back_populates="region")
    alertas = relationship("Alerta", back_populates="region")


class GastoPublico(Base):
    __tablename__ = "gasto_publico"

    id = Column(Integer, primary_key=True, index=True)
    anio = Column(Integer, nullable=False, index=True)
    mes = Column(Integer, nullable=False, index=True)
    nivel_gobierno = Column(String(50), nullable=True)
    entidad = Column(String(255), nullable=True)
    region_id = Column(Integer, ForeignKey("regiones.id"), nullable=True, index=True)
    sector = Column(String(100), nullable=True, index=True)
    monto_pia = Column(Numeric(18, 2), nullable=True)
    monto_pim = Column(Numeric(18, 2), nullable=True)
    monto_devengado = Column(Numeric(18, 2), nullable=True)
    monto_girado = Column(Numeric(18, 2), nullable=True)
    es_periodo_atipico = Column(Boolean, default=False, nullable=True)
    fecha_actualizacion = Column(DateTime, server_default=func.now())

    region = relationship("Region", back_populates="gastos")


class Alerta(Base):
    __tablename__ = "alertas"

    id = Column(Integer, primary_key=True, index=True)
    region_id = Column(Integer, ForeignKey("regiones.id"), nullable=True, index=True)
    tipo_alerta = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=True)
    monto_relacionado = Column(Numeric(18, 2), nullable=True)
    fecha = Column(DateTime, server_default=func.now())
    leida = Column(Boolean, default=False, nullable=False)

    region = relationship("Region", back_populates="alertas")


class ETLLog(Base):
    __tablename__ = "etl_logs"

    id = Column(Integer, primary_key=True, index=True)
    fecha_ejecucion = Column(DateTime, server_default=func.now())
    filas_descargadas = Column(Integer, nullable=True)
    filas_procesadas = Column(Integer, nullable=True)
    filas_descartadas = Column(Integer, nullable=True)
    filas_corregidas = Column(Integer, nullable=True)
    tiempo_segundos = Column(Float, nullable=True)
    origen_datos = Column(String(100), nullable=True)
    estado = Column(String(20), nullable=False)
    detalle_error = Column(Text, nullable=True)



class ModeloMetrica(Base):
    __tablename__ = "modelo_metricas"

    id = Column(Integer, primary_key=True, index=True)
    region_id = Column(Integer, ForeignKey("regiones.id"), nullable=True, index=True)
    sector = Column(String(100), nullable=True, index=True)
    modelo_usado = Column(String(60), nullable=False)
    r2_score = Column(Float, nullable=True)
    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    r2_ridge = Column(Float, nullable=True)
    mae_ridge = Column(Float, nullable=True)
    rmse_ridge = Column(Float, nullable=True)
    r2_rf = Column(Float, nullable=True)
    mae_rf = Column(Float, nullable=True)
    rmse_rf = Column(Float, nullable=True)
    r2_gb = Column(Float, nullable=True)
    mae_gb = Column(Float, nullable=True)
    rmse_gb = Column(Float, nullable=True)
    cantidad_datos = Column(Integer, nullable=True)
    anio_validacion = Column(Integer, nullable=True)
    fecha_entrenamiento = Column(DateTime, server_default=func.now())

    region = relationship("Region")


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    nombre = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    codigos_2fa = relationship("Codigo2FA", back_populates="usuario")


class Codigo2FA(Base):
    __tablename__ = "codigos_2fa"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    codigo = Column(String(6), nullable=False)
    expira_en = Column(DateTime, nullable=False)
    usado = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    usuario = relationship("Usuario", back_populates="codigos_2fa")
