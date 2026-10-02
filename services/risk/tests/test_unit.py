# test_unit.py: synthetic data, models, scoring and the HTTP contract with fixed inputs.
import numpy as np
import pytest
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

from risk.app import build_app
from risk.features import FEATURES
from risk.models import ModelUnavailable, train
from risk.scoring import band, clamp
from risk.synthetic import generate

from .conftest import VALID


def test_synthetic_is_deterministic_and_shaped():
    x1, y1 = generate(200, 3)
    x2, y2 = generate(200, 3)
    assert np.array_equal(x1, x2) and np.array_equal(y1, y2)
    assert x1.shape == (200, len(FEATURES))
    assert 0.05 < y1.mean() < 0.6


def test_logistic_beats_chance_on_holdout():
    x, y = generate(600, 7)
    x_tr, x_te, y_tr, y_te = train_test_split(x, y, test_size=0.3, random_state=7, stratify=y)
    auc = roc_auc_score(y_te, train("logistic", x_tr, y_tr).predict_proba(x_te)[:, 1])
    assert auc > 0.6


def test_tabpfn_missing_is_reported_not_crashed():
    try:
        import tabpfn  # noqa: F401
    except ImportError:
        x, y = generate(50, 1)
        with pytest.raises(ModelUnavailable):
            train("tabpfn-v2", x, y)


def test_unknown_model_is_rejected():
    with pytest.raises(ValueError):
        train("gpt", *generate(20, 1))


def test_bands_and_clamp():
    assert [band(s) for s in (0.0, 0.24, 0.25, 0.44, 0.45, 1.0)] == ["low", "low", "medium", "medium", "high", "high"]
    assert clamp(float("nan")) == 0.0 and clamp(1.7) == 1.0 and clamp(-1) == 0.0


def test_health_says_synthetic(client):
    body = client.get("/health").json()
    assert body["model"] == "logistic" and body["trained_on"] == "synthetic" and body["rows"] == 600


def test_score_contract(client):
    body = client.post("/score", json=VALID).json()
    assert set(body) == {"score", "band", "model"}
    assert 0 <= body["score"] <= 1 and body["band"] == band(body["score"])


def test_rejects_identifiers_and_out_of_range(client):
    assert client.post("/score", json={**VALID, "phone": "573001112233"}).status_code == 422
    assert client.post("/score", json={**VALID, "weekday": 9}).status_code == 422
    assert client.post("/score", json={k: v for k, v in VALID.items() if k != "zone"}).status_code == 422


def test_requested_tabpfn_falls_back_to_logistic_and_says_why():
    try:
        import tabpfn  # noqa: F401
        pytest.skip("tabpfn installed: fallback path not reachable")
    except ImportError:
        pass
    from fastapi.testclient import TestClient

    body = TestClient(build_app("tabpfn-v2", n=120)).get("/health").json()
    assert body["requested"] == "tabpfn-v2" and body["model"] == "logistic"
    assert "not installed" in body["fallback_reason"]
