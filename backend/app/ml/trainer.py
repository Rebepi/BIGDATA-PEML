import numpy as np
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split
from app.models import GastoPublico, ModeloMetrica
from app.ml.feature_engineering import build_features

ANIOS_ATIPICOS = {2020, 2021}

PESOS_ESTACIONALES = [
    0.06, 0.13, 0.22, 0.31, 0.41, 0.52,
    0.63, 0.75, 0.86, 0.92, 0.96, 1.0
]


def _calcular_metricas(modelo, X_val, y_val):
    if len(X_val) == 0:
        return 0.0, float("inf"), float("inf")
    y_pred = modelo.predict(X_val)
    r2 = float(r2_score(y_val, y_pred))
    if np.isnan(r2) or r2 < 0:
        r2 = 0.0
    mae = float(mean_absolute_error(y_val, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_val, y_pred)))
    return r2, mae, rmse


def _upsert_modelo_metrica(
    db: Session,
    region_id,
    sector,
    mejor_nombre,
    mejor_r2,
    mejor_mae,
    mejor_rmse,
    metricas_dict,
    cantidad_datos,
    anio_validacion,
):
    existente = db.query(ModeloMetrica).filter(
        ModeloMetrica.region_id == region_id,
        ModeloMetrica.sector == sector,
    ).first()

    campos = {
        "modelo_usado": mejor_nombre,
        "r2_score": round(mejor_r2, 6),
        "mae": round(mejor_mae, 2),
        "rmse": round(mejor_rmse, 2),
        "r2_ridge": round(metricas_dict["ridge"]["r2"], 6),
        "mae_ridge": round(metricas_dict["ridge"]["mae"], 2),
        "rmse_ridge": round(metricas_dict["ridge"]["rmse"], 2),
        "r2_rf": round(metricas_dict["rf"]["r2"], 6),
        "mae_rf": round(metricas_dict["rf"]["mae"], 2),
        "rmse_rf": round(metricas_dict["rf"]["rmse"], 2),
        "r2_gb": round(metricas_dict["gb"]["r2"], 6),
        "mae_gb": round(metricas_dict["gb"]["mae"], 2),
        "rmse_gb": round(metricas_dict["gb"]["rmse"], 2),
        "cantidad_datos": cantidad_datos,
        "anio_validacion": anio_validacion,
        "fecha_entrenamiento": datetime.now(timezone.utc),
    }

    if existente:
        for k, v in campos.items():
            setattr(existente, k, v)
    else:
        nuevo = ModeloMetrica(region_id=region_id, sector=sector, **campos)
        db.add(nuevo)

    db.commit()


def entrenar_y_seleccionar(region_id=None, sector=None, db: Session = None):
    if db is None:
        return None

    es_nacional = (region_id is None or region_id == 0)

    group_cols = [GastoPublico.anio, GastoPublico.mes]
    if not es_nacional:
        group_cols.append(GastoPublico.region_id)

    query = db.query(
        GastoPublico.anio,
        GastoPublico.mes,
        func.sum(GastoPublico.monto_devengado).label("devengado"),
        func.sum(GastoPublico.monto_pim).label("pim_sum"),
    ).filter(
        GastoPublico.mes.isnot(None),
        GastoPublico.monto_devengado.isnot(None),
        GastoPublico.monto_devengado > 0,
    )

    if not es_nacional:
        query = query.filter(GastoPublico.region_id == region_id)

    if sector:
        query = query.filter(GastoPublico.sector == sector)

    rows = (
        query
        .group_by(*group_cols)
        .order_by(GastoPublico.anio, GastoPublico.mes)
        .all()
    )

    anio_rows = {}
    for r in rows:
        anio = int(r.anio)
        mes = int(r.mes)
        if 1 <= mes <= 12:
            dev = float(r.devengado or 0)
            pim = float(r.pim_sum or 0)
            if anio not in anio_rows or mes >= anio_rows[anio]["mes"]:
                anio_rows[anio] = {
                    "mes": mes,
                    "devengado": dev,
                    "pim": pim,
                    "tasa_ejecucion": dev / pim if pim > 0 else 0.0,
                }

    if len(anio_rows) < 2:
        return None

    X = []
    y = []

    for anio, datos in sorted(anio_rows.items()):
        mes_corte = datos["mes"]
        dev_acum = datos["devengado"]
        pim = datos["pim"]
        tasa_al_corte = dev_acum / pim if pim > 0 else 0.0
        atipico = anio in ANIOS_ATIPICOS

        for mes in range(1, mes_corte + 1):
            peso = PESOS_ESTACIONALES[mes - 1]
            peso_corte = PESOS_ESTACIONALES[mes_corte - 1]
            tasa_mes = tasa_al_corte * (peso / peso_corte) if peso_corte > 0 else tasa_al_corte * peso
            dev_mes = pim * tasa_mes
            feats = build_features(anio, mes, pim, atipico)
            X.append(feats)
            y.append(dev_mes)

    if len(X) < 4:
        return None

    X_np = np.array(X)
    y_np = np.array(y)

    anios_disponibles = sorted(anio_rows.keys())
    anio_validacion = anios_disponibles[-1]

    if len(X_np) >= 10:
        X_train, X_val, y_train, y_val = train_test_split(X_np, y_np, test_size=0.2, random_state=42)
    else:
        X_train, X_val, y_train, y_val = X_np, X_np, y_np, y_np

    ridge = Ridge(alpha=1.0)
    ridge.fit(X_train, y_train)
    r2_ridge, mae_ridge, rmse_ridge = _calcular_metricas(ridge, X_val, y_val)

    rf = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)
    r2_rf, mae_rf, rmse_rf = _calcular_metricas(rf, X_val, y_val)

    gb = GradientBoostingRegressor(n_estimators=100, max_depth=3, learning_rate=0.1, random_state=42)
    gb.fit(X_train, y_train)
    r2_gb, mae_gb, rmse_gb = _calcular_metricas(gb, X_val, y_val)

    candidatos = [
        ("GradientBoosting", gb, r2_gb, mae_gb, rmse_gb),
        ("RandomForest", rf, r2_rf, mae_rf, rmse_rf),
        ("Ridge", ridge, r2_ridge, mae_ridge, rmse_ridge),
    ]
    candidatos.sort(key=lambda x: (-x[2], x[3]))
    mejor_nombre, mejor_modelo, mejor_r2, mejor_mae, mejor_rmse = candidatos[0]

    metricas_dict = {
        "ridge": {"r2": r2_ridge, "mae": mae_ridge, "rmse": rmse_ridge},
        "rf": {"r2": r2_rf, "mae": mae_rf, "rmse": rmse_rf},
        "gb": {"r2": r2_gb, "mae": mae_gb, "rmse": rmse_gb},
    }

    if db:
        _upsert_modelo_metrica(
            db=db,
            region_id=region_id,
            sector=sector,
            mejor_nombre=mejor_nombre,
            mejor_r2=mejor_r2,
            mejor_mae=mejor_mae,
            mejor_rmse=mejor_rmse,
            metricas_dict=metricas_dict,
            cantidad_datos=len(X),
            anio_validacion=anio_validacion,
        )

    return {
        "modelo": mejor_modelo,
        "modelo_nombre": mejor_nombre,
        "r2": mejor_r2,
        "mae": mejor_mae,
        "rmse": mejor_rmse,
        "anio_rows": anio_rows,
        "anio_validacion": anio_validacion,
        "comparativa": [
            {
                "nombre": n,
                "r2_score": round(r2, 4),
                "mae": round(m, 2),
                "rmse": round(rm, 2),
                "es_mejor": (n == mejor_nombre)
            }
            for n, _, r2, m, rm in [
                ("GradientBoosting", None, r2_gb, mae_gb, rmse_gb),
                ("RandomForest", None, r2_rf, mae_rf, rmse_rf),
                ("Ridge", None, r2_ridge, mae_ridge, rmse_ridge),
            ]
        ],
    }