import os
import pickle
import numpy as np
import pandas as pd
import streamlit as st

# Importar utilidades del pipeline de entrenamiento para preparar features
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


@st.cache_data
def load_bundle():
    with open(os.path.join(ARTIFACTS_DIR, 'risk_model_bundle.pkl'), 'rb') as f:
        b = pickle.load(f)
    return b


@st.cache_data
def load_train_df():
    df = pd.read_csv(DATA_PATH)
    df = sanitize_columns(df)
    df = coerce_types(df)
    df = drop_irrelevant_and_duplicates(df)
    return df


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
    def apply_engineering_with_bases(X_df: pd.DataFrame, bases: list[str]) -> pd.DataFrame:
        X_df = X_df.copy()
        eps = 1e-6
        # cuadrados
        for c in bases:
            if c in X_df.columns:
                X_df[f"{c}__sq"] = X_df[c] ** 2
        # interacciones pares (primeras 6)
        pair_cols = bases[:6]
        for i in range(len(pair_cols)):
            for j in range(i + 1, len(pair_cols)):
                ci, cj = pair_cols[i], pair_cols[j]
                if ci in X_df.columns and cj in X_df.columns:
                    X_df[f"{ci}__x__{cj}"] = X_df[ci] * X_df[cj]
        # ratios (primeras 4)
        ratio_cols = bases[:4]
        for i in range(len(ratio_cols)):
            for j in range(len(ratio_cols)):
                if i == j:
                    continue
                ci, cj = ratio_cols[i], ratio_cols[j]
                if ci in X_df.columns and cj in X_df.columns:
                    denom = X_df[cj].abs() + eps
                    X_df[f"{ci}__div__{cj}"] = X_df[ci] / denom
        return X_df

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
    #    Esto evita errores si el bundle proviene de una versión anterior con columnas diferentes.
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

    # Reordenar columnas colocando primero las esperadas (opcional, ColumnTransformer selecciona por nombre)
    ordered_cols = list(dict.fromkeys(expected_num_cols + expected_cat_cols + list(X_input.columns)))
    X_input = X_input.reindex(columns=ordered_cols)
    return X_train, X_input


# =====================
# Utilidades de decisión
# =====================
def _probs_by_name(probs: np.ndarray, classes: list[str]) -> dict:
    """Devuelve un dict con probabilidades por nombre de clase.
    Evita repetir mapeos en funciones de decisión."""
    name_to_idx = {c: i for i, c in enumerate(classes)}
    out = {}
    for c in ('BAJO', 'MEDIO', 'ALTO'):
        if c in name_to_idx:
            out[c] = float(probs[name_to_idx[c]])
    return out


def _try_safety_label(p: dict, thresholds: dict, suicidal_ideation: int, urge_self_harm: int,
                      risk_avg: float | None, boundary_val: float, boundary_iqr_thr: float) -> str | None:
    """Aplica reglas de seguridad/negocio comunes. Si alguna decide, devuelve etiqueta; si no, None.
    Lógica idéntica a la que ya existe para no cambiar resultados."""
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


def main():
    st.title('Validador del modelo de riesgo')
    st.caption('Carga el bundle .pkl y aplica las mismas transformaciones para predecir BAJO/MEDIO/ALTO')

    bundle = load_bundle()
    classes = list(bundle['classes'])
    thresholds = bundle.get('thresholds', {'ALTO': 0.60, 'MEDIO': 0.40})
    boundary_iqr_thr = float(bundle.get('boundary_iqr_thr', 0.0))

    # Controles
    st.subheader('Entradas')
    c1, c2 = st.columns(2)
    with c1:
        mood = st.slider('Estado de ánimo (mood_0_10)', min_value=0, max_value=10, value=5)
        stress = st.slider('Estrés (stress_0_10)', min_value=0, max_value=10, value=5)
        anxiety = st.slider('Ansiedad (anxiety_0_10)', min_value=0, max_value=10, value=5)
    with c2:
        impulsivity = st.slider('Impulsividad (impulsivity_0_10)', min_value=0, max_value=10, value=5)
        urge_self_harm = st.checkbox('Impulso de autolesión (urge_self_harm)', value=False)
        suicidal_ideation = st.checkbox('Ideación suicida (suicidal_ideation)', value=False)

    if not os.path.exists(DATA_PATH):
        st.error(f'No se encontró el dataset en {DATA_PATH}.')
        return

    df_train = load_train_df()
    # Armar una fila de entrada con los nombres reales del dataset
    row = {
        'mood_0_10': int(mood),
        'stress_0_10': int(stress),
        'anxiety_0_10': int(anxiety),
        'impulsivity_0_10': int(impulsivity),
        'urge_self_harm': int(1 if urge_self_harm else 0),
        'suicidal_ideation': int(1 if suicidal_ideation else 0),
    }
    X_input_raw = pd.DataFrame([row])
    X_train_ready, X_input_ready = prepare_features_for_inference(df_train, X_input_raw, bundle)

    # Transformar con el preprocesador del bundle
    pre = bundle['preprocessor']
    X_input_t = pre.transform(X_input_ready)

    # Probabilidades multiclass
    model = bundle['model']
    probs = model.predict_proba(X_input_t)[0]

    # Decisiones
    boundary_val = float(X_input_ready.get('medio_minus_alto_dist', pd.Series([0.0])).iloc[0])
    risk_avg = float(np.mean([stress, anxiety, impulsivity]))
    label_thr = decide_with_thresholds(
        probs, classes, thresholds,
        int(1 if suicidal_ideation else 0), int(1 if urge_self_harm else 0),
        boundary_val, boundary_iqr_thr, risk_avg
    )
    label_gate = decide_with_gate(
        X_input_t, probs, classes, bundle,
        int(1 if suicidal_ideation else 0), int(1 if urge_self_harm else 0),
        boundary_val, risk_avg
    )

    # Mostrar resultados
    st.subheader('Resultado')
    # Mostrar probabilidades en orden requerido: BAJO, MEDIO, ALTO
    name_to_idx = {c: i for i, c in enumerate(classes)}
    display_order = ['BAJO', 'MEDIO', 'ALTO']
    display_probs = {c: float(probs[name_to_idx[c]]) for c in display_order if c in name_to_idx}
    st.write("Probabilidades (orden: BAJO, MEDIO, ALTO):")
    st.json(display_probs)
    st.info(f"Predicción por umbrales: {label_thr}")
    st.info(f"Predicción gate+validador: {label_gate}")
    if suicidal_ideation:
        st.warning("Override de seguridad activo: suicidal_ideation==1 fuerza ALTO")
    elif urge_self_harm and (label_thr in ('ALTO', 'MEDIO') or label_gate in ('ALTO', 'MEDIO')):
        st.warning("Regla de seguridad: urge_self_harm promueve riesgo (>= MEDIO) según intensidad")
    elif (5.0 <= risk_avg <= 7.0) and (label_thr == 'MEDIO' or label_gate == 'MEDIO'):
        st.info("Regla banda moderada: con intensidad 5–7 favorecemos MEDIO sólo si hay soporte y cercanía")


if __name__ == '__main__':
    main()