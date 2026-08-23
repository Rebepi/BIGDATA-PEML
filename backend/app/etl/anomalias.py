from datetime import datetime, timezone, timedelta

LIMA_TZ = timezone(timedelta(hours=-5))

def _ahora_lima():
    return datetime.now(tz=LIMA_TZ).replace(tzinfo=None)
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import GastoPublico, Alerta, Region


def detectar_baja_ejecucion(db: Session, umbral_pct: float = 50.0, mes_minimo: int = 9) -> list[dict]:
    resultados = (
        db.query(
            GastoPublico.region_id,
            Region.nombre.label("region_nombre"),
            GastoPublico.anio,
            func.sum(GastoPublico.monto_pim).label("total_pim"),
            func.sum(GastoPublico.monto_devengado).label("total_devengado"),
            func.max(GastoPublico.mes).label("ultimo_mes"),
        )
        .join(Region, GastoPublico.region_id == Region.id)
        .group_by(GastoPublico.region_id, Region.nombre, GastoPublico.anio)
        .having(func.max(GastoPublico.mes) >= mes_minimo)
        .all()
    )

    alertas = []
    for row in resultados:
        pim = float(row.total_pim) if row.total_pim else 0
        dev = float(row.total_devengado) if row.total_devengado else 0
        pct = (dev / pim * 100) if pim > 0 else 0
        if pct < umbral_pct:
            alertas.append({
                "region_id": row.region_id,
                "tipo_alerta": "BAJA_EJECUCION",
                "descripcion": (
                    f"Región {row.region_nombre} tiene solo {pct:.1f}% de ejecución "
                    f"en {row.anio} con {row.ultimo_mes} meses transcurridos."
                ),
                "monto_relacionado": pim - dev,
            })
    return alertas


def detectar_gasto_atipico(db: Session, factor_desviacion: float = 2.5) -> list[dict]:
    rows = (
        db.query(
            GastoPublico.region_id,
            Region.nombre.label("region_nombre"),
            GastoPublico.anio,
            GastoPublico.mes,
            func.sum(GastoPublico.monto_devengado).label("gasto_mensual"),
        )
        .join(Region, GastoPublico.region_id == Region.id)
        .group_by(
            GastoPublico.region_id, Region.nombre,
            GastoPublico.anio, GastoPublico.mes,
        )
        .all()
    )

    df = pd.DataFrame(
        [
            {
                "region_id": r.region_id,
                "region_nombre": r.region_nombre,
                "anio": r.anio,
                "mes": r.mes,
                "gasto_mensual": float(r.gasto_mensual) if r.gasto_mensual else 0,
            }
            for r in rows
        ]
    )

    if df.empty:
        return []

    alertas = []
    for region_id, grupo in df.groupby("region_id"):
        media = grupo["gasto_mensual"].mean()
        std = grupo["gasto_mensual"].std()
        if std == 0 or pd.isna(std):
            continue
        atipicos = grupo[grupo["gasto_mensual"] > media + factor_desviacion * std]
        for _, row in atipicos.iterrows():
            alertas.append({
                "region_id": int(region_id),
                "tipo_alerta": "GASTO_ATIPICO",
                "descripcion": (
                    f"Región {row['region_nombre']} tuvo un gasto mensual de "
                    f"S/ {row['gasto_mensual']:,.0f} en {row['mes']}/{row['anio']}, "
                    f"que es {factor_desviacion}+ desviaciones sobre la media histórica."
                ),
                "monto_relacionado": row["gasto_mensual"],
            })
    return alertas


def guardar_alertas(alertas: list[dict], db: Session) -> int:
    if not alertas:
        return 0

    existentes = db.query(Alerta.region_id, Alerta.tipo_alerta, Alerta.descripcion).all()
    existentes_set = {(r[0], r[1], r[2]) for r in existentes}

    objetos = []
    for a in alertas:
        clave = (a["region_id"], a["tipo_alerta"], a["descripcion"])
        if clave not in existentes_set:
            objetos.append(
                Alerta(
                    region_id=a["region_id"],
                    tipo_alerta=a["tipo_alerta"],
                    descripcion=a["descripcion"],
                    monto_relacionado=a.get("monto_relacionado"),
                    fecha=_ahora_lima(),
                    leida=False,
                )
            )
            existentes_set.add(clave)

    if objetos:
        db.add_all(objetos)
        db.commit()
    return len(objetos)


def ejecutar_deteccion(db: Session) -> int:
    alertas_baja = detectar_baja_ejecucion(db)
    alertas_atipico = detectar_gasto_atipico(db)
    todas = alertas_baja + alertas_atipico
    return guardar_alertas(todas, db)
