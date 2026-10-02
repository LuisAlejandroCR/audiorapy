# features.py: the only fields the risk model ever sees — numeric attendance features, no identifiers,
# no names, no phone numbers, no clinical data.
from pydantic import BaseModel, ConfigDict, Field

FEATURES = (
    "lead_days",
    "weekday",
    "hour",
    "zone",
    "session_number",
    "prior_visits",
    "prior_no_shows",
    "replied_last_reminder",
)


class RiskFeatures(BaseModel):
    model_config = ConfigDict(extra="forbid")

    lead_days: float = Field(ge=0, le=120)
    weekday: int = Field(ge=0, le=6)
    hour: int = Field(ge=0, le=23)
    zone: int = Field(ge=0, le=9)
    session_number: int = Field(ge=1, le=500)
    prior_visits: int = Field(ge=0, le=500)
    prior_no_shows: int = Field(ge=0, le=500)
    # -1 unknown, 0 no, 1 yes
    replied_last_reminder: int = Field(ge=-1, le=1)

    def row(self) -> list[float]:
        return [float(getattr(self, f)) for f in FEATURES]
