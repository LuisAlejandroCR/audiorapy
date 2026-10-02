# test_fuzz.py: arbitrary JSON bodies and raw bytes never make the sidecar answer 5xx (400/422 are fine).
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

json_values = st.recursive(
    st.none() | st.booleans() | st.integers() | st.floats(allow_nan=False, allow_infinity=False) | st.text(max_size=20),
    lambda children: st.lists(children, max_size=4) | st.dictionaries(st.text(max_size=10), children, max_size=4),
    max_leaves=12,
)


@settings(max_examples=300, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(body=json_values)
def test_score_never_5xx(client, body):
    assert client.post("/score", json=body).status_code < 500


@settings(max_examples=300, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(raw=st.binary(max_size=200))
def test_raw_bytes_never_5xx(client, raw):
    r = client.post("/score", content=raw, headers={"content-type": "application/json"})
    assert r.status_code < 500
