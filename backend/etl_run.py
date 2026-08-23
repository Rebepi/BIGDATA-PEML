import sys
import os
import time
from datetime import datetime
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine
from app.etl.descarga import download_all, download_csv_for_year
from app.etl.limpieza import limpiar_csv
from app.etl.carga import cargar_dataframe, inicializar_tablas, seed_regiones
from app.etl.anomalias import ejecutar_deteccion
from app.models import ETLLog, GastoPublico, Alerta


def print_banner():
    print("=" * 70)
    print("  SISTEMA DE GASTO PUBLICO PERU — PIPELINE ETL AUTOMATIZADO")
    print("  Fuente: Portal de Datos Abiertos · MEF (2020–2026)")
    print("=" * 70)


def run_full_etl(years: list[int] = None, max_lines_per_year: int = 50000, force_fresh: bool = False):
    start_time = time.time()
    print_banner()

    if years is None:
        years = [2024, 2023, 2025]

    inicializar_tablas()
    db = SessionLocal()

    total_descargadas = 0
    total_descartadas = 0
    total_corregidas = 0
    total_insertadas = 0
    estado = "EXITOSO"
    detalle_error = None

    try:
        print(f"\n[1/4] INICIALIZANDO CATALOGO REGIONAL...")
        region_map = seed_regiones(db)
        print(f"      -> 25 Regiones del Peru verificadas en BD.")

        print(f"\n[2/4] DESCARGANDO DATASET DIRECTO DEL MEF...")
        print(f"      Ejercicios a procesar: {years}")
        paths = []
        for anio in years:
            print(f"      -> Descargando ejercicio fiscal {anio}...", end=" ", flush=True)
            p = download_csv_for_year(anio, max_lines=max_lines_per_year)
            if p and p.exists():
                size_mb = p.stat().st_size / (1024 * 1024)
                print(f"OK ({size_mb:.2f} MB)")
                paths.append((anio, p))
            else:
                print("OMITIDO / NO DISPONIBLE")

        print(f"\n[3/4] LIMPIEZA, NORMALIZACION Y VALIDACION DE REGISTROS...")
        for anio, path in paths:
            print(f"\n      --- PROCESANDO EJERCICIO {anio} ---")
            df_limpio, metricas = limpiar_csv(path)

            total_descargadas += metricas["filas_iniciales"]
            total_descartadas += metricas["filas_descartadas"]
            total_corregidas += metricas["filas_corregidas"]

            print(f"      * Filas leidas/descargadas : {metricas['filas_iniciales']:,}")
            print(f"      * Filas corruptas/incompletas: {metricas['filas_corruptas']:,}")
            print(f"      * Filas duplicadas omitidas : {metricas['filas_duplicadas']:,}")
            print(f"      * Filas corregidas (montos) : {metricas['filas_corregidas']:,}")
            print(f"      * Filas limpias listas      : {metricas['filas_limpias']:,}")

            if force_fresh:
                db.query(GastoPublico).filter(GastoPublico.anio == anio).delete()
                db.commit()

            insertadas = cargar_dataframe(df_limpio, db, region_map=region_map)
            total_insertadas += insertadas
            print(f"      * Filas insertadas a Postgres: {insertadas:,}")

        print(f"\n[4/4] EJECUTANDO MOTOR DE DETECCION DE ANOMALIAS...")
        num_alertas = ejecutar_deteccion(db)
        print(f"      -> {num_alertas} alertas registradas en base de datos.")


    except Exception as exc:
        estado = "ERROR"
        detalle_error = str(exc)
        print(f"\n[ERROR] Fallo en el pipeline: {exc}")
    finally:
        elapsed = time.time() - start_time
        log = ETLLog(
            fecha_ejecucion=datetime.utcnow(),
            filas_descargadas=total_descargadas,
            filas_procesadas=total_insertadas,
            filas_descartadas=total_descartadas,
            filas_corregidas=total_corregidas,
            tiempo_segundos=round(elapsed, 2),
            origen_datos="Portal Datos Abiertos MEF",
            estado=estado,
            detalle_error=detalle_error,
        )
        db.add(log)
        db.commit()
        db.close()

    print("\n" + "=" * 70)
    print("  RESUMEN FINAL DE AUDITORIA ETL")
    print("=" * 70)
    print(f"  * Estado del Pipeline       : {estado}")
    print(f"  * Filas Totales Descargadas : {total_descargadas:,}")
    print(f"  * Filas Descartadas (Filtro): {total_descartadas:,}")
    print(f"  * Filas Corregidas / Limpias: {total_corregidas:,}")
    print(f"  * Filas Cargadas a PostgreSQL: {total_insertadas:,}")
    print(f"  * Tiempo Total de Ejecucion : {elapsed:.2f} segundos")
    print(f"  * Registro en 'etl_logs'    : ID guardado exitosamente")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    years_arg = None
    if len(sys.argv) > 1:
        try:
            years_arg = [int(y) for y in sys.argv[1].split(",")]
        except ValueError:
            years_arg = None

    run_full_etl(years=years_arg)
