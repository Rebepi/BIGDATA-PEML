import pandas as pd
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Region, GastoPublico, Base

REGIONES_PERU = [
    {"nombre": "AMAZONAS", "ubigeo": "01", "latitud": -5.866, "longitud": -78.018},
    {"nombre": "ANCASH", "ubigeo": "02", "latitud": -9.525, "longitud": -77.528},
    {"nombre": "APURIMAC", "ubigeo": "03", "latitud": -14.045, "longitud": -73.085},
    {"nombre": "AREQUIPA", "ubigeo": "04", "latitud": -16.409, "longitud": -71.537},
    {"nombre": "AYACUCHO", "ubigeo": "05", "latitud": -13.157, "longitud": -74.224},
    {"nombre": "CAJAMARCA", "ubigeo": "06", "latitud": -7.163, "longitud": -78.512},
    {"nombre": "CALLAO", "ubigeo": "07", "latitud": -12.056, "longitud": -77.118},
    {"nombre": "CUSCO", "ubigeo": "08", "latitud": -13.532, "longitud": -71.968},
    {"nombre": "HUANCAVELICA", "ubigeo": "09", "latitud": -12.786, "longitud": -74.976},
    {"nombre": "HUANUCO", "ubigeo": "10", "latitud": -9.931, "longitud": -76.242},
    {"nombre": "ICA", "ubigeo": "11", "latitud": -14.070, "longitud": -75.729},
    {"nombre": "JUNIN", "ubigeo": "12", "latitud": -11.159, "longitud": -75.995},
    {"nombre": "LA LIBERTAD", "ubigeo": "13", "latitud": -8.112, "longitud": -79.029},
    {"nombre": "LAMBAYEQUE", "ubigeo": "14", "latitud": -6.771, "longitud": -79.844},
    {"nombre": "LIMA", "ubigeo": "15", "latitud": -12.046, "longitud": -77.043},
    {"nombre": "LORETO", "ubigeo": "16", "latitud": -4.904, "longitud": -74.733},
    {"nombre": "MADRE DE DIOS", "ubigeo": "17", "latitud": -11.901, "longitud": -69.296},
    {"nombre": "MOQUEGUA", "ubigeo": "18", "latitud": -17.193, "longitud": -70.935},
    {"nombre": "PASCO", "ubigeo": "19", "latitud": -10.686, "longitud": -76.259},
    {"nombre": "PIURA", "ubigeo": "20", "latitud": -5.194, "longitud": -80.633},
    {"nombre": "PUNO", "ubigeo": "21", "latitud": -15.841, "longitud": -70.020},
    {"nombre": "SAN MARTIN", "ubigeo": "22", "latitud": -6.952, "longitud": -76.361},
    {"nombre": "TACNA", "ubigeo": "23", "latitud": -18.013, "longitud": -70.252},
    {"nombre": "TUMBES", "ubigeo": "24", "latitud": -3.566, "longitud": -80.457},
    {"nombre": "UCAYALI", "ubigeo": "25", "latitud": -8.379, "longitud": -74.553},
]


def seed_regiones(db: Session) -> dict[str, int]:
    region_map = {}
    for data in REGIONES_PERU:
        region = db.query(Region).filter(Region.nombre == data["nombre"]).first()
        if not region:
            region = Region(**data)
            db.add(region)
            db.flush()
        region_map[data["nombre"]] = region.id
    db.commit()
    return region_map


def cargar_dataframe(df: pd.DataFrame, db: Session, region_map: dict = None) -> int:
    if region_map is None:
        region_map = seed_regiones(db)

    required_cols = {"anio", "mes"}
    if not required_cols.issubset(df.columns):
        return 0

    records = []
    for _, row in df.iterrows():
        region_nombre = str(row.get("region", "")).strip().upper() if "region" in df.columns else None
        region_id = region_map.get(region_nombre)

        records.append({
            "anio": int(row["anio"]) if pd.notna(row["anio"]) else None,
            "mes": int(row["mes"]) if pd.notna(row["mes"]) else None,
            "nivel_gobierno": str(row.get("nivel_gobierno", ""))[:50] if "nivel_gobierno" in df.columns else None,
            "entidad": str(row.get("entidad", ""))[:255] if "entidad" in df.columns else None,
            "region_id": region_id,
            "sector": str(row.get("sector", ""))[:100] if "sector" in df.columns else None,
            "monto_pia": float(row.get("monto_pia", 0)) if "monto_pia" in df.columns else None,
            "monto_pim": float(row.get("monto_pim", 0)) if "monto_pim" in df.columns else None,
            "monto_devengado": float(row.get("monto_devengado", 0)) if "monto_devengado" in df.columns else None,
            "monto_girado": float(row.get("monto_girado", 0)) if "monto_girado" in df.columns else None,
            "es_periodo_atipico": bool(row.get("es_periodo_atipico", False)) if "es_periodo_atipico" in df.columns else False,
        })

    BATCH_SIZE = 5000
    total_inserted = 0
    for i in range(0, len(records), BATCH_SIZE):
        batch = records[i: i + BATCH_SIZE]
        db.bulk_insert_mappings(GastoPublico, batch)
        db.commit()
        total_inserted += len(batch)

    return total_inserted


def inicializar_tablas():
    Base.metadata.create_all(bind=engine)
