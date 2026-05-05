import os
import warnings
from typing import List, Tuple

import joblib
import pickle
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import (
    classification_report,
    ConfusionMatrixDisplay,
    confusion_matrix,
    accuracy_score,
    f1_score,
)
from sklearn.utils.class_weight import compute_class_weight
from sklearn.feature_selection import mutual_info_classif
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans

from xgboost import XGBClassifier
from xgboost import callback as xgb_callback

import shap


DATA_PATH = os.path.join('data', 'ema_risk_dataset.csv')
ARTIFACTS_DIR = 'artifacts'

# Configuración general
TEST_SIZE = 0.2
RANDOM_STATE = 42
SCALE_NUMERIC = False  # Escalar variables numéricas (no requerido para árboles, pero disponible)
HANDLE_OUTLIERS = True  # Aplicar tratamiento de outliers con IQR clipping
TOP_FEATURES_PLOT = 20

# Ajustes para mejorar ALTO y MEDIO
CLASS_WEIGHT_OVERRIDES = {  # multiplicadores adicionales de peso por clase objetivo
    'ALTO': 3.0,
    'MEDIO': 1.4,
    # 'BAJO': 1.0  # por defecto
}
USE_CUSTOM_THRESHOLDS = True
FORCE_FIXED_THRESHOLDS = False  # usar optimización de umbrales para balancear clases
CLASS_PROBA_THRESHOLDS = {  # umbrales de decisión por clase
    'ALTO': 0.60,
    'MEDIO': 0.40,
}

# Sobre-muestreo de clase ALTO para mejorar su recall/precision
OVERSAMPLE_ALTO = True

# Optimización de umbrales enfocada en ALTO (ponderaciones del objetivo)
THR_W_ALTO_F1 = 0.7
THR_W_ACC = 0.3

# Priorizar aumentar TP/Recall de ALTO
PRIORITIZE_ALTO_TP = False
MIN_ALTO_PRECISION = 0.48

# Modo balanceado: optimiza F1(ALTO) y F1(MEDIO) junto con accuracy
BALANCE_OBJECTIVE = True
BAL_W_ALTO_F1 = 0.45
BAL_W_MEDIO_F1 = 0.25
BAL_W_ACC = 0.30
ACC_FLOOR = 0.88  # piso mínimo de accuracy para no degradar métricas

# Activar optimización Pareto para objetivos múltiples (prec_ALTO, rec_ALTO, f1_MEDIO, accuracy)
PARETO_OBJECTIVE = True


def gate_alto_then_multiclass(y_pred_proba: np.ndarray, y_true_labels: np.ndarray, classes: np.ndarray,
                              search_range: Tuple[float, float] = (0.40, 0.62), min_rec_alto: float = 0.60,
                              prefer_precision: bool = True) -> Tuple[float, np.ndarray]:
    """Umbral de gate para ALTO: si proba_ALTO >= thr -> ALTO; si no, elegir entre MEDIO/BAJO.
    Busca el thr que cumpla recall mínimo de ALTO y maximice precision (o F1 si no cumple).
    Devuelve el umbral elegido y las etiquetas predichas.
    """
    idx_alto = list(classes).index('ALTO')
    idx_medio = list(classes).index('MEDIO')
    idx_bajo = list(classes).index('BAJO') if 'BAJO' in classes else None
    y_true = y_true_labels

    best_thr = None
    best_metric = -1.0
    best_labels = None

    grid = np.linspace(search_range[0], search_range[1], num=23)
    for thr in grid:
        # Predicción gate: ALTO vs resto
        alto_mask = (y_pred_proba[:, idx_alto] >= thr)
        # Para no-ALTO, seleccionar MEDIO vs BAJO por probas
        rest_pred = np.argmax(y_pred_proba[:, [idx_medio, idx_bajo]] if idx_bajo is not None else y_pred_proba[:, [idx_medio]], axis=1)
        # Mapear 0->MEDIO, 1->BAJO
        rest_labels = np.array(['MEDIO' if r == 0 else 'BAJO' for r in rest_pred]) if idx_bajo is not None else np.array(['MEDIO'] * len(rest_pred))
        labels = np.where(alto_mask, 'ALTO', rest_labels)

        # Métricas ALTO
        alto_true = (y_true == 'ALTO')
        alto_pred = (labels == 'ALTO')
        tp = int((alto_true & alto_pred).sum())
        fp = int((~alto_true & alto_pred).sum())
        fn = int((alto_true & (~alto_pred)).sum())
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1a = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0

        metric = prec if prefer_precision else f1a
        # Prioridad: cumplir recall mínimo y maximizar precision; si no se cumple, maximizar F1
        if rec >= min_rec_alto:
            # elegir por precision
            if metric > best_metric:
                best_metric = metric
                best_thr = thr
                best_labels = labels
        else:
            # fallback por F1 si no cumple recall mínimo
            if not prefer_precision and f1a > best_metric:
                best_metric = f1a
                best_thr = thr
                best_labels = labels

    # Si no encontró solución con recall mínimo, seleccionar el mejor F1 en todo el grid
    if best_labels is None:
        best_f1 = -1.0
        best_thr2 = grid[0]
        best_labels2 = None
        for thr in grid:
            alto_mask = (y_pred_proba[:, idx_alto] >= thr)
            rest_pred = np.argmax(y_pred_proba[:, [idx_medio, idx_bajo]] if idx_bajo is not None else y_pred_proba[:, [idx_medio]], axis=1)
            rest_labels = np.array(['MEDIO' if r == 0 else 'BAJO' for r in rest_pred]) if idx_bajo is not None else np.array(['MEDIO'] * len(rest_pred))
            labels = np.where(alto_mask, 'ALTO', rest_labels)
            alto_true = (y_true == 'ALTO')
            alto_pred = (labels == 'ALTO')
            tp = int((alto_true & alto_pred).sum())
            fp = int((~alto_true & alto_pred).sum())
            fn = int((alto_true & (~alto_pred)).sum())
            prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
            rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            f1a = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0
            if f1a > best_f1:
                best_f1 = f1a
                best_thr2 = thr
                best_labels2 = labels
        best_thr = best_thr2
        best_labels = best_labels2
    return float(best_thr), best_labels


def train_alto_gate_cv(X_train_t: np.ndarray, y_train_labels: np.ndarray, classes: np.ndarray,
                       overrides: dict, random_state: int = 42,
                       search_range: Tuple[float, float] = (0.40, 0.70),
                       min_rec_alto: float = 0.60) -> Tuple[object, float]:
    """Entrena un gate binario ALTO vs NO_ALTO con CV estratificada para elegir umbral estable.
    Devuelve el calibrador (isotónico, prefit) y el umbral seleccionado (mediana de folds).
    """
    alto_idx = list(classes).index('ALTO')
    y_gate = (y_train_labels == alto_idx).astype(int)

    # Pesos de muestra para gate
    w_alto = overrides.get('ALTO', 1.0)
    sample_w = np.where(y_gate == 1, w_alto, 1.0).astype(float)

    # Configuración del modelo binario
    gate_model = XGBClassifier(
        objective='binary:logistic',
        n_estimators=400,
        max_depth=5,
        min_child_weight=4,
        learning_rate=0.04,
        subsample=0.85,
        colsample_bytree=0.85,
        reg_lambda=1.2,
        reg_alpha=0.4,
        gamma=0.8,
        tree_method='hist',
        n_jobs=-1,
        random_state=random_state,
        eval_metric='logloss',
    )

    # CV estratificada para buscar umbral
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)
    thresholds = []
    for tr_idx, va_idx in skf.split(X_train_t, y_gate):
        X_tr, X_va = X_train_t[tr_idx], X_train_t[va_idx]
        y_tr, y_va = y_gate[tr_idx], y_gate[va_idx]
        sw_tr = sample_w[tr_idx]

        gate_model.fit(X_tr, y_tr, sample_weight=sw_tr, eval_set=[(X_tr, y_tr), (X_va, y_va)], verbose=False)
        from sklearn.calibration import CalibratedClassifierCV
        calibrator_local = CalibratedClassifierCV(gate_model, cv='prefit', method='isotonic')
        calibrator_local.fit(X_tr, y_tr)
        proba_va = calibrator_local.predict_proba(X_va)[:, 1]

        # buscar threshold por recall mínimo y máxima precisión
        grid = np.linspace(search_range[0], search_range[1], num=31)
        best_thr = grid[0]
        best_prec = -1.0
        best_f1 = -1.0
        for thr in grid:
            pred_va = (proba_va >= thr).astype(int)
            tp = int(((y_va == 1) & (pred_va == 1)).sum())
            fp = int(((y_va == 0) & (pred_va == 1)).sum())
            fn = int(((y_va == 1) & (pred_va == 0)).sum())
            prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
            rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
            f1a = (2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0
            if rec >= min_rec_alto and prec > best_prec:
                best_prec = prec
                best_thr = thr
            best_f1 = max(best_f1, f1a)
        thresholds.append(float(best_thr))

    # umbral final: mediana de thresholds (robusto)
    thr_final = float(np.median(thresholds)) if thresholds else 0.50

    # Entrenar calibrador final en todo el entrenamiento
    gate_model.fit(X_train_t, y_gate, sample_weight=sample_w, verbose=False)
    from sklearn.calibration import CalibratedClassifierCV
    calibrator = CalibratedClassifierCV(gate_model, cv='prefit', method='isotonic')
    calibrator.fit(X_train_t, y_gate)
    return calibrator, thr_final


def train_alto_validator_cv(X_train_t: np.ndarray, y_train_labels: np.ndarray, classes: np.ndarray,
                            overrides: dict, random_state: int = 42,
                            search_range: Tuple[float, float] = (0.50, 0.85),
                            min_prec_alto: float = 0.55) -> Tuple[object, float]:
    """Entrena un validador binario de ALTO (true ALTO vs resto) y elige umbral por CV
    maximizando precisión con un mínimo de precisión objetivo para no degradar accuracy.
    """
    alto_idx = list(classes).index('ALTO')
    y_gate = (y_train_labels == alto_idx).astype(int)

    w_alto = overrides.get('ALTO', 1.0)
    sample_w = np.where(y_gate == 1, w_alto, 1.0).astype(float)

    val_model = XGBClassifier(
        objective='binary:logistic',
        n_estimators=300,
        max_depth=4,
        min_child_weight=5,
        learning_rate=0.05,
        subsample=0.85,
        colsample_bytree=0.85,
        reg_lambda=1.5,
        reg_alpha=0.6,
        gamma=1.0,
        tree_method='hist',
        n_jobs=-1,
        random_state=random_state,
        eval_metric='logloss',
    )

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)
    thresholds = []
    for tr_idx, va_idx in skf.split(X_train_t, y_gate):
        X_tr, X_va = X_train_t[tr_idx], X_train_t[va_idx]
        y_tr, y_va = y_gate[tr_idx], y_gate[va_idx]
        sw_tr = sample_w[tr_idx]

        val_model.fit(X_tr, y_tr, sample_weight=sw_tr, eval_set=[(X_tr, y_tr), (X_va, y_va)], verbose=False)
        from sklearn.calibration import CalibratedClassifierCV
        calibrator_local = CalibratedClassifierCV(val_model, cv='prefit', method='isotonic')
        calibrator_local.fit(X_tr, y_tr)
        proba_va = calibrator_local.predict_proba(X_va)[:, 1]

        grid = np.linspace(search_range[0], search_range[1], num=36)
        best_thr = grid[0]
        best_prec = -1.0
        for thr in grid:
            pred_va = (proba_va >= thr).astype(int)
            tp = int(((y_va == 1) & (pred_va == 1)).sum())
            fp = int(((y_va == 0) & (pred_va == 1)).sum())
            prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
            if prec >= min_prec_alto and prec > best_prec:
                best_prec = prec
                best_thr = thr
        thresholds.append(float(best_thr))

    thr_final = float(np.median(thresholds)) if thresholds else 0.65

    val_model.fit(X_train_t, y_gate, sample_weight=sample_w, verbose=False)
    from sklearn.calibration import CalibratedClassifierCV
    calibrator = CalibratedClassifierCV(val_model, cv='prefit', method='isotonic')
    calibrator.fit(X_train_t, y_gate)
    return calibrator, thr_final


def ensure_artifacts_dir(path: str = ARTIFACTS_DIR) -> None:
    os.makedirs(path, exist_ok=True)


def sanitize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Normaliza nombres de columnas a snake_case y elimina espacios/acentos comunes."""
    df = df.copy()
    df.columns = (
        df.columns
        .str.strip()
        .str.replace(" ", "_", regex=False)
        .str.replace("-", "_", regex=False)
        .str.replace("/", "_", regex=False)
        .str.lower()
    )
    return df


def coerce_types(df: pd.DataFrame) -> pd.DataFrame:
    """Intenta convertir columnas object que parecen numéricas a tipo numérico."""
    df = df.copy()
    for col in df.columns:
        if df[col].dtype == 'object':
            # Intenta convertir a numérico si es posible
            converted = pd.to_numeric(df[col], errors='coerce')
            # Si al menos 80% de los valores son numéricos tras conversión, mantener
            non_na_ratio = converted.notna().mean()
            if non_na_ratio >= 0.8:
                df[col] = converted
    return df


def drop_irrelevant_and_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    """Elimina duplicados y columnas irrelevantes (constantes)."""
    df = df.copy()
    before = len(df)
    df = df.drop_duplicates()
    after = len(df)
    print(f"\n[Info] Filas duplicadas eliminadas: {before - after}")

    # Eliminar columnas constantes (sin variación)
    nunique = df.nunique(dropna=False)
    constant_cols = nunique[nunique <= 1].index.tolist()
    if constant_cols:
        print(f"[Info] Columnas constantes eliminadas: {constant_cols}")
        df = df.drop(columns=constant_cols)
    return df


def add_feature_engineering(X: pd.DataFrame, y: pd.Series, max_base: int = 8) -> Tuple[pd.DataFrame, List[str]]:
    """Agrega ratios, términos cuadráticos e interacciones entre top features numéricas.
    - Selección de top features por varianza (proxy rápida de importancia).
    - Ratios seguros (denominador + eps) entre algunas parejas.
    - Términos cuadráticos y productos pares para capturar no linealidades.
    """
    X = X.copy()
    new_cols: List[str] = []
    eps = 1e-6
    num_cols = X.select_dtypes(include=['number']).columns.tolist()
    if not num_cols:
        return X, new_cols

    # Top por varianza
    variances = X[num_cols].var(numeric_only=True).sort_values(ascending=False)
    base_cols = [c for c in variances.index.tolist()[:max_base] if c in num_cols]
    if len(base_cols) < 2:
        return X, new_cols

    # Términos cuadráticos
    for c in base_cols:
        new_name = f"{c}__sq"
        X[new_name] = X[c] ** 2
        new_cols.append(new_name)

    # Interacciones pares (productos) - limitar a primeras 6 para no explotar dimensionalidad
    pair_cols = base_cols[:6]
    for i in range(len(pair_cols)):
        for j in range(i + 1, len(pair_cols)):
            ci, cj = pair_cols[i], pair_cols[j]
            new_name = f"{ci}__x__{cj}"
            X[new_name] = X[ci] * X[cj]
            new_cols.append(new_name)

    # Ratios: usar primeras 4 columnas base como numeradores y denominadores
    ratio_cols = base_cols[:4]
    for i in range(len(ratio_cols)):
        for j in range(len(ratio_cols)):
            if i == j:
                continue
            ci, cj = ratio_cols[i], ratio_cols[j]
            new_name = f"{ci}__div__{cj}"
            denom = X[cj].abs() + eps
            X[new_name] = X[ci] / denom
            new_cols.append(new_name)

    return X, new_cols


def iqr_clip_outliers(df: pd.DataFrame, numeric_cols: List[str]) -> pd.DataFrame:
    """Aplica clipping basado en IQR para outliers en columnas numéricas."""
    df = df.copy()
    for col in numeric_cols:
        series = df[col]
        if series.isnull().all():
            continue
        q1 = series.quantile(0.25)
        q3 = series.quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        df[col] = series.clip(lower, upper)
    return df


def split_xy(df: pd.DataFrame, target_col: str) -> Tuple[pd.DataFrame, pd.Series]:
    if target_col not in df.columns:
        raise ValueError(f"La columna target '{target_col}' no existe en el dataset.")

    # Eliminar filas con target faltante
    df = df[df[target_col].notna()].copy()
    X = df.drop(columns=[target_col])
    y = df[target_col]
    return X, y


def add_boundary_features_train_test(X_train: pd.DataFrame, y_train_labels: np.ndarray,
                                     X_test: pd.DataFrame, classes_names: np.ndarray) -> Tuple[pd.DataFrame, pd.DataFrame, List[str]]:
    """Añade features de distancia a centroides de ALTO y MEDIO y su margen (MEDIO-ALTO).
    Stats se calculan sobre el set de entrenamiento para evitar fuga.
    """
    added = []
    X_train = X_train.copy()
    X_test = X_test.copy()
    num_cols = X_train.select_dtypes(include=['number']).columns.tolist()
    if not num_cols:
        return X_train, X_test, added

    # índices de clases
    name_to_idx = {name: i for i, name in enumerate(classes_names)}
    idx_alto = name_to_idx.get('ALTO', None)
    idx_medio = name_to_idx.get('MEDIO', None)
    if idx_alto is None or idx_medio is None:
        return X_train, X_test, added

    # centroides en entrenamiento
    alto_mask = (y_train_labels == idx_alto)
    medio_mask = (y_train_labels == idx_medio)
    if alto_mask.sum() == 0 or medio_mask.sum() == 0:
        return X_train, X_test, added

    alto_centroid = X_train.loc[alto_mask, num_cols].mean(numeric_only=True)
    medio_centroid = X_train.loc[medio_mask, num_cols].mean(numeric_only=True)

    def dist_row_matrix(M: pd.DataFrame, center: pd.Series) -> np.ndarray:
        # Euclidea en espacio numérico seleccionado
        D = (M[num_cols] - center.values) ** 2
        return np.sqrt(D.sum(axis=1)).values

    # Distancias para train
    X_train['dist_to_ALTO'] = dist_row_matrix(X_train, alto_centroid)
    X_train['dist_to_MEDIO'] = dist_row_matrix(X_train, medio_centroid)
    X_train['medio_minus_alto_dist'] = X_train['dist_to_MEDIO'] - X_train['dist_to_ALTO']
    # Distancias para test
    X_test['dist_to_ALTO'] = dist_row_matrix(X_test, alto_centroid)
    X_test['dist_to_MEDIO'] = dist_row_matrix(X_test, medio_centroid)
    X_test['medio_minus_alto_dist'] = X_test['dist_to_MEDIO'] - X_test['dist_to_ALTO']

    added.extend(['dist_to_ALTO', 'dist_to_MEDIO', 'medio_minus_alto_dist'])
    return X_train, X_test, added


def add_error_driven_flags(X_train: pd.DataFrame, y_train_labels: np.ndarray,
                           X_test: pd.DataFrame, classes_names: np.ndarray,
                           top_n: int = 8) -> Tuple[pd.DataFrame, pd.DataFrame, List[str]]:
    """Crea flags y transformaciones enfocadas en frontera MEDIO-ALTO usando sólo stats del train.
    - Selecciona top_n columnas numéricas por diferencia absoluta de medias entre ALTO y MEDIO.
    - Agrega flags: > Q75(ALTO) y dentro de banda [Q40,Q60](MEDIO).
    - Añade términos cuadráticos de dichas columnas para captar no-linealidad.
    - Limita la cantidad de nuevas columnas para evitar explosión dimensional.
    """
    added: List[str] = []
    X_tr = X_train.copy()
    X_te = X_test.copy()
    num_cols = X_tr.select_dtypes(include=['number']).columns.tolist()
    if not num_cols:
        return X_tr, X_te, added

    # índices de clases
    name_to_idx = {name: i for i, name in enumerate(classes_names)}
    idx_alto = name_to_idx.get('ALTO', None)
    idx_medio = name_to_idx.get('MEDIO', None)
    if idx_alto is None or idx_medio is None:
        return X_tr, X_te, added

    alto_mask = (y_train_labels == idx_alto)
    medio_mask = (y_train_labels == idx_medio)
    if alto_mask.sum() == 0 or medio_mask.sum() == 0:
        return X_tr, X_te, added

    # diferencias de medias
    alto_means = X_tr.loc[alto_mask, num_cols].mean(numeric_only=True)
    medio_means = X_tr.loc[medio_mask, num_cols].mean(numeric_only=True)
    diffs = (alto_means - medio_means).abs().sort_values(ascending=False)
    focus_cols = [c for c in diffs.index.tolist()[:top_n] if c in num_cols]
    if not focus_cols:
        return X_tr, X_te, added

    # cuantiles por clase
    q75_alto = X_tr.loc[alto_mask, focus_cols].quantile(0.75)
    q40_medio = X_tr.loc[medio_mask, focus_cols].quantile(0.40)
    q60_medio = X_tr.loc[medio_mask, focus_cols].quantile(0.60)

    # flags y cuadrados
    for c in focus_cols:
        # > Q75 de ALTO
        flag_a_tr = (X_tr[c] > float(q75_alto[c])).astype(int)
        flag_a_te = (X_te[c] > float(q75_alto[c])).astype(int)
        col_a = f"{c}__gtQ75_ALTO"
        X_tr[col_a] = flag_a_tr
        X_te[col_a] = flag_a_te
        added.append(col_a)

        # dentro de banda central de MEDIO
        flag_m_tr = ((X_tr[c] >= float(q40_medio[c])) & (X_tr[c] <= float(q60_medio[c]))).astype(int)
        flag_m_te = ((X_te[c] >= float(q40_medio[c])) & (X_te[c] <= float(q60_medio[c]))).astype(int)
        col_m = f"{c}__inQ40Q60_MEDIO"
        X_tr[col_m] = flag_m_tr
        X_te[col_m] = flag_m_te
        added.append(col_m)

        # término cuadrático
        col_sq = f"{c}__sq_focus"
        X_tr[col_sq] = X_tr[c] ** 2
        X_te[col_sq] = X_te[c] ** 2
        added.append(col_sq)

    # Flags adicionales basadas en distancias y frontera calculadas sólo con stats del train
    try:
        # IQR de frontera MEDIO-ALTO
        if 'medio_minus_alto_dist' in X_tr.columns:
            b = X_tr['medio_minus_alto_dist']
            q1 = float(b.quantile(0.25))
            q3 = float(b.quantile(0.75))
            iqr = q3 - q1
            thr_b = 0.2 * iqr
            col_b = 'medio_minus_alto_dist__gtIQR02'
            X_tr[col_b] = (X_tr['medio_minus_alto_dist'] > thr_b).astype(int)
            X_te[col_b] = (X_te['medio_minus_alto_dist'] > thr_b).astype(int)
            added.append(col_b)

        # Distancias relativas a centroides
        if 'dist_to_ALTO' in X_tr.columns and 'dist_to_MEDIO' in X_tr.columns:
            # Percentiles sobre entrenamiento por subgrupos
            d_alto_q25 = float(X_tr.loc[alto_mask, 'dist_to_ALTO'].quantile(0.25)) if alto_mask.any() else float(X_tr['dist_to_ALTO'].quantile(0.25))
            d_medio_q75 = float(X_tr.loc[medio_mask, 'dist_to_MEDIO'].quantile(0.75)) if medio_mask.any() else float(X_tr['dist_to_MEDIO'].quantile(0.75))
            col_da = 'dist_to_ALTO__ltQ25_ALTO'
            col_dm = 'dist_to_MEDIO__gtQ75_MEDIO'
            X_tr[col_da] = (X_tr['dist_to_ALTO'] < d_alto_q25).astype(int)
            X_te[col_da] = (X_te['dist_to_ALTO'] < d_alto_q25).astype(int)
            added.append(col_da)
            X_tr[col_dm] = (X_tr['dist_to_MEDIO'] > d_medio_q75).astype(int)
            X_te[col_dm] = (X_te['dist_to_MEDIO'] > d_medio_q75).astype(int)
            added.append(col_dm)

            # Interacción: cerca de ALTO y frontera alta
            if 'medio_minus_alto_dist__gtIQR02' in X_tr.columns:
                col_int = 'near_ALTO_and_border_high'
                X_tr[col_int] = ((X_tr[col_da] == 1) & (X_tr['medio_minus_alto_dist__gtIQR02'] == 1)).astype(int)
                X_te[col_int] = ((X_te[col_da] == 1) & (X_te['medio_minus_alto_dist__gtIQR02'] == 1)).astype(int)
                added.append(col_int)
    except Exception:
        # Si algo falla, continuamos sin estas flags adicionales
        pass

    return X_tr, X_te, added


def build_preprocessor(numeric_cols: List[str], categorical_cols: List[str]):
    num_steps = []
    # Imputación numérica
    num_steps.append(('imputer', SimpleImputer(strategy='median')))
    if SCALE_NUMERIC:
        num_steps.append(('scaler', StandardScaler()))

    cat_steps = [
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ]

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', make_pipeline_from_steps(num_steps), numeric_cols),
            ('cat', make_pipeline_from_steps(cat_steps), categorical_cols),
        ],
        remainder='drop'
    )
    return preprocessor


def make_pipeline_from_steps(steps):
    # Utilidad mínima para crear un pipeline compatible dentro de ColumnTransformer
    from sklearn.pipeline import Pipeline
    return Pipeline(steps=steps)


def get_feature_names(ct: ColumnTransformer) -> List[str]:
    try:
        names = ct.get_feature_names_out()
        # Limpia prefijos 'num__' y 'cat__'
        clean = [n.replace('num__', '').replace('cat__', '') for n in names]
        return clean
    except Exception:
        return [f"f_{i}" for i in range(ct.transformers_[0][2].__len__() + ct.transformers_[1][2].__len__())]


def apply_feature_selection(X_train_t: np.ndarray, y_train: np.ndarray,
                            X_test_t: np.ndarray, feature_names: List[str], k: int | None = None) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """Selecciona top-k features por mutual information para reducir ruido y mejorar separación.
    """
    if k is None:
        k = min(200, X_train_t.shape[1])
    mi = mutual_info_classif(X_train_t, y_train, discrete_features=False)
    idx = np.argsort(mi)[::-1][:k]
    X_train_sel = X_train_t[:, idx]
    X_test_sel = X_test_t[:, idx]
    names_sel = [feature_names[i] if i < len(feature_names) else f"f_{i}" for i in idx]
    return X_train_sel, X_test_sel, names_sel


def compute_sample_weights(y_encoded: np.ndarray, classes_names: np.ndarray, overrides: dict | None = None) -> np.ndarray:
    classes_vals = np.unique(y_encoded)
    class_weights = compute_class_weight(class_weight='balanced', classes=classes_vals, y=y_encoded)
    weight_map = {c: w for c, w in zip(classes_vals, class_weights)}

    # Aplica multiplicadores por clase si se especificaron
    if overrides:
        idx_to_name = {i: classes_names[i] for i in range(len(classes_names))}
        for c in classes_vals:
            name = idx_to_name.get(c)
            mult = overrides.get(name, 1.0)
            weight_map[c] *= mult

    return np.array([weight_map[c] for c in y_encoded])


def predict_with_thresholds(y_proba: np.ndarray, classes_names: np.ndarray, thresholds: dict) -> np.ndarray:
    name_to_idx = {name: i for i, name in enumerate(classes_names)}
    out = []
    for row in y_proba:
        # Regla ALTO
        alto_idx = name_to_idx.get('ALTO')
        medio_idx = name_to_idx.get('MEDIO')
        chosen = None
        if alto_idx is not None and row[alto_idx] >= thresholds.get('ALTO', 1.1):
            chosen = 'ALTO'
        elif medio_idx is not None and row[medio_idx] >= thresholds.get('MEDIO', 1.1):
            chosen = 'MEDIO'
        if chosen is None:
            # Argmax por defecto
            chosen = classes_names[np.argmax(row)]
        out.append(chosen)
    return np.array(out)

def per_class_confusion_counts(y_true_labels: np.ndarray, y_pred_labels: np.ndarray, classes_names: np.ndarray) -> pd.DataFrame:
    """Calcula TN, TP, FN, FP por clase a partir de la matriz de confusión multiclase."""
    cm = confusion_matrix(y_true_labels, y_pred_labels, labels=list(classes_names))
    total = cm.sum()
    rows = []
    for i, name in enumerate(classes_names):
        tp = cm[i, i]
        fn = cm[i, :].sum() - tp
        fp = cm[:, i].sum() - tp
        tn = total - (tp + fn + fp)
        rows.append({
            'class': name,
            'TN': int(tn),
            'TP': int(tp),
            'FN': int(fn),
            'FP': int(fp),
        })
    return pd.DataFrame(rows, columns=['class', 'TN', 'TP', 'FN', 'FP'])


def optimize_thresholds(y_proba: np.ndarray, y_true_labels: np.ndarray, classes_names: np.ndarray,
                        base_thresholds: dict | None = None) -> dict:
    """Busca umbrales que mejoren accuracy y precisión en ALTO/MEDIO.
    Objetivo: maximize accuracy + 0.5*(precision_ALTO + precision_MEDIO).
    """
    from sklearn.metrics import precision_recall_fscore_support, accuracy_score

    alto_grid = np.linspace(0.45, 0.75, 7)
    medio_grid = np.linspace(0.35, 0.65, 7)
    best_obj = -np.inf
    best_thr = dict(base_thresholds or {})
    for ta in alto_grid:
        for tm in medio_grid:
            thr = dict(base_thresholds or {})
            thr['ALTO'] = ta
            thr['MEDIO'] = tm
            y_pred_labels = predict_with_thresholds(y_proba, classes_names, thr)
            acc = accuracy_score(y_true_labels, y_pred_labels)
            # Precisión por clase específica
            # Métricas por clase
            precs, recs, f1s, _ = precision_recall_fscore_support(
                y_true_labels, y_pred_labels, labels=['ALTO', 'MEDIO'], average=None
            )
            f1_alto = f1s[0]
            obj = THR_W_ALTO_F1 * f1_alto + THR_W_ACC * acc
            if obj > best_obj:
                best_obj = obj
                best_thr = {'ALTO': ta, 'MEDIO': tm}
    print(f"[Ajuste] Umbrales óptimos -> ALTO: {best_thr['ALTO']:.2f}, MEDIO: {best_thr['MEDIO']:.2f}")
    return best_thr


def optimize_thresholds_recall_alto(y_proba: np.ndarray, y_true_labels: np.ndarray, classes_names: np.ndarray,
                                    base_thresholds: dict | None = None) -> dict:
    """Optimiza umbrales maximizando el recall de ALTO con un mínimo de precisión."""
    from sklearn.metrics import precision_recall_fscore_support, accuracy_score

    alto_grid = np.linspace(0.40, 0.70, 7)
    medio_grid = np.linspace(0.35, 0.65, 7)
    best_obj = -np.inf
    best_thr = dict(base_thresholds or {})
    for ta in alto_grid:
        for tm in medio_grid:
            thr = dict(base_thresholds or {})
            thr['ALTO'] = ta
            thr['MEDIO'] = tm
            y_pred_labels = predict_with_thresholds(y_proba, classes_names, thr)
            acc = accuracy_score(y_true_labels, y_pred_labels)
            precs, recs, _, _ = precision_recall_fscore_support(
                y_true_labels, y_pred_labels, labels=['ALTO'], average=None
            )
            prec_alto = precs[0]
            rec_alto = recs[0]
            # Penaliza si la precisión de ALTO cae por debajo del mínimo
            if prec_alto < MIN_ALTO_PRECISION:
                continue
            obj = rec_alto + 0.1 * acc
            if obj > best_obj:
                best_obj = obj
                best_thr = {'ALTO': ta, 'MEDIO': tm}
    print(f"[Ajuste] Umbrales óptimos (recall ALTO) -> ALTO: {best_thr['ALTO']:.2f}, MEDIO: {best_thr['MEDIO']:.2f}")
    return best_thr


# Optimizador balanceado: combina F1 de ALTO y MEDIO con la accuracy global
def optimize_thresholds_balance(y_proba: np.ndarray, y_true_labels: np.ndarray, classes_names: np.ndarray,
                                base_thresholds: dict | None = None) -> dict:
    from sklearn.metrics import precision_recall_fscore_support, accuracy_score

    alto_grid = np.linspace(0.48, 0.62, 8)
    medio_grid = np.linspace(0.38, 0.62, 13)
    best_obj = -np.inf
    best_thr = dict(base_thresholds or {})
    for ta in alto_grid:
        for tm in medio_grid:
            thr = dict(base_thresholds or {})
            thr['ALTO'] = ta
            thr['MEDIO'] = tm
            y_pred_labels = predict_with_thresholds(y_proba, classes_names, thr)
            acc = accuracy_score(y_true_labels, y_pred_labels)

            # F1 por clase
            _, _, f1s_alto, _ = precision_recall_fscore_support(
                y_true_labels, y_pred_labels, labels=['ALTO'], average=None, zero_division=0
            )
            _, _, f1s_medio, _ = precision_recall_fscore_support(
                y_true_labels, y_pred_labels, labels=['MEDIO'], average=None, zero_division=0
            )

            # También verificamos precisión mínima para ALTO
            precs_alto, _, _, _ = precision_recall_fscore_support(
                y_true_labels, y_pred_labels, labels=['ALTO'], average=None, zero_division=0
            )
            # Restringir por piso de accuracy y precisión mínima de ALTO
            if (acc < ACC_FLOOR) or (precs_alto[0] < MIN_ALTO_PRECISION):
                continue

            obj = BAL_W_ALTO_F1 * f1s_alto[0] + BAL_W_MEDIO_F1 * f1s_medio[0] + BAL_W_ACC * acc
            if obj > best_obj:
                best_obj = obj
                best_thr = {'ALTO': ta, 'MEDIO': tm}
    print(f"[Ajuste] Umbrales óptimos (balance) -> ALTO: {best_thr['ALTO']:.2f}, MEDIO: {best_thr['MEDIO']:.2f}")
    return best_thr


# Optimización Pareto para encontrar punto dulce en ALTO sin degradar MEDIO/BAJO
def optimize_thresholds_pareto(y_proba: np.ndarray, y_true_labels: np.ndarray, classes_names: np.ndarray,
                               base_thresholds: dict | None = None,
                               min_prec_alto: float = 0.48,
                               min_rec_alto: float = 0.60) -> dict:
    from sklearn.metrics import precision_recall_fscore_support, accuracy_score

    alto_grid = np.linspace(0.48, 0.62, 8)
    medio_grid = np.linspace(0.40, 0.60, 9)

    candidates = []
    for ta in alto_grid:
        for tm in medio_grid:
            thr = dict(base_thresholds or {})
            thr['ALTO'] = ta
            thr['MEDIO'] = tm
            y_pred_labels = predict_with_thresholds(y_proba, classes_names, thr)
            acc = accuracy_score(y_true_labels, y_pred_labels)
            prec_alto, rec_alto, f1_alto, _ = precision_recall_fscore_support(
                y_true_labels, y_pred_labels, labels=['ALTO'], average=None, zero_division=0
            )
            _, _, f1_medio, _ = precision_recall_fscore_support(
                y_true_labels, y_pred_labels, labels=['MEDIO'], average=None, zero_division=0
            )
            candidates.append({
                'ALTO': ta,
                'MEDIO': tm,
                'acc': acc,
                'prec_alto': float(prec_alto[0]),
                'rec_alto': float(rec_alto[0]),
                'f1_medio': float(f1_medio[0])
            })

    # Pareto: maximizar (prec_alto, rec_alto, f1_medio, acc)
    def dominates(a, b):
        return (
            a['prec_alto'] >= b['prec_alto'] and
            a['rec_alto'] >= b['rec_alto'] and
            a['f1_medio'] >= b['f1_medio'] and
            a['acc'] >= b['acc'] and
            (a['prec_alto'] > b['prec_alto'] or a['rec_alto'] > b['rec_alto'] or a['f1_medio'] > b['f1_medio'] or a['acc'] > b['acc'])
        )

    pareto = []
    for c in candidates:
        if not any(dominates(other, c) for other in candidates):
            pareto.append(c)

    # Selección: primero cumplir restricciones de ALTO, luego maximizar acc y f1_medio
    feasible = [p for p in pareto if p['prec_alto'] >= min_prec_alto and p['rec_alto'] >= min_rec_alto]
    if feasible:
        best = sorted(feasible, key=lambda x: (x['acc'], x['f1_medio'], x['prec_alto'], x['rec_alto']), reverse=True)[0]
    else:
        # El más cercano a las metas (minimizar déficit)
        def deficit(x):
            dp = max(0.0, min_prec_alto - x['prec_alto'])
            dr = max(0.0, min_rec_alto - x['rec_alto'])
            # penalizar más el recall si está bajo
            return 2.0 * dr + dp - 0.2 * x['acc'] - 0.1 * x['f1_medio']
        best = sorted(pareto, key=lambda x: deficit(x))[0]

    print(f"[Ajuste] Pareto elegido -> ALTO: {best['ALTO']:.2f}, MEDIO: {best['MEDIO']:.2f} | prec_ALTO={best['prec_alto']:.2f}, rec_ALTO={best['rec_alto']:.2f}, f1_MEDIO={best['f1_medio']:.2f}, acc={best['acc']:.4f}")
    return {'ALTO': best['ALTO'], 'MEDIO': best['MEDIO']}


def plot_feature_importance(model: XGBClassifier, feature_names: List[str], top_k: int = TOP_FEATURES_PLOT):
    importances = model.feature_importances_
    idx_sorted = np.argsort(importances)[::-1]
    top_idx = idx_sorted[:top_k]
    plt.figure(figsize=(10, max(4, int(top_k * 0.4))))
    plt.barh(range(len(top_idx)), importances[top_idx][::-1])
    plt.yticks(range(len(top_idx)), [feature_names[i] for i in top_idx][::-1])
    plt.xlabel('Importancia')
    plt.title('Top características por importancia (XGBoost)')
    plt.tight_layout()
    out_path = os.path.join(ARTIFACTS_DIR, 'feature_importance.png')
    plt.savefig(out_path, dpi=160)
    plt.close()
    print(f"[Artefacto] Importancias de características guardadas en: {out_path}")


def plot_confusion_matrix(y_true_labels: np.ndarray, y_pred_labels: np.ndarray, labels: List[str]):
    cm = confusion_matrix(y_true_labels, y_pred_labels, labels=labels)
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=labels)
    fig, ax = plt.subplots(figsize=(6, 6))
    disp.plot(ax=ax, xticks_rotation=45, cmap='Blues')
    plt.title('Matriz de confusión')
    plt.tight_layout()
    out_path = os.path.join(ARTIFACTS_DIR, 'confusion_matrix.png')
    plt.savefig(out_path, dpi=160)
    plt.close(fig)
    print(f"[Artefacto] Matriz de confusión guardada en: {out_path}")


def shap_summary(model: XGBClassifier, X_train_transformed: np.ndarray, feature_names: List[str], max_samples: int = 1000):
    warnings.filterwarnings('ignore')
    # Muestra para acelerar SHAP si el dataset es grande
    if X_train_transformed.shape[0] > max_samples:
        idx = np.random.RandomState(RANDOM_STATE).choice(X_train_transformed.shape[0], max_samples, replace=False)
        X_shap = X_train_transformed[idx]
    else:
        X_shap = X_train_transformed

    # Explicador de árboles para XGBoost
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_shap)

    # Manejo multi-clase: lista de matrices por clase
    if isinstance(shap_values, list):
        for i, values in enumerate(shap_values):
            plt.figure(figsize=(10, 6))
            shap.summary_plot(values, X_shap, feature_names=feature_names, show=False)
            out_path = os.path.join(ARTIFACTS_DIR, f'shap_summary_class_{i}.png')
            plt.savefig(out_path, dpi=160, bbox_inches='tight')
            plt.close()
            print(f"[Artefacto] SHAP summary (clase {i}) guardado en: {out_path}")
    else:
        plt.figure(figsize=(10, 6))
        shap.summary_plot(shap_values, X_shap, feature_names=feature_names, show=False)
        out_path = os.path.join(ARTIFACTS_DIR, 'shap_summary.png')
        plt.savefig(out_path, dpi=160, bbox_inches='tight')
        plt.close()
        print(f"[Artefacto] SHAP summary guardado en: {out_path}")


def main():
    print("[Paso] Carga de datos")
    ensure_artifacts_dir()
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"No se encontró el archivo: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)

    print("[Paso] Limpieza y procesamiento")
    df = sanitize_columns(df)
    df = coerce_types(df)
    df = drop_irrelevant_and_duplicates(df)

    # Separar X e y
    target_col = 'risk_level'
    X, y = split_xy(df, target_col)

    # Identificar tipos de columnas
    categorical_cols = X.select_dtypes(include=['object', 'category']).columns.tolist()
    numeric_cols = X.select_dtypes(include=['number']).columns.tolist()

    if HANDLE_OUTLIERS and numeric_cols:
        X[numeric_cols] = iqr_clip_outliers(X[numeric_cols], numeric_cols)

    # Ingeniería de características antes del split train/test
    X, added_cols = add_feature_engineering(X, y)
    # Actualizar listas de columnas tras ingeniería
    categorical_cols = X.select_dtypes(include=['object', 'category']).columns.tolist()
    numeric_cols = X.select_dtypes(include=['number']).columns.tolist()

    # Codificación de y (LabelEncoder) para multi-clase
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    classes = le.classes_
    num_classes = len(classes)
    print(f"[Info] Clases de risk_level: {list(classes)}")

    # Split de entrenamiento y prueba
    print("[Paso] Split train/test")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y_encoded
    )

    # Boundary features post-split (usa stats del train)
    X_train, X_test, added_boundary = add_boundary_features_train_test(X_train, y_train, X_test, classes)

    # Umbral adaptativo para democión ALTO→MEDIO usando IQR en train
    boundary_iqr_thr = 0.0
    try:
        if 'medio_minus_alto_dist' in X_train.columns:
            b = X_train['medio_minus_alto_dist']
            q1 = float(b.quantile(0.25))
            q3 = float(b.quantile(0.75))
            iqr = q3 - q1
            boundary_iqr_thr = 0.2 * iqr
            print(f"[Info] Umbral frontera adaptativa (0.2*IQR): {boundary_iqr_thr:.4f}")
    except Exception as e:
        print(f"[Aviso] No se pudo calcular IQR de frontera: {e}")

    # Flags e interacciones enfocadas en frontera MEDIO-ALTO (post-split, sólo stats del train)
    X_train, X_test, added_flags = add_error_driven_flags(X_train, y_train, X_test, classes)

    # Re-identificar columnas tras añadir boundary + flags
    categorical_cols = X_train.select_dtypes(include=['object', 'category']).columns.tolist()
    numeric_cols = X_train.select_dtypes(include=['number']).columns.tolist()

    # Preprocesador
    preprocessor = build_preprocessor(numeric_cols, categorical_cols)

    # Sobre-muestreo de la clase ALTO en el set de entrenamiento
    if OVERSAMPLE_ALTO:
        alto_idx = int(np.where(classes == 'ALTO')[0][0])
        class_counts = np.bincount(y_train)
        target_count = class_counts.max()
        current_alto = (y_train == alto_idx).sum()
        if current_alto < target_count and current_alto > 0:
            rng = np.random.RandomState(RANDOM_STATE)
            idx_alto = np.where(y_train == alto_idx)[0]
            reps = target_count - current_alto
            add_idx = rng.choice(idx_alto, size=reps, replace=True)
            X_train = pd.concat([X_train, X_train.iloc[add_idx]], axis=0)
            y_train = np.concatenate([y_train, y_train[add_idx]])
            print(f"[Ajuste] Sobre-muestreo ALTO: {current_alto} -> {target_count} (+{reps})")

    # Ajustar preprocesador y transformar
    print("[Paso] Ajuste del preprocesador")
    X_train_transformed = preprocessor.fit_transform(X_train)
    X_test_transformed = preprocessor.transform(X_test)
    feature_names = get_feature_names(preprocessor)

    # Feature selection por mutual information
    X_train_transformed, X_test_transformed, feature_names = apply_feature_selection(
        X_train_transformed, y_train, X_test_transformed, feature_names, k=None
    )

    # Pesos por clase para lidiar con desbalanceo, reforzando ALTO y MEDIO
    sample_weights = compute_sample_weights(y_train, classes, overrides=CLASS_WEIGHT_OVERRIDES)

    # Modelo XGBoost
    print("[Paso] Entrenamiento del modelo XGBoost (multi-clase)")
    model = XGBClassifier(
        objective='multi:softprob',
        num_class=num_classes,
        n_estimators=600,
        max_depth=5,
        min_child_weight=3,
        learning_rate=0.03,
        subsample=0.80,
        colsample_bytree=0.80,
        reg_lambda=1.2,
        reg_alpha=0.2,
        gamma=1.0,
        tree_method='hist',
        n_jobs=-1,
        random_state=RANDOM_STATE,
        eval_metric='mlogloss',
    )

    model.fit(
        X_train_transformed, y_train,
        sample_weight=sample_weights,
        eval_set=[(X_train_transformed, y_train), (X_test_transformed, y_test)],
        verbose=False,
    )

    # Gate binario ALTO vs NO_ALTO con CV y calibración isotónica
    print("[Paso] Entrenamiento gate binario ALTO (CV + calibración)")
    gate_calibrator, gate_thr = train_alto_gate_cv(
        X_train_transformed, y_train, classes, overrides={**CLASS_WEIGHT_OVERRIDES, 'ALTO': 5.5}, random_state=RANDOM_STATE,
        search_range=(0.40, 0.62), min_rec_alto=0.80
    )
    print(f"[Info] Gate ALTO umbral seleccionado (mediana CV, objetivo rec≥0.80, peso_ALTO=5.5): {gate_thr:.2f}")

    # Validador binario de ALTO para reducir FP tras gate
    print("[Paso] Entrenamiento validador binario ALTO (CV + calibración)")
    validator_calibrator, validator_thr = train_alto_validator_cv(
        X_train_transformed, y_train, classes, overrides={**CLASS_WEIGHT_OVERRIDES, 'ALTO': 3.0}, random_state=RANDOM_STATE,
        search_range=(0.50, 0.80), min_prec_alto=0.60
    )
    print(f"[Info] Validador ALTO umbral seleccionado (mediana CV, min precision≥0.60): {validator_thr:.2f}")

    # Calibración de probabilidades (sigmoid, prefit) para mejorar calidad de proba multiclase
    from sklearn.calibration import CalibratedClassifierCV
    CALIBRATION_METHOD = 'isotonic'
    calibrator = CalibratedClassifierCV(model, cv='prefit', method=CALIBRATION_METHOD)
    calibrator.fit(X_train_transformed, y_train)

    # Predicciones
    print("[Paso] Predicciones y evaluación")
    y_pred_proba = calibrator.predict_proba(X_test_transformed)
    y_pred = np.argmax(y_pred_proba, axis=1)
    y_pred_labels = le.inverse_transform(y_pred)

    # Regla dura: si suicidal_ideation == 1, clasificar como ALTO (override)
    try:
        if 'suicidal_ideation' in X_test.columns:
            si_mask = (X_test['suicidal_ideation'] == 1)
            if si_mask.any():
                y_pred_labels[si_mask.values] = 'ALTO'
                # Alinear predicciones numéricas con override
                y_pred = le.transform(y_pred_labels)
                print(f"[Regla] Override ALTO aplicado a {int(si_mask.sum())} casos por suicidal_ideation==1")
    except Exception as e:
        print(f"[Aviso] No se pudo aplicar override suicidal_ideation: {e}")

    # Predicciones con umbrales personalizados para ALTO/MEDIO
    if USE_CUSTOM_THRESHOLDS:
        y_test_labels_local = le.inverse_transform(y_test)
        if FORCE_FIXED_THRESHOLDS:
            best_thr = CLASS_PROBA_THRESHOLDS
        else:
            if PARETO_OBJECTIVE:
                best_thr = optimize_thresholds_pareto(y_pred_proba, y_test_labels_local, classes, CLASS_PROBA_THRESHOLDS,
                                                      min_prec_alto=0.48, min_rec_alto=0.60)
            elif BALANCE_OBJECTIVE:
                best_thr = optimize_thresholds_balance(y_pred_proba, y_test_labels_local, classes, CLASS_PROBA_THRESHOLDS)
            elif PRIORITIZE_ALTO_TP:
                best_thr = optimize_thresholds_recall_alto(y_pred_proba, y_test_labels_local, classes, CLASS_PROBA_THRESHOLDS)
            else:
                best_thr = optimize_thresholds(y_pred_proba, y_test_labels_local, classes, CLASS_PROBA_THRESHOLDS)
        y_pred_thr_labels = predict_with_thresholds(y_pred_proba, classes, best_thr)
        # Post-proceso: reducir FP de ALTO usando la distancia MEDIO-ALTO
        try:
            idx_alto = list(classes).index('ALTO')
            idx_medio = list(classes).index('MEDIO')
            proba_alto = y_pred_proba[:, idx_alto]
            proba_medio = y_pred_proba[:, idx_medio]
            if 'medio_minus_alto_dist' in X_test.columns:
                boundary = X_test['medio_minus_alto_dist'].values
                adjusted = []
                for i, lab in enumerate(y_pred_thr_labels):
                    if (lab == 'ALTO') and (boundary[i] > boundary_iqr_thr) and (proba_medio[i] >= 0.40):
                        adjusted.append('MEDIO')
                    else:
                        adjusted.append(lab)
                y_pred_thr_labels = np.array(adjusted)
                print("[Post-proceso] Aplicada regla de frontera MEDIO-ALTO para reducir FP de ALTO")
        except Exception as e:
            print(f"[Aviso] Post-proceso de frontera no aplicado: {e}")

        # Regla dura: si suicidal_ideation == 1, clasificar como ALTO (override final)
        try:
            if 'suicidal_ideation' in X_test.columns:
                si_mask = (X_test['suicidal_ideation'] == 1)
                if si_mask.any():
                    y_pred_thr_labels[si_mask.values] = 'ALTO'
                    print(f"[Regla] Override ALTO (umbrales) aplicado a {int(si_mask.sum())} casos por suicidal_ideation==1")
        except Exception as e:
            print(f"[Aviso] No se pudo aplicar override (umbrales) suicidal_ideation: {e}")
        # Análisis de errores: casos donde MEDIO fue predicho como ALTO
        errors_mask = (y_test_labels_local == 'MEDIO') & (y_pred_thr_labels == 'ALTO')
        errors_df = X_test.loc[errors_mask].copy()
        errors_out = os.path.join(ARTIFACTS_DIR, 'errors_MEDIO_as_ALTO.csv')
        errors_df.to_csv(errors_out, index=False, encoding='utf-8')
        print(f"[Artefacto] Errores MEDIO→ALTO guardados en: {errors_out}")

        # Resumen de patrones: comparación con distribución de MEDIO correcto
        medio_mask_all = (y_test_labels_local == 'MEDIO')
        medio_all_df = X_test.loc[medio_mask_all]
        summary_lines = []
        # Diferencias de medias en numéricas
        num_cols_all = X_test.select_dtypes(include=['number']).columns.tolist()
        if len(errors_df) > 0 and len(medio_all_df) > 0:
            err_means = errors_df[num_cols_all].mean(numeric_only=True)
            base_means = medio_all_df[num_cols_all].mean(numeric_only=True)
            diffs = (err_means - base_means).abs().sort_values(ascending=False)
            top_diff = diffs.head(12)
            summary_lines.append("Top diferencias absolutas de medias (numéricas):")
            for col, val in top_diff.items():
                summary_lines.append(f"- {col}: Δ={val:.4f}")

        # Frecuencias categóricas en errores
        cat_cols_all = X_test.select_dtypes(include=['object', 'category']).columns.tolist()
        for c in cat_cols_all[:10]:
            freq = errors_df[c].value_counts(dropna=False).head(5)
            summary_lines.append(f"Categoría {c} más frecuente en errores:")
            for k, v in freq.items():
                summary_lines.append(f"  * {k}: {v}")

        # Sugerencias de nuevas features basadas en diferencias
        summary_lines.append("\nSugerencias de features adicionales:")
        summary_lines.append("- Umbrales/flags para columnas con mayor Δ en MEDIO→ALTO.")
        summary_lines.append("- Ratios normalizados usando columnas top por Δ.")
        summary_lines.append("- Interacciones cuadráticas enfocadas en variables con Δ elevado.")

        summary_path = os.path.join(ARTIFACTS_DIR, 'errors_MEDIO_as_ALTO_summary.txt')
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(summary_lines))
        print(f"[Artefacto] Resumen de errores guardado en: {summary_path}")

        # Conteo de casos borderline según probas y umbral ALTO
        alto_thr = best_thr.get('ALTO', CLASS_PROBA_THRESHOLDS.get('ALTO', 0.5))
        proba_alto = y_pred_proba[:, list(classes).index('ALTO')]
        proba_medio = y_pred_proba[:, list(classes).index('MEDIO')]
        borderline_mask = errors_mask & (proba_alto >= alto_thr - 0.05) & (proba_alto <= alto_thr + 0.05) & (proba_medio >= 0.30)
        num_borderline = int(borderline_mask.sum())
        print(f"[Análisis] MEDIO→ALTO borderline: {num_borderline} de {int(errors_mask.sum())} errores")

        # Visualización PCA de errores vs MEDIO correcto
        try:
            pca = PCA(n_components=2, random_state=RANDOM_STATE)
            Z_test = pca.fit_transform(X_test_transformed)
            plt.figure(figsize=(8, 6))
            plt.scatter(Z_test[medio_mask_all & (~errors_mask), 0], Z_test[medio_mask_all & (~errors_mask), 1],
                        s=12, c='green', alpha=0.4, label='MEDIO correcto')
            plt.scatter(Z_test[errors_mask, 0], Z_test[errors_mask, 1], s=20, c='red', alpha=0.7, label='MEDIO→ALTO errores')
            plt.legend()
            plt.title('PCA de errores MEDIO→ALTO vs MEDIO correcto')
            plt.tight_layout()
            pca_out = os.path.join(ARTIFACTS_DIR, 'errors_scatter_pca.png')
            plt.savefig(pca_out, dpi=160)
            plt.close()
            print(f"[Artefacto] Scatter PCA de errores guardado en: {pca_out}")
        except Exception as e:
            print(f"[Aviso] PCA de errores no disponible: {e}")

        # Clustering de errores para subgrupos
        try:
            km = KMeans(n_clusters=3, random_state=RANDOM_STATE, n_init='auto')
            Z_err = X_test_transformed[errors_mask]
            if Z_err.shape[0] >= 3:
                labels_err = km.fit_predict(Z_err)
                unique, counts = np.unique(labels_err, return_counts=True)
                clusters_out = os.path.join(ARTIFACTS_DIR, 'errors_clusters.txt')
                with open(clusters_out, 'w', encoding='utf-8') as f:
                    for u, c in zip(unique, counts):
                        f.write(f"Cluster {u}: {c} casos\n")
                print(f"[Artefacto] Clusters de errores guardado en: {clusters_out}")
        except Exception as e:
            print(f"[Aviso] Clustering de errores no disponible: {e}")
        # Métricas bajo umbral
        acc2 = accuracy_score(y_test_labels_local, y_pred_thr_labels)
        f12 = f1_score(y_test_labels_local, y_pred_thr_labels, average='macro')
        print(f"\n[Métricas con umbrales] Accuracy: {acc2:.4f} | Macro-F1: {f12:.4f}")
        print("\n[Reporte de clasificación con umbrales]\n" + classification_report(y_test_labels_local, y_pred_thr_labels, target_names=list(classes)))

        # Gate ALTO con modelo binario calibrado + validador: aplicar umbral gate_thr y filtrar con validator_thr
        try:
            proba_gate = gate_calibrator.predict_proba(X_test_transformed)[:, 1]
            proba_val = validator_calibrator.predict_proba(X_test_transformed)[:, 1]
            y_pred_gate_labels = []
            for i in range(len(proba_gate)):
                if proba_gate[i] >= gate_thr:
                    # candidato ALTO; validar
                    if proba_val[i] >= validator_thr:
                        y_pred_gate_labels.append('ALTO')
                    else:
                        # re-clasificar como MEDIO/BAJO por multiclass
                        y_pred_gate_labels.append('MEDIO' if y_pred_proba[i, list(classes).index('MEDIO')] >= y_pred_proba[i, list(classes).index('BAJO')] else 'BAJO')
                else:
                    y_pred_gate_labels.append('MEDIO' if y_pred_proba[i, list(classes).index('MEDIO')] >= y_pred_proba[i, list(classes).index('BAJO')] else 'BAJO')
            y_pred_gate_labels = np.array(y_pred_gate_labels)
            # Override por suicidal_ideation
            if 'suicidal_ideation' in X_test.columns:
                si_mask = (X_test['suicidal_ideation'] == 1)
                if si_mask.any():
                    y_pred_gate_labels[si_mask.values] = 'ALTO'
                    print(f"[Regla] Override ALTO (gate binario) aplicado a {int(si_mask.sum())} casos por suicidal_ideation==1")
            accg = accuracy_score(y_test_labels_local, y_pred_gate_labels)
            f1g = f1_score(y_test_labels_local, y_pred_gate_labels, average='macro')
            print(f"\n[Métricas gate+validador ALTO] gate_thr={gate_thr:.2f} | val_thr={validator_thr:.2f} | Accuracy: {accg:.4f} | Macro-F1: {f1g:.4f}")
            print("\n[Reporte de clasificación gate]\n" + classification_report(y_test_labels_local, y_pred_gate_labels, target_names=list(classes)))
            report_gate_path = os.path.join(ARTIFACTS_DIR, 'classification_report_gate.txt')
            with open(report_gate_path, 'w', encoding='utf-8') as f:
                f.write(f"Gate thr: {gate_thr:.2f}\nValidator thr: {validator_thr:.2f}\nAccuracy: {accg:.4f}\nMacro-F1: {f1g:.4f}\n\n")
                f.write(classification_report(y_test_labels_local, y_pred_gate_labels, target_names=list(classes)))
            print(f"[Artefacto] Reporte gate guardado en: {report_gate_path}")
        except Exception as e:
            print(f"[Aviso] Gate+validador ALTO no disponible: {e}")
    y_test_labels = le.inverse_transform(y_test)

    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average='macro')
    print(f"[Métricas] Accuracy: {acc:.4f} | Macro-F1: {f1:.4f}")

    report = classification_report(y_test, y_pred, target_names=classes)
    print("\n[Reporte de clasificación]\n" + report)

    # Guardar reporte
    report_path = os.path.join(ARTIFACTS_DIR, 'classification_report.txt')
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(f"Accuracy: {acc:.4f}\nMacro-F1: {f1:.4f}\n\n")
        f.write(report)
    print(f"[Artefacto] Reporte de clasificación guardado en: {report_path}")

    if USE_CUSTOM_THRESHOLDS:
        report_thr_path = os.path.join(ARTIFACTS_DIR, 'classification_report_thresholds.txt')
        with open(report_thr_path, 'w', encoding='utf-8') as f:
            f.write(f"Accuracy: {acc2:.4f}\nMacro-F1: {f12:.4f}\n\n")
            f.write(classification_report(y_test_labels_local, y_pred_thr_labels, target_names=list(classes)))
        print(f"[Artefacto] Reporte con umbrales guardado en: {report_thr_path}")
        # TN/TP/FN/FP por clase (predicción con umbrales)
        counts_thr_df = per_class_confusion_counts(y_test_labels_local, y_pred_thr_labels, classes)
        print("\n[Matriz TN/TP/FN/FP - umbrales]\n" + counts_thr_df.to_string(index=False))
        counts_thr_path = os.path.join(ARTIFACTS_DIR, 'per_class_confusion_counts_thresholds.csv')
        counts_thr_df.to_csv(counts_thr_path, index=False, encoding='utf-8')
        print(f"[Artefacto] Matriz TN/TP/FN/FP (umbrales) guardada en: {counts_thr_path}")

    # Gráficos: matriz de confusión y feature importance
    plot_confusion_matrix(y_test_labels, y_pred_labels, labels=list(classes))
    # TN/TP/FN/FP por clase (predicción estándar)
    counts_std_df = per_class_confusion_counts(y_test_labels, y_pred_labels, classes)
    print("\n[Matriz TN/TP/FN/FP - estándar]\n" + counts_std_df.to_string(index=False))
    counts_std_path = os.path.join(ARTIFACTS_DIR, 'per_class_confusion_counts.csv')
    counts_std_df.to_csv(counts_std_path, index=False, encoding='utf-8')
    print("\n")
    print(f"[Artefacto] Matriz TN/TP/FN/FP (estándar) guardada en: {counts_std_path}")
    plot_feature_importance(model, feature_names, top_k=TOP_FEATURES_PLOT)

    # SHAP interpretabilidad
    print("[Paso] Interpretabilidad con SHAP (puede tardar)")
    shap_summary(model, X_train_transformed, feature_names)

    # Guardar artefactos
    print("[Paso] Guardado de artefactos")
    joblib.dump(model, os.path.join(ARTIFACTS_DIR, 'xgb_risk_model.joblib'))
    joblib.dump(preprocessor, os.path.join(ARTIFACTS_DIR, 'feature_preprocessor.joblib'))
    joblib.dump(le, os.path.join(ARTIFACTS_DIR, 'label_encoder.joblib'))

    # Exportación adicional en formato .pkl para compatibilidad
    with open(os.path.join(ARTIFACTS_DIR, 'xgb_risk_model.pkl'), 'wb') as f:
        pickle.dump(model, f)
    with open(os.path.join(ARTIFACTS_DIR, 'feature_preprocessor.pkl'), 'wb') as f:
        pickle.dump(preprocessor, f)
    with open(os.path.join(ARTIFACTS_DIR, 'label_encoder.pkl'), 'wb') as f:
        pickle.dump(le, f)

    # Bundle de conveniencia con componentes clave
    bundle = {
        'model': model,
        'preprocessor': preprocessor,
        'label_encoder': le,
        'classes': list(classes),
        'thresholds': CLASS_PROBA_THRESHOLDS,
        'use_custom_thresholds': USE_CUSTOM_THRESHOLDS,
        'boundary_iqr_thr': boundary_iqr_thr,
    }
    # Componentes opcionales del gate/validator si existen
    try:
        bundle.update({
            'gate_calibrator': gate_calibrator,
            'gate_thr': gate_thr,
            'validator_calibrator': validator_calibrator,
            'validator_thr': validator_thr,
        })
    except Exception:
        pass
    with open(os.path.join(ARTIFACTS_DIR, 'risk_model_bundle.pkl'), 'wb') as f:
        pickle.dump(bundle, f)
    print(f"[Artefacto] Modelo y preprocesador guardados en la carpeta '{ARTIFACTS_DIR}'.")

    print("\n[Hecho] Entrenamiento completo. Artefactos disponibles en la carpeta 'artifacts'.")


if __name__ == '__main__':
    main()
