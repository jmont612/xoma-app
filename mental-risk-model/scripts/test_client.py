from fastapi.testclient import TestClient
from api.api_xgb import app, _startup


def main():
    # pruebita
    _startup()
    client = TestClient(app)
    # Check health endpoint
    r = client.get("/health")
    print("Health:", r.status_code, r.text)

    # data a enviar
    payload = {
        "mood_0_10": 5,
        "stress_0_10": 9,
        "anxiety_0_10": 7,
        "impulsivity_0_10": 9,
        "urge_self_harm": 1,
        "suicidal_ideation": 0,
    }

    r2 = client.post("/classify", json=payload)
    print("Classify:", r2.status_code)
    try:
        print(r2.json())
    except Exception:
        print(r2.text)


if __name__ == "__main__":
    main()