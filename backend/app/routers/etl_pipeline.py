from fastapi import APIRouter, Query, HTTPException, BackgroundTasks
from typing import Optional, List, Dict, Any
from pathlib import Path
from datetime import datetime
import pandas as pd
from app.etl.limpieza import COLUMN_ALIASES, _normalize_str, limpiar_dataframe_con_metricas
from app.etl.descarga import RAW_DATA_DIR, MEF_FS_URLS
from app.database import SessionLocal
from app.models import GastoPublico

router = APIRouter(prefix="/api/etl/pipeline", tags=["etl-pipeline"])


def _get_dynamic_years() -> List[int]:
    years_set = set()
    if RAW_DATA_DIR.exists():
        for f in RAW_DATA_DIR.glob("*.csv"):
            parts = f.stem.split("_")
            for p in parts:
                if p.isdigit() and len(p) == 4:
                    years_set.add(int(p))
    
    db = SessionLocal()
    try:
        db_years = db.query(GastoPublico.anio).distinct().all()
        for y in db_years:
            if y[0]:
                years_set.add(int(y[0]))
    except Exception:
        pass
    finally:
        db.close()

    for y in MEF_FS_URLS.keys():
        years_set.add(int(y))

    if not years_set:
        current_year = datetime.now().year
        return list(range(current_year, current_year - 6, -1))

    return sorted(list(years_set), reverse=True)


def _find_csv_for_year(anio: int) -> Path:
    if not RAW_DATA_DIR.exists():
        RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)

    direct_candidates = [
        RAW_DATA_DIR / f"gasto_{anio}.csv",
        RAW_DATA_DIR / f"gasto_mensual_{anio}.csv",
    ]
    for cand in direct_candidates:
        if cand.exists() and cand.stat().st_size > 0:
            return cand

    for f in RAW_DATA_DIR.glob("*.csv"):
        if str(anio) in f.stem and f.stat().st_size > 0:
            return f

    return None


def _count_csv_rows(csv_path: Path) -> int:
    try:
        with open(csv_path, "rb") as f:
            count = sum(1 for _ in f) - 1
        return max(0, count)
    except Exception:
        return 0


def _load_csv_sample(anio: int, n_rows: int = 50) -> pd.DataFrame:
    csv_path = _find_csv_for_year(anio)
    if not csv_path or not csv_path.exists():
        from app.etl.descarga import download_csv_for_year
        csv_path = download_csv_for_year(anio, max_lines=1000)

    if not csv_path or not csv_path.exists():
        raise HTTPException(status_code=404, detail=f"No se encontro fuente de datos para el ejercicio {anio}.")

    try:
        df = pd.read_csv(csv_path, encoding="utf-8-sig", nrows=n_rows, low_memory=False)
    except UnicodeDecodeError:
        df = pd.read_csv(csv_path, encoding="latin-1", nrows=n_rows, low_memory=False)
    return df


def _load_csv_page(anio: int, page: int = 1, page_size: int = 100) -> tuple[pd.DataFrame, int, str]:
    csv_path = _find_csv_for_year(anio)
    if not csv_path or not csv_path.exists():
        from app.etl.descarga import download_csv_for_year
        csv_path = download_csv_for_year(anio, max_lines=1000)

    if not csv_path or not csv_path.exists():
        raise HTTPException(status_code=404, detail=f"No se encontro fuente de datos para el ejercicio {anio}.")

    total_rows = _count_csv_rows(csv_path)
    skip = (page - 1) * page_size

    encoding = "utf-8-sig"
    try:
        header_df = pd.read_csv(csv_path, encoding=encoding, nrows=0)
        col_names = list(header_df.columns)
        df = pd.read_csv(
            csv_path,
            encoding=encoding,
            skiprows=range(1, skip + 1),
            nrows=page_size,
            header=0,
            names=col_names,
            low_memory=False,
        )
    except UnicodeDecodeError:
        encoding = "latin-1"
        header_df = pd.read_csv(csv_path, encoding=encoding, nrows=0)
        col_names = list(header_df.columns)
        df = pd.read_csv(
            csv_path,
            encoding=encoding,
            skiprows=range(1, skip + 1),
            nrows=page_size,
            header=0,
            names=col_names,
            low_memory=False,
        )

    return df, total_rows, str(csv_path)


@router.get("/years")
def get_available_years():
    years = _get_dynamic_years()
    return {"years": years}


@router.get("/column-map")
def get_column_map(anio: Optional[int] = Query(None)):
    years = _get_dynamic_years()
    selected_year = anio or (years[0] if years else datetime.now().year)

    df_sample = _load_csv_sample(selected_year, n_rows=10)
    actual_columns = list(df_sample.columns)

    norm_to_canonical = {}
    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            norm_to_canonical[_normalize_str(alias)] = canonical

    kept = []
    discarded = []

    for col in actual_columns:
        norm_col = _normalize_str(col)
        canonical = norm_to_canonical.get(norm_col)
        if canonical:
            kept.append({
                "column": col,
                "canonical": canonical,
                "reason": f"Mapeado dinamicamente al campo '{canonical}' del modelo analitico"
            })
        else:
            discarded.append({
                "column": col,
                "reason": "Clasificador o atributo granular no requerido en agregacion regional"
            })

    total_cols = len(actual_columns)
    return {
        "anio": selected_year,
        "total_original": total_cols,
        "total_kept": len(kept),
        "total_discarded": len(discarded),
        "reduction_pct": round((len(discarded) / total_cols * 100) if total_cols > 0 else 0, 1),
        "kept": kept,
        "discarded": discarded,
    }


@router.get("/cleaning-rules")
def get_cleaning_rules():
    rules = [
        {
            "id": 1,
            "nombre": "Mapeo y seleccion dinamica de atributos",
            "tipo": "reduccion",
            "descripcion": "Inspeccion dinamica de cabeceras contra diccionario de alias canónicos. Filtra clasificadores redundantes o de granularidad distrital/subprogramatica.",
            "impacto": "Reduccion del 80-85% en dimensionalidad de columnas",
            "color": "peru"
        },
        {
            "id": 2,
            "nombre": "Normalizacion y casteo numerico",
            "tipo": "correccion",
            "descripcion": "Saneamiento de cadenas de texto con simbolos monetarios, comas y caracteres invalidos, convirtiendo a punto flotante float64 con imputacion de ceros.",
            "impacto": "Garantiza coherencia matematica en PIA, PIM, Devengado y Girado",
            "color": "gold"
        },
        {
            "id": 3,
            "nombre": "Correccion de PIM nulo mediante compromiso",
            "tipo": "correccion",
            "descripcion": "Si el PIM figura en cero pero existe compromiso anual positivo, se imputa el monto comprometido para reflejar la asignacion real ejecutada.",
            "impacto": "Evita divisiones por cero y tasas infinitas de ejecucion",
            "color": "gold"
        },
        {
            "id": 4,
            "nombre": "Resolucion de anomalias devengado > PIM",
            "tipo": "correccion",
            "descripcion": "Casos de desajuste presupuestal donde el devengado supera al PIM registrado se regularizan asignando un factor prudencial de 1.15x.",
            "impacto": "Consistencia logica en el calculo del porcentaje de avance",
            "color": "gold"
        },
        {
            "id": 5,
            "nombre": "Estandarizacion de catalogo regional",
            "tipo": "normalizacion",
            "descripcion": "Eliminacion de tildes, caracteres especiales y unificacion de variantes departamentales hacia los 25 departamentos geograficos oficiales.",
            "impacto": "Integridad referencial con la dimension espacial",
            "color": "blue"
        },
        {
            "id": 6,
            "nombre": "Depuracion de registros corruptos y nulos",
            "tipo": "eliminacion",
            "descripcion": "Filtrado estricto de registros sin referencia temporal (anio o mes faltante) requerida para la serie historica.",
            "impacto": "Preservacion de la integridad cronologica",
            "color": "rose"
        },
        {
            "id": 7,
            "nombre": "Deduplicacion exacta de transacciones",
            "tipo": "eliminacion",
            "descripcion": "Eliminacion de filas duplicadas redundantes exportadas por multiples cortes de datos abiertos.",
            "impacto": "Elimina sobreestimaciones en la agregacion",
            "color": "rose"
        },
        {
            "id": 8,
            "nombre": "Marcado de regimenes atipicos",
            "tipo": "enriquecimiento",
            "descripcion": "Identificacion automatica de periodos con distorsion presupuestal severa para el entrenamiento de modelos predictivos.",
            "impacto": "Optimizacion de hiperparametros de Machine Learning",
            "color": "green"
        },
    ]
    return {"rules": rules}


@router.get("/raw-sample")
def get_raw_sample(
    anio: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=10, le=200),
):
    years = _get_dynamic_years()
    selected_year = anio or (years[0] if years else datetime.now().year)

    df, total_rows, csv_path = _load_csv_page(selected_year, page=page, page_size=page_size)
    df = df.fillna("")
    columns = list(df.columns)
    rows = df.to_dict(orient="records")

    norm_to_canonical = {}
    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            norm_to_canonical[_normalize_str(alias)] = canonical

    kept_columns = [col for col in columns if _normalize_str(col) in norm_to_canonical]
    total_pages = max(1, -(-total_rows // page_size))

    return {
        "anio": selected_year,
        "total_columns": len(columns),
        "columns": columns,
        "kept_columns": kept_columns,
        "rows": rows,
        "page": page,
        "page_size": page_size,
        "total_rows": total_rows,
        "total_pages": total_pages,
        "sample_size": len(rows),
        "csv_path": csv_path,
    }


@router.get("/cleaned-sample")
def get_cleaned_sample(
    anio: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=10, le=200),
):
    years = _get_dynamic_years()
    selected_year = anio or (years[0] if years else datetime.now().year)

    df_raw, total_rows, _ = _load_csv_page(selected_year, page=page, page_size=page_size)
    df_clean, metricas = limpiar_dataframe_con_metricas(df_raw)
    df_clean = df_clean.fillna("")
    columns = list(df_clean.columns)
    rows = df_clean.to_dict(orient="records")
    total_pages = max(1, -(-total_rows // page_size))

    return {
        "anio": selected_year,
        "total_columns": len(columns),
        "columns": columns,
        "rows": rows,
        "page": page,
        "page_size": page_size,
        "total_rows": total_rows,
        "total_pages": total_pages,
        "sample_size": len(rows),
        "metricas": metricas,
    }


@router.get("/metricas")
def get_metricas(anio: Optional[int] = Query(None)):
    years = _get_dynamic_years()
    selected_year = anio or (years[0] if years else datetime.now().year)

    csv_path = _find_csv_for_year(selected_year)
    if not csv_path or not csv_path.exists():
        from app.etl.descarga import download_csv_for_year
        csv_path = download_csv_for_year(selected_year, max_lines=2000)

    if not csv_path or not csv_path.exists():
        raise HTTPException(status_code=404, detail=f"No existe fuente de datos para el ejercicio {selected_year}.")

    file_size_mb = round(csv_path.stat().st_size / (1024 * 1024), 2)

    try:
        df_raw = pd.read_csv(csv_path, encoding="utf-8-sig", nrows=5000, low_memory=False)
    except UnicodeDecodeError:
        df_raw = pd.read_csv(csv_path, encoding="latin-1", nrows=5000, low_memory=False)

    total_raw_columns = len(df_raw.columns)
    df_clean, metricas = limpiar_dataframe_con_metricas(df_raw)

    return {
        "anio": selected_year,
        "file_size_mb": file_size_mb,
        "total_raw_columns": total_raw_columns,
        "total_clean_columns": len(df_clean.columns),
        "columns_eliminated": total_raw_columns - len(df_clean.columns),
        "metricas": metricas,
        "calidad_pct": round(
            (metricas["filas_limpias"] / metricas["filas_iniciales"] * 100)
            if metricas["filas_iniciales"] > 0 else 100,
            1
        ),
    }


@router.post("/run")
def trigger_etl(background_tasks: BackgroundTasks):
    from app.scheduler import run_etl_pipeline
    background_tasks.add_task(run_etl_pipeline)
    return {"message": "Pipeline ETL ejecutandose automaticamente en segundo plano.", "status": "running"}


@router.post("/reset-and-run")
def reset_and_run_etl(background_tasks: BackgroundTasks):
    from app.scheduler import run_etl_pipeline
    from app.database import SessionLocal
    from app.models import GastoPublico, Alerta, ModeloMetrica, ETLLog
    db = SessionLocal()
    try:
        db.query(GastoPublico).delete()
        db.query(Alerta).delete()
        db.query(ModeloMetrica).delete()
        db.query(ETLLog).delete()
        db.commit()
    finally:
        db.close()
    background_tasks.add_task(run_etl_pipeline)
    return {"message": "Datos eliminados y recoleccion automatica iniciada desde cero.", "status": "running"}
