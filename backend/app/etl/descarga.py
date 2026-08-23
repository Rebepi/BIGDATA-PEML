import os
import requests
from pathlib import Path

RAW_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "raw"

MEF_FS_URLS = {
    2026: "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2026-Gasto-Mensual.csv",
    2025: "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2025-Gasto-Mensual.csv",
    2024: "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2024-Gasto.csv",
    2023: "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2023-Gasto.csv",
    2022: "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2022-Gasto.csv",
    2021: "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2021-Gasto.csv",
    2020: "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2020-Gasto.csv",
    2019: "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2019-Gasto.csv",
    2018: "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2018-Gasto.csv",
    2017: "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2017-Gasto.csv",
    2016: "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2016-Gasto.csv",
    2015: "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2015-Gasto.csv",
    2014: "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2014-Gasto.csv",
    2013: "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2013-Gasto.csv",
    2012: "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2012-Gasto.csv",
}


def ensure_raw_dir():
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)


def download_csv_for_year(anio: int, max_bytes: int = None, max_lines: int = None) -> Path:
    ensure_raw_dir()
    dest = RAW_DATA_DIR / f"gasto_{anio}.csv"

    if dest.exists() and dest.stat().st_size > 0:
        return dest

    candidate_urls = []
    if anio in MEF_FS_URLS:
        candidate_urls.append(MEF_FS_URLS[anio])
    candidate_urls.append(f"https://fs.datosabiertos.mef.gob.pe/datastorefiles/{anio}-Gasto-Mensual.csv")
    candidate_urls.append(f"https://fs.datosabiertos.mef.gob.pe/datastorefiles/{anio}-Gasto.csv")

    headers = {"User-Agent": "Mozilla/5.0"}
    response = None
    for url in candidate_urls:
        try:
            r = requests.get(url, headers=headers, stream=True, timeout=30)
            if r.status_code == 200:
                response = r
                break
        except Exception:
            continue

    if not response:
        return None

    if max_lines:
        line_count = 0
        with open(dest, "wb") as f:
            for line in response.iter_lines():
                if line:
                    f.write(line + b"\n")
                    line_count += 1
                    if line_count >= max_lines:
                        break
        return dest

    downloaded = 0
    with open(dest, "wb") as f:
        for chunk in response.iter_content(chunk_size=1024 * 1024):
            if chunk:
                f.write(chunk)
                downloaded += len(chunk)
                if max_bytes and downloaded >= max_bytes:
                    break

    return dest


def download_all(years: list[int] = None, max_lines: int = None) -> list[Path]:
    if years is None:
        years = list(range(2026, 2011, -1))
    paths = []
    for anio in years:
        try:
            path = download_csv_for_year(anio, max_lines=max_lines)
            if path and path.exists():
                paths.append(path)
        except Exception:
            pass
    return paths
