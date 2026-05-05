from typing import Optional, Dict

import os
import pickle
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# Utilidades del pipeline de entrenamiento
from train_xgb_multiclass import (
    sanitize_columns,
    coerce_types,
    drop_irrelevant_and_duplicates,
    add_feature_engineering,
    add_boundary_features_train_test,
    add_error_driven_flags,
)


ARTIFACTS_DIR = 'artifacts'
DATA_PATH = os.path.join('data', 'ema_risk_dataset.csv')


# =====================
# Modelos de solicitud/respuesta
# =====================
class RiskInput(BaseModel):
    mood_0_10: int = Field(..., ge=0, le=10)
    stress_0_10: int = Field(..., ge=0, le=10)
    anxiety_0_10: int = Field(..., ge=0, le=10)
    impulsivity_0_10: int = Field(..., ge=0, le=10)
    urge_self_harm: int | bool = Field(..., description="Indicador 0/1")
    suicidal_ideation: int | bool = Field(..., description="Indicador 0/1")


class RiskOutput(BaseModel):
    probabilities: Dict[str, float]
    label_thresholds: str
    label_gate: str


# =====================
# FastAPI app
# =====================
app = FastAPI(title="XGB Risk Model API", version="1.0.0")


# =====================
# Carga de artefactos y datos
# =====================
_BUNDLE: Optional[dict] = None
_DF_TRAIN: Optional[pd.DataFrame] = None


def _load_bundle() -> dict:
    path = os.path.join(ARTIFACTS_DIR, 'risk_model_bundle.pkl')
    if not os.path.exists(path):
        raise FileNotFoundError(f"No se encontró el bundle en {path}")
    with open(path, 'rb') as f:
        b = pickle.load(f)
    return b


def _load_train_df() -> pd.DataFrame:
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"No se encontró el dataset en {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    df = sanitize_columns(df)
    df = coerce_types(df)
    df = drop_irrelevant_and_duplicates(df)
    return df


# =====================
# Preparación de features igual a entrenamiento
# =====================
def prepare_features_for_inference(df_train: pd.DataFrame, df_input: pd.DataFrame, bundle: dict) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Aplica exactamente las mismas transformaciones de entrenamiento (feature engineering,
    boundary y flags basadas en stats de train) para que el preprocesador del bundle funcione.
    Devuelve (X_train_ready, X_input_ready).
    """
    # 1) Ingeniería de características antes del split (replicar lógica de entrenamiento)
    X_train_raw = df_train.drop(columns=['risk_level']).copy()
    y_train = df_train['risk_level'].copy()
    X_train, _ = add_feature_engineering(X_train_raw, y_train)

    # 1.1) Calcular base_cols desde el train (top por varianza en crudo)
    num_cols_raw = X_train_raw.select_dtypes(include=['number']).columns.tolist()
    variances = X_train_raw[num_cols_raw].var(numeric_only=True).sort_values(ascending=False)
    base_cols = [c for c in variances.index.tolist()[:8] if c in num_cols_raw]

    # 1.2) Helper para aplicar ingeniería al input usando las mismas bases
    def apply_engineering_with_bases(X_input: pd.DataFrame, base_cols_local: list[str]) -> pd.DataFrame:
        X_in = X_input.copy()
        eps = 1e-6
        # Términos cuadráticos
        for c in base_cols_local:
            if c in X_in.columns:
                X_in[f"{c}__sq"] = X_in[c].astype(float) ** 2
            else:
                X_in[f"{c}__sq"] = 0.0
        # Interacciones pares (limitadas)
        pair_cols = base_cols_local[:6]
        for i in range(len(pair_cols)):
            for j in range(i + 1, len(pair_cols)):
                ci, cj = pair_cols[i], pair_cols[j]
                val_i = X_in[ci] if ci in X_in.columns else 0.0
                val_j = X_in[cj] if cj in X_in.columns else 0.0
                X_in[f"{ci}__x__{cj}"] = pd.to_numeric(val_i, errors='coerce').fillna(0.0).astype(float) * pd.to_numeric(val_j, errors='coerce').fillna(0.0).astype(float)
        # Ratios
        ratio_cols = base_cols_local[:4]
        for i in range(len(ratio_cols)):
            for j in range(len(ratio_cols)):
                if i == j:
                    continue
                ci, cj = ratio_cols[i], ratio_cols[j]
                num = pd.to_numeric(X_in[ci], errors='coerce').fillna(0.0).astype(float) if ci in X_in.columns else 0.0
                den = pd.to_numeric(X_in[cj], errors='coerce').abs().fillna(0.0).astype(float) if cj in X_in.columns else 0.0
                denom = (den if isinstance(den, pd.Series) else pd.Series([den])) + eps
                X_in[f"{ci}__div__{cj}"] = (num if isinstance(num, pd.Series) else pd.Series([num])) / denom
        return X_in

    # 2) Aplicar las mismas transformaciones al input (usa nombres originales + bases del train)
    X_input = df_input.copy()
    X_input = apply_engineering_with_bases(X_input, base_cols)

    # 3) Alinear columnas del input a las de train para que boundary/flags tengan todas las features necesarias
    X_input = X_input.reindex(columns=X_train.columns, fill_value=0)

    # 3.1) Asegurar explícitamente que todas las columnas numéricas del train existen en el input
    num_cols_train = X_train.select_dtypes(include=['number']).columns.tolist()
    missing_num = [c for c in num_cols_train if c not in X_input.columns]
    for c in missing_num:
        X_input[c] = 0.0
    # Reordenar columnas igual que el train tras añadir faltantes
    X_input = X_input.reindex(columns=X_train.columns, fill_value=0)

    # y_train codificada con el label_encoder del bundle
    le = bundle['label_encoder']
    y_train_enc = le.transform(y_train)
    classes = np.array(bundle['classes'])

    # 4) Boundary features basadas en stats del train
    X_train, X_input, _ = add_boundary_features_train_test(X_train, y_train_enc, X_input, classes)

    # 5) Flags de error y señales de riesgo usando sólo stats del train
    X_train, X_input, _ = add_error_driven_flags(X_train, y_train_enc, X_input, classes)
    # 6) Alinear nuevamente por si las flags añadieron columnas sólo presentes en train
    X_input = X_input.reindex(columns=X_train.columns, fill_value=0)

    # 7) Reconciliar con las columnas esperadas por el preprocesador guardado en el bundle
    pre = bundle['preprocessor']
    try:
        expected_num_cols = list(pre.transformers_[0][2]) if pre.transformers_ and len(pre.transformers_) > 0 else []
        expected_cat_cols = list(pre.transformers_[1][2]) if pre.transformers_ and len(pre.transformers_) > 1 else []
    except Exception:
        expected_num_cols, expected_cat_cols = [], []

    # Añadir cualquier columna faltante con valores seguros (0 para numéricas, NaN para categóricas)
    for col in expected_num_cols:
        if col not in X_input.columns:
            X_input[col] = 0.0
    for col in expected_cat_cols:
        if col not in X_input.columns:
            X_input[col] = np.nan

    # Tipos: asegurar que las numéricas sean float para el imputador
    if expected_num_cols:
        for col in expected_num_cols:
            try:
                X_input[col] = pd.to_numeric(X_input[col], errors='coerce')
            except Exception:
                X_input[col] = 0.0

    ordered_cols = list(dict.fromkeys(expected_num_cols + expected_cat_cols + list(X_input.columns)))
    X_input = X_input.reindex(columns=ordered_cols)
    return X_train, X_input


# =====================
# Utilidades de decisión (streamlit_app)
# =====================
def _probs_by_name(probs: np.ndarray, classes: list[str]) -> dict:
    name_to_idx = {c: i for i, c in enumerate(classes)}
    out = {}
    for c in ('BAJO', 'MEDIO', 'ALTO'):
        if c in name_to_idx:
            out[c] = float(probs[name_to_idx[c]])
    return out


def _try_safety_label(p: dict, thresholds: dict, suicidal_ideation: int, urge_self_harm: int,
                      risk_avg: float | None, boundary_val: float, boundary_iqr_thr: float) -> str | None:
    p_bajo = p.get('BAJO', 0.0)
    p_medio = p.get('MEDIO', 0.0)
    p_alto = p.get('ALTO', 0.0)

    # Override por ideación suicida
    if suicidal_ideation == 1:
        return 'ALTO'

    # Piso de riesgo por alta intensidad
    if (risk_avg is not None) and (risk_avg >= 8.5):
        if (p_alto >= 0.50) and (p_alto >= p_medio) and (p_alto >= p_bajo):
            if (boundary_val > boundary_iqr_thr) and (p_medio >= thresholds.get('MEDIO', 0.40)):
                return 'MEDIO'
            return 'ALTO'
        if p_medio >= thresholds.get('MEDIO', 0.40):
            return 'MEDIO'

    # Banda moderada: favorecer MEDIO con soporte y cercanía
    if (risk_avg is not None) and (5.0 <= risk_avg <= 7.0) and (suicidal_ideation == 0):
        top = max(p_alto, p_medio, p_bajo)
        if (p_medio >= 0.35) and ((top - p_medio) <= 0.05):
            return 'MEDIO'

    # Regla por impulso de autolesión
    if urge_self_harm == 1:
        if (p_alto >= p_medio) and (p_alto >= p_bajo) and (p_alto >= 0.50):
            return 'ALTO'
        if (risk_avg is not None) and (risk_avg >= 8.0):
            return 'MEDIO'
        if p_medio >= max(0.35, thresholds.get('MEDIO', 0.40) - 0.05):
            return 'MEDIO'
    return None


def decide_with_thresholds(probs: np.ndarray, classes: list[str], thresholds: dict, suicidal_ideation: int,
                            urge_self_harm: int, boundary_val: float, boundary_iqr_thr: float,
                            risk_avg: float | None = None) -> str:
    p = _probs_by_name(probs, classes)
    label = _try_safety_label(p, thresholds, suicidal_ideation, urge_self_harm, risk_avg, boundary_val, boundary_iqr_thr)
    if label is not None:
        return label
    # Umbrales base (con democión por frontera)
    if p.get('ALTO', 0.0) >= thresholds.get('ALTO', 0.60):
        if (boundary_val > boundary_iqr_thr) and (p.get('MEDIO', 0.0) >= thresholds.get('MEDIO', 0.40)):
            return 'MEDIO'
        return 'ALTO'
    if p.get('MEDIO', 0.0) >= thresholds.get('MEDIO', 0.40):
        return 'MEDIO'
    return 'BAJO'


def decide_with_gate(pre_t: np.ndarray, probs: np.ndarray, classes: list[str], bundle: dict,
                     suicidal_ideation: int, urge_self_harm: int, boundary_val: float,
                     risk_avg: float | None = None) -> str:
    gate = bundle.get('gate_calibrator')
    validator = bundle.get('validator_calibrator')
    gate_thr = bundle.get('gate_thr', None)
    val_thr = bundle.get('validator_thr', None)
    thresholds = bundle.get('thresholds', {'ALTO': 0.60, 'MEDIO': 0.40})
    boundary_iqr_thr = float(bundle.get('boundary_iqr_thr', 0.0))

    if (gate is None) or (validator is None) or (gate_thr is None) or (val_thr is None):
        # Fallback: sólo umbrales
        return decide_with_thresholds(probs, classes, thresholds, suicidal_ideation, urge_self_harm, boundary_val, boundary_iqr_thr, risk_avg)

    # Reglas comunes primero
    p = _probs_by_name(probs, classes)
    label = _try_safety_label(p, thresholds, suicidal_ideation, urge_self_harm, risk_avg, boundary_val, boundary_iqr_thr)
    if label is not None:
        return label

    p_gate = gate.predict_proba(pre_t)[0, 1]
    p_val = validator.predict_proba(pre_t)[0, 1]
    name_to_idx = {c: i for i, c in enumerate(classes)}
    p_medio = probs[name_to_idx['MEDIO']]

    if p_gate >= gate_thr:
        if p_val >= val_thr:
            # democión adaptativa
            if (boundary_val > boundary_iqr_thr) and (p_medio >= thresholds.get('MEDIO', 0.40)):
                return 'MEDIO'
            return 'ALTO'
        # re-clasificar por multiclass entre MEDIO/BAJO
        p_bajo = probs[name_to_idx['BAJO']]
        return 'MEDIO' if p_medio >= p_bajo else 'BAJO'
    else:
        p_bajo = probs[name_to_idx['BAJO']]
        return 'MEDIO' if p_medio >= p_bajo else 'BAJO'


# =====================
# Endpoints
# =====================
@app.on_event("startup")
def _startup():
    global _BUNDLE, _DF_TRAIN
    _BUNDLE = _load_bundle()
    _DF_TRAIN = _load_train_df()


@app.get("/health")
def health():
    ok = (_BUNDLE is not None) and (_DF_TRAIN is not None)
    return {"status": "ok" if ok else "error"}


@app.post("/classify", response_model=RiskOutput)
def classify(inp: RiskInput) -> RiskOutput:
    try:
        if (_BUNDLE is None) or (_DF_TRAIN is None):
            raise HTTPException(status_code=503, detail="Modelo no cargado aún")

        # Armar fila de entrada
        row = {
            'mood_0_10': int(inp.mood_0_10),
            'stress_0_10': int(inp.stress_0_10),
            'anxiety_0_10': int(inp.anxiety_0_10),
            'impulsivity_0_10': int(inp.impulsivity_0_10),
            'urge_self_harm': int(1 if inp.urge_self_harm else 0),
            'suicidal_ideation': int(1 if inp.suicidal_ideation else 0),
        }
        X_input_raw = pd.DataFrame([row])

        # Preparar features igual a entrenamiento
        X_train_ready, X_input_ready = prepare_features_for_inference(_DF_TRAIN, X_input_raw, _BUNDLE)

        # Transformar con el preprocesador del bundle
        pre = _BUNDLE['preprocessor']
        X_input_t = pre.transform(X_input_ready)

        # Probabilidades multiclass
        model = _BUNDLE['model']
        probs = model.predict_proba(X_input_t)[0]

        classes = list(_BUNDLE['classes'])
        thresholds = _BUNDLE.get('thresholds', {'ALTO': 0.60, 'MEDIO': 0.40})
        boundary_iqr_thr = float(_BUNDLE.get('boundary_iqr_thr', 0.0))

        # Decisiones
        boundary_val = float(X_input_ready.get('medio_minus_alto_dist', pd.Series([0.0])).iloc[0])
        risk_avg = float(np.mean([row['stress_0_10'], row['anxiety_0_10'], row['impulsivity_0_10']]))
        label_thr = decide_with_thresholds(
            probs, classes, thresholds,
            row['suicidal_ideation'], row['urge_self_harm'], boundary_val, boundary_iqr_thr, risk_avg
        )
        label_gate = decide_with_gate(
            X_input_t, probs, classes, _BUNDLE,
            row['suicidal_ideation'], row['urge_self_harm'], boundary_val, risk_avg
        )

        name_to_idx = {c: i for i, c in enumerate(classes)}
        display_order = ['BAJO', 'MEDIO', 'ALTO']
        display_probs = {c: float(probs[name_to_idx[c]]) for c in display_order if c in name_to_idx}

        return RiskOutput(
            probabilities=display_probs,
            label_thresholds=label_thr,
            label_gate=label_gate,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en predicción: {e}")