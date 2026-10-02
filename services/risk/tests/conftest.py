# conftest.py: one sidecar app per test session (training takes a moment).
import pytest
from fastapi.testclient import TestClient

from risk.app import build_app


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(build_app("logistic"))


VALID = {
    "lead_days": 3,
    "weekday": 2,
    "hour": 9,
    "zone": 1,
    "session_number": 5,
    "prior_visits": 4,
    "prior_no_shows": 1,
    "replied_last_reminder": 1,
}
