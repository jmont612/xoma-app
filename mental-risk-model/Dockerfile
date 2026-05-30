FROM python:3.11-slim
WORKDIR /app

# Dependencias del sistema mínimas para compilar extensiones (xgboost, scipy)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ && \
    rm -rf /var/lib/apt/lists/*

COPY requirements-api.txt .
RUN pip install --no-cache-dir -r requirements-api.txt

# api_xgb.py importa funciones de train_xgb_multiclass.py en tiempo de ejecución
COPY api/api_xgb.py ./api/api_xgb.py
COPY api/__init__.py ./api/__init__.py
COPY train_xgb_multiclass.py .

# El bundle entrenado y el dataset son necesarios en runtime para la inferencia
COPY artifacts/ ./artifacts/
COPY data/ ./data/

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

CMD ["uvicorn", "api.api_xgb:app", "--host", "0.0.0.0", "--port", "8000"]
