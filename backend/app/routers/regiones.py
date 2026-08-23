from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.database import get_db
from app.models import Region, GastoPublico
from app.schemas import RegionRead, RegionDetalle

router = APIRouter(prefix="/api/regiones", tags=["regiones"])


@router.get("", response_model=list[RegionRead])
def listar_regiones(db: Session = Depends(get_db)):
    return db.query(Region).order_by(Region.nombre).all()


@router.get("/{region_id}/detalle", response_model=RegionDetalle)
def detalle_region(
    region_id: int,
    anio: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    region = db.query(Region).filter(Region.id == region_id).first()
    if not region:
        raise HTTPException(status_code=404, detail="Región no encontrada")

    query = db.query(
        func.sum(GastoPublico.monto_pim).label("monto_pim"),
        func.sum(GastoPublico.monto_devengado).label("monto_devengado"),
    ).filter(GastoPublico.region_id == region_id)

    if anio is not None:
        query = query.filter(GastoPublico.anio == anio)

    row = query.first()

    pim = float(row.monto_pim) if row and row.monto_pim else 0
    dev = float(row.monto_devengado) if row and row.monto_devengado else 0
    pct = round((dev / pim * 100), 2) if pim > 0 else 0.0

    return RegionDetalle(
        id=region.id,
        nombre=region.nombre,
        ubigeo=region.ubigeo,
        latitud=region.latitud,
        longitud=region.longitud,
        porcentaje_ejecucion=pct,
        monto_pim=pim,
        monto_devengado=dev,
    )
