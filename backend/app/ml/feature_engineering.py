import numpy as np


def build_features(anio: int, mes: int, pim: float = 0.0, es_atipico: bool = False) -> list:
    t = (anio - 2012) * 12 + mes
    sin_1 = float(np.sin(2 * np.pi * mes / 12))
    cos_1 = float(np.cos(2 * np.pi * mes / 12))
    sin_2 = float(np.sin(4 * np.pi * mes / 12))
    cos_2 = float(np.cos(4 * np.pi * mes / 12))
    anio_norm = float(anio - 2012)
    pim_norm = float(pim) / 1e6
    atipico_flag = 1.0 if es_atipico else 0.0
    return [t, anio_norm, sin_1, cos_1, sin_2, cos_2, pim_norm, atipico_flag]


FEATURE_NAMES = ["t", "anio_norm", "sin_1", "cos_1", "sin_2", "cos_2", "pim_norm", "es_atipico"]
