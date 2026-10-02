# synthetic.py: a seeded synthetic attendance data set for the demo. Every row is invented; the label
# comes from a hidden rule plus noise so a model has something to learn.
import numpy as np

from .features import FEATURES


def generate(n: int = 600, seed: int = 7) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(seed)
    lead = rng.gamma(2.0, 3.0, n).clip(0, 60)
    weekday = rng.integers(0, 6, n)
    hour = rng.choice([8, 9, 10, 11, 14, 15, 16, 17], n)
    zone = rng.integers(0, 4, n)
    session = rng.integers(1, 40, n)
    prior = np.minimum(session - 1, rng.integers(0, 40, n))
    propensity = rng.beta(1.2, 6.0, n)
    prior_ns = rng.binomial(prior, propensity)
    replied = rng.choice([-1, 0, 1], n, p=[0.2, 0.25, 0.55])

    logit = (
        -2.4
        + 4.0 * propensity
        + 0.05 * lead
        + 0.9 * (replied == 0)
        + 0.35 * (zone == 3)
        + 0.3 * (hour >= 16)
        - 0.02 * session
        + rng.normal(0, 0.6, n)
    )
    y = (rng.random(n) < 1 / (1 + np.exp(-logit))).astype(int)
    x = np.column_stack([lead, weekday, hour, zone, session, prior, prior_ns, replied]).astype(float)
    assert x.shape[1] == len(FEATURES)
    return x, y
