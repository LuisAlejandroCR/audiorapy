# scoring.py: turns a probability into the score and band the API consumes.

BANDS = ((0.45, "high"), (0.25, "medium"), (0.0, "low"))


def band(score: float) -> str:
    for threshold, name in BANDS:
        if score >= threshold:
            return name
    return "low"


def clamp(p: float) -> float:
    if p != p:  # NaN
        return 0.0
    return round(min(1.0, max(0.0, p)), 3)
