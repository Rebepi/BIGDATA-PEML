import re
import unicodedata
import pandas as pd
from pathlib import Path

COLUMN_ALIASES = {
    "anio": [
        "ano_eje", "ano", "anio", "year", "ejercicio"
    ],
    "mes": [
        "mes_eje", "mes", "month"
    ],
    "nivel_gobierno": [
        "nivel_gobierno_nombre", "nivel_gobierno"
    ],
    "entidad": [
        "pliego_nombre", "ejecutora_nombre", "pliego", "entidad"
    ],
    "region": [
        "departamento_ejecutora_nombre", "departamento_ejecutora", "departamento_meta_nombre",
        "departamento", "region"
    ],
    "sector": [
        "funcion_nombre", "funcion", "sector_nombre", "sector"
    ],
    "monto_pia": [
        "monto_pia", "pia"
    ],
    "monto_pim": [
        "monto_pim", "pim"
    ],
    "monto_comprometido_anual": [
        "monto_comprometido_anual", "monto_comprometido"
    ],
    "monto_devengado": [
        "monto_devengado", "devengado"
    ],
    "monto_girado": [
        "monto_girado", "girado"
    ],
}


def _normalize_str(s: str) -> str:
    s = str(s).lower().strip()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^a-z0-9_]", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s


def _map_columns(df: pd.DataFrame) -> pd.DataFrame:
    norm_to_orig = {_normalize_str(col): col for col in df.columns}
    
    selected_cols = {}
    for canonical, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            norm_alias = _normalize_str(alias)
            if norm_alias in norm_to_orig:
                orig_col = norm_to_orig[norm_alias]
                selected_cols[orig_col] = canonical
                break
                
    sub_df = df[list(selected_cols.keys())].copy()
    sub_df = sub_df.rename(columns=selected_cols)
    return sub_df


def _to_numeric(series: pd.Series) -> pd.Series:
    cleaned = (
        series.astype(str)
        .str.replace(",", "", regex=False)
        .str.replace("S/.", "", regex=False)
        .str.replace("$", "", regex=False)
        .str.strip()
    )
    return pd.to_numeric(cleaned, errors="coerce")


REGION_CORRECTIONS = {
    "LIMA PROVINCIAS": "LIMA",
    "LIMA METROPOLITANA": "LIMA",
    "LIMA REGION": "LIMA",
    "PROVINCIA CONSTITUCIONAL DEL CALLAO": "CALLAO",
    "CALLAO": "CALLAO",
}


def _normalize_region(series: pd.Series) -> pd.Series:
    normalized = series.astype(str).str.upper().str.strip()
    normalized = normalized.apply(
        lambda x: unicodedata.normalize("NFD", str(x))
    )
    normalized = normalized.apply(
        lambda x: "".join(c for c in x if unicodedata.category(c) != "Mn")
    )
    normalized = normalized.replace(REGION_CORRECTIONS)
    return normalized


def limpiar_dataframe_con_metricas(df_raw: pd.DataFrame):
    filas_iniciales = len(df_raw)
    corregidas_contador = 0

    df = _map_columns(df_raw)

    amount_cols = ["monto_pia", "monto_pim", "monto_comprometido_anual", "monto_devengado", "monto_girado"]
    for col in amount_cols:
        if col in df.columns:
            cleaned_num = _to_numeric(df[col])
            diff_mask = cleaned_num.isna() & df[col].notna()
            corregidas_contador += int(diff_mask.sum())
            df[col] = cleaned_num.fillna(0)

    if "monto_pim" in df.columns and "monto_comprometido_anual" in df.columns:
        df["monto_pim"] = df["monto_pim"].astype("float64")
        mask = (df["monto_pim"] == 0) & (df["monto_comprometido_anual"] > 0)
        corregidas_contador += int(mask.sum())
        df.loc[mask, "monto_pim"] = df.loc[mask, "monto_comprometido_anual"]

    if "monto_pim" in df.columns and "monto_devengado" in df.columns:
        mask_dev = (df["monto_pim"] < df["monto_devengado"]) & (df["monto_devengado"] > 0)
        corregidas_contador += int(mask_dev.sum())
        df.loc[mask_dev, "monto_pim"] = (df.loc[mask_dev, "monto_devengado"] * 1.15).round(2)

    for col in ["anio", "mes"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    if "anio" in df.columns:
        df["es_periodo_atipico"] = df["anio"].isin([2020, 2021]).astype(bool)

    if "region" in df.columns:
        df["region"] = _normalize_region(df["region"])

    if "sector" in df.columns:
        df["sector"] = df["sector"].astype(str).str.upper().str.strip()

    if "nivel_gobierno" in df.columns:
        df["nivel_gobierno"] = df["nivel_gobierno"].astype(str).str.upper().str.strip()

    if "entidad" in df.columns:
        df["entidad"] = df["entidad"].astype(str).str.strip()

    filas_antes_corruptas = len(df)
    required_cols = [c for c in ["anio", "mes"] if c in df.columns]
    if required_cols:
        df = df.dropna(subset=required_cols)
    filas_corruptas = filas_antes_corruptas - len(df)

    filas_antes_duplicados = len(df)
    df = df.drop_duplicates()
    filas_duplicadas = filas_antes_duplicados - len(df)

    filas_limpias = len(df)
    filas_descartadas = filas_corruptas + filas_duplicadas

    metricas = {
        "filas_iniciales": filas_iniciales,
        "filas_corruptas": filas_corruptas,
        "filas_duplicadas": filas_duplicadas,
        "filas_descartadas": filas_descartadas,
        "filas_corregidas": corregidas_contador,
        "filas_limpias": filas_limpias,
    }

    return df, metricas


def limpiar_chunk(df: pd.DataFrame) -> pd.DataFrame:
    df_limpio, _ = limpiar_dataframe_con_metricas(df)
    return df_limpio


def limpiar_csv(path: Path):
    try:
        df = pd.read_csv(path, encoding="utf-8-sig", low_memory=False)
    except UnicodeDecodeError:
        df = pd.read_csv(path, encoding="latin-1", low_memory=False)

    df_limpio, metricas = limpiar_dataframe_con_metricas(df)
    return df_limpio, metricas
