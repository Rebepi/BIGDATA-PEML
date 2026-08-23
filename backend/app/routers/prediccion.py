import numpy as np
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import GastoPublico, Region
from app.ml.trainer import entrenar_y_seleccionar, PESOS_ESTACIONALES, ANIOS_ATIPICOS
from app.ml.feature_engineering import build_features
from app.schemas import PrediccionResponse, PrediccionPunto, ComparativaModeloItem

router = APIRouter(prefix="/api/prediccion", tags=["Prediccion"])

MESES_NOMBRES = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Set", "Oct", "Nov", "Dic"
]


def _build_response(
    region_id,
    region_nombre,
    sector,
    anio,
    resultado,
    db,
):
    if resultado is None:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")

    model = resultado["modelo"]
    modelo_nombre = f"{resultado['modelo_nombre']} (scikit-learn)"
    r2 = resultado["r2"]
    mae = resultado["mae"]
    rmse = resultado["rmse"]
    anio_rows = resultado["anio_rows"]
    comparativa = [ComparativaModeloItem(**c) for c in resultado["comparativa"]]

    datos_anio = anio_rows.get(anio)
    if datos_anio is None:
        anio_mas_cercano = min(anio_rows.keys(), key=lambda a: abs(a - anio))
        datos_anio = anio_rows[anio_mas_cercano]

    snap_mes = datos_anio["mes"]
    snap_dev = datos_anio["devengado"]
    snap_pim = datos_anio["pim"]

    peso_corte = PESOS_ESTACIONALES[snap_mes - 1] if snap_mes >= 1 else 1.0
    dev_anual_estimado = snap_dev / peso_corte if peso_corte > 0 else snap_dev

    feats_corte = build_features(anio, snap_mes, snap_pim, anio in ANIOS_ATIPICOS)
    try:
        pred_en_corte = float(model.predict([feats_corte])[0])
        factor_escala = snap_dev / pred_en_corte if pred_en_corte > 0 else 1.0
    except Exception:
        factor_escala = 1.0

    puntos = []
    total_estimado = 0.0

    for m in range(1, 13):
        mes_nombre = MESES_NOMBRES[m - 1]

        if m <= snap_mes:
            dev_val = round(dev_anual_estimado * PESOS_ESTACIONALES[m - 1], 2)
            total_estimado = dev_val
            proj_val = dev_val if m == snap_mes else None
            puntos.append(PrediccionPunto(
                mes=m,
                mes_nombre=mes_nombre,
                anio=anio,
                monto_devengado=dev_val,
                monto_proyectado=proj_val,
                es_proyeccion=False,
            ))
        else:
            feats_fut = build_features(anio, m, snap_pim, anio in ANIOS_ATIPICOS)
            try:
                pred_ml_raw = float(model.predict([feats_fut])[0])
                pred_ml = pred_ml_raw * factor_escala
            except Exception:
                pred_ml = dev_anual_estimado * PESOS_ESTACIONALES[m - 1]

            seasonal_proj = dev_anual_estimado * PESOS_ESTACIONALES[m - 1]
            pred_val = round(max(snap_dev, pred_ml, seasonal_proj), 2)
            total_estimado = pred_val
            puntos.append(PrediccionPunto(
                mes=m,
                mes_nombre=mes_nombre,
                anio=anio,
                monto_devengado=None,
                monto_proyectado=pred_val,
                es_proyeccion=True,
            ))

    r2_rounded = round(r2, 4)
    if r2_rounded >= 0.70:
        confiabilidad = "ALTA"
        advertencia = None
    elif r2_rounded >= 0.50:
        confiabilidad = "MEDIA"
        advertencia = None
    else:
        confiabilidad = "BAJA"
        advertencia = (
            f"Baja correlación estadística (R² = {r2_rounded:.4f} < 0.50). "
            f"La proyección se presenta con fines de análisis exploratorio."
        )

    preds = []
    for m in range(1, 13):
        try:
            feats_m = build_features(anio, m, snap_pim, anio in ANIOS_ATIPICOS)
            preds.append(float(model.predict([feats_m])[0]) * factor_escala)
        except Exception:
            preds.append(0.0)
    slope = preds[-1] - preds[0]
    tendencia = "Creciente" if slope > 500000 else "Decreciente" if slope < -500000 else "Estable"

    return PrediccionResponse(
        region_id=region_id,
        region_nombre=region_nombre,
        sector=sector,
        anio=anio,
        r2_score=r2_rounded,
        mae=round(mae, 2) if mae is not None else None,
        rmse=round(rmse, 2) if rmse is not None else None,
        confiabilidad=confiabilidad,
        advertencia=advertencia,
        modelo=modelo_nombre,
        tendencia=tendencia,
        puntos=puntos,
        gasto_total_estimado=round(total_estimado, 2),
        comparativa_modelos=comparativa,
    )


@router.get("/{region_id}", response_model=PrediccionResponse)
def predecir_gasto_region(
    region_id: int,
    anio: int = Query(2024, ge=2020, le=2026),
    meses_futuros: int = Query(3, ge=1, le=6),
    sector: Optional[str] = None,
    db: Session = Depends(get_db),
):
    if region_id == 0:
        region_nombre = "NACIONAL"
    else:
        region = db.query(Region).filter(Region.id == region_id).first()
        if not region:
            raise HTTPException(status_code=404, detail="Región no encontrada")
        region_nombre = region.nombre

    sector_upper = sector.strip().upper() if (sector and isinstance(sector, str)) else None

    resultado = entrenar_y_seleccionar(
        region_id=region_id if region_id != 0 else None,
        sector=sector_upper,
        db=db,
    )

    if resultado is None and sector_upper:
        resultado = entrenar_y_seleccionar(
            region_id=region_id if region_id != 0 else None,
            sector=None,
            db=db,
        )

    return _build_response(region_id, region_nombre, sector_upper, anio, resultado, db)


@router.get("", response_model=list[PrediccionResponse])
def predecir_todas_regiones(
    anio: int = Query(2024, ge=2020, le=2026),
    limit: int = Query(5, ge=1, le=25),
    db: Session = Depends(get_db),
):
    regiones = db.query(Region).order_by(Region.id).limit(limit).all()
    resultados = []
    for reg in regiones:
        try:
            pred = predecir_gasto_region(region_id=reg.id, anio=anio, db=db)
            resultados.append(pred)
        except HTTPException:
            continue
    return resultados
