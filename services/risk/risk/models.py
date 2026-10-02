# models.py: the two classifiers — a logistic-regression baseline and TabPFN-2 (Apache-2.0 weights).
# TabPFN is optional: if it is not installed or its weights cannot be fetched, ModelUnavailable says why.
from typing import Protocol

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

MODEL_NAMES = ("logistic", "tabpfn-v2")


class ModelUnavailable(RuntimeError):
    pass


class Classifier(Protocol):
    def predict_proba(self, x: np.ndarray) -> np.ndarray: ...


def train(name: str, x: np.ndarray, y: np.ndarray) -> Classifier:
    if name == "logistic":
        model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
        model.fit(x, y)
        return model
    if name == "tabpfn-v2":
        try:
            from tabpfn import TabPFNClassifier
            from tabpfn.constants import ModelVersion
        except ImportError as error:
            raise ModelUnavailable("tabpfn is not installed (pip install '.[tabpfn]')") from error
        try:
            model = TabPFNClassifier.create_default_for_version(ModelVersion.V2, device="cpu")
            model.fit(x, y)
        except Exception as error:  # weights download or runtime failure
            raise ModelUnavailable(f"tabpfn-v2 could not load: {error}") from error
        return model
    raise ValueError(f"unknown model {name!r}; expected one of {MODEL_NAMES}")
