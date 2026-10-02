# test_invariant.py: for every valid input, the score is in [0, 1], the band matches the score, and the
# same input always gets the same answer.
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from risk.scoring import band

valid = st.fixed_dictionaries(
    {
        "lead_days": st.floats(min_value=0, max_value=120, allow_nan=False),
        "weekday": st.integers(0, 6),
        "hour": st.integers(0, 23),
        "zone": st.integers(0, 9),
        "session_number": st.integers(1, 500),
        "prior_visits": st.integers(0, 500),
        "prior_no_shows": st.integers(0, 500),
        "replied_last_reminder": st.integers(-1, 1),
    }
)


@settings(max_examples=400, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(features=valid)
def test_score_bounded_consistent_deterministic(client, features):
    a = client.post("/score", json=features)
    b = client.post("/score", json=features)
    assert a.status_code == 200
    body = a.json()
    assert 0.0 <= body["score"] <= 1.0
    assert body["band"] == band(body["score"])
    assert b.json() == body
