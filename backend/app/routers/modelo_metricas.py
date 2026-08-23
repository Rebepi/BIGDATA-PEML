from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ModeloMetrica, Region, GastoPublico
from app.schemas import ModeloMetricaRead
from app.ml.trainer import entrenar_y_seleccionar

router = APIRouter(prefix="/api/modelo-metricas", tags=["Modelos ML"])


@router.get("", response_model=list[ModeloMetricaRead])
def listar_modelo_metricas(
    region_id: int = Query(None),
    sector: str = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    sector_norm = sector.strip().upper() if (sector and isinstance(sector, str)) else None
    q = db.query(ModeloMetrica)
    if region_id is not None:
        q = q.filter(ModeloMetrica.region_id == region_id)
    if sector_norm:
        q = q.filter(ModeloMetrica.sector == sector_norm)
    res = q.order_by(ModeloMetrica.fecha_entrenamiento.desc()).limit(limit).all()

    if not res:
        entrenar_y_seleccionar(region_id=region_id, sector=sector_norm, db=db)
        res = q.order_by(ModeloMetrica.fecha_entrenamiento.desc()).limit(limit).all()

    return res


@router.get("/regiones")
def regiones_con_metricas(db: Session = Depends(get_db)):
    regiones = db.query(Region).order_by(Region.nombre).all()
    return [{"id": r.id, "nombre": r.nombre} for r in regiones]


@router.get("/sectores")
def sectores_con_metricas(region_id: int = Query(None), db: Session = Depends(get_db)):
    q = db.query(GastoPublico.sector).filter(GastoPublico.sector.isnot(None), GastoPublico.sector != "")
    if region_id is not None:
        q = q.filter(GastoPublico.region_id == region_id)
    sectores = [r[0] for r in q.distinct().order_by(GastoPublico.sector).limit(30).all()]
    return [s for s in sectores if s]


@router.post("/entrenar-todos")
def entrenar_todos_modelos(db: Session = Depends(get_db)):
    entrenar_y_seleccionar(region_id=None, sector=None, db=db)
    regiones = db.query(Region).all()
    total_entrenados = 1
    for r in regiones:
        res = entrenar_y_seleccionar(region_id=r.id, sector=None, db=db)
        if res:
            total_entrenados += 1
    return {"message": f"Modelos ML entrenados y actualizados exitosamente ({total_entrenados} combinaciones)."}
