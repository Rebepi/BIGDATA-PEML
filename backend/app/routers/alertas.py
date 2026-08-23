from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import Alerta, ETLLog
from app.schemas import AlertaRead, ETLLogRead
from app.etl.anomalias import ejecutar_deteccion

router = APIRouter(tags=["alertas"])


@router.get("/api/alertas", response_model=list[AlertaRead])
def listar_alertas(
    tipo_alerta: Optional[str] = Query(None),
    region_id: Optional[int] = Query(None),
    solo_no_leidas: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Alerta).order_by(Alerta.fecha.desc())

    if tipo_alerta is not None:
        query = query.filter(Alerta.tipo_alerta.ilike(f"%{tipo_alerta}%"))
    if region_id is not None:
        query = query.filter(Alerta.region_id == region_id)
    if solo_no_leidas is not None:
        query = query.filter(Alerta.leida == (not solo_no_leidas))

    return query.all()


@router.patch("/api/alertas/{alerta_id}/leida", response_model=AlertaRead)
def marcar_alerta_leida(
    alerta_id: int,
    leida: bool = Query(True),
    db: Session = Depends(get_db),
):
    alerta = db.query(Alerta).filter(Alerta.id == alerta_id).first()
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    alerta.leida = leida
    db.commit()
    db.refresh(alerta)
    return alerta


@router.post("/api/alertas/marcar-todas-leidas")
def marcar_todas_alertas_leidas(
    db: Session = Depends(get_db),
):
    actualizadas = db.query(Alerta).filter(Alerta.leida == False).update({"leida": True})
    db.commit()
    return {"message": f"{actualizadas} alertas marcadas como leídas", "total": actualizadas}


@router.delete("/api/alertas/{alerta_id}")
def eliminar_alerta(
    alerta_id: int,
    db: Session = Depends(get_db),
):
    alerta = db.query(Alerta).filter(Alerta.id == alerta_id).first()
    if not alerta:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    db.delete(alerta)
    db.commit()
    return {"message": "Alerta eliminada correctamente", "id": alerta_id}


@router.delete("/api/alertas")
def eliminar_todas_alertas(
    db: Session = Depends(get_db),
):
    total = db.query(Alerta).delete()
    db.commit()
    return {"message": f"{total} alertas eliminadas", "total": total}


@router.post("/api/alertas/regenerar")
def regenerar_alertas(
    db: Session = Depends(get_db),
):
    nuevas = ejecutar_deteccion(db)
    return {"message": "Detección de anomalías ejecutada sobre los datos actuales", "nuevas_alertas": nuevas}


@router.get("/api/etl-logs", response_model=list[ETLLogRead])
@router.get("/api/etl/logs", response_model=list[ETLLogRead])
def listar_etl_logs(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return (
        db.query(ETLLog)
        .order_by(ETLLog.fecha_ejecucion.desc())
        .limit(limit)
        .all()
    )
