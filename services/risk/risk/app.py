# app.py: HTTP sidecar. Trains on the synthetic data at startup and scores one appointment per request.
# RISK_MODEL picks the model (logistic | tabpfn-v2); a TabPFN failure falls back to logistic and says so.
# Run: uvicorn --factory risk.app:build_app --port 8090
import logging
import os
from datetime import datetime, timezone

from fastapi import FastAPI

from .features import RiskFeatures
from .models import ModelUnavailable, train
from .scoring import band, clamp
from .synthetic import generate

log = logging.getLogger("risk")


def build_app(model_name: str | None = None, n: int = 600, seed: int = 7) -> FastAPI:
    requested = model_name or os.environ.get("RISK_MODEL", "logistic")
    x, y = generate(n, seed)
    fallback_reason: str | None = None
    try:
        model = train(requested, x, y)
        active = requested
    except ModelUnavailable as error:
        fallback_reason = str(error)
        log.warning("risk.model_unavailable %s", fallback_reason)
        model = train("logistic", x, y)
        active = "logistic"

    app = FastAPI(title="audiorapy-risk", docs_url=None, redoc_url=None, openapi_url=None)
    trained_at = datetime.now(timezone.utc).isoformat()

    @app.get("/health")
    def health() -> dict:
        return {
            "ok": True,
            "model": active,
            "requested": requested,
            "fallback_reason": fallback_reason,
            "trained_on": "synthetic",
            "rows": int(len(y)),
            "trained_at": trained_at,
        }

    @app.post("/score")
    def score(features: RiskFeatures) -> dict:
        p = clamp(float(model.predict_proba([features.row()])[0][1]))
        return {"score": p, "band": band(p), "model": active}

    return app

