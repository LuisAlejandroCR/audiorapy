# evaluate.py: compares the models on a holdout of the synthetic data (ROC-AUC). The numbers describe
# synthetic data only; they say nothing about real families until retrained on real attendance.
import argparse
import sys
import time

from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

from .models import MODEL_NAMES, ModelUnavailable, train
from .synthetic import generate


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--models", default="logistic,tabpfn-v2")
    parser.add_argument("--rows", type=int, default=600)
    parser.add_argument("--seed", type=int, default=7)
    parser.add_argument("--min-auc", type=float, default=None, help="fail if the logistic baseline is below this")
    args = parser.parse_args(argv)

    x, y = generate(args.rows, args.seed)
    x_tr, x_te, y_tr, y_te = train_test_split(x, y, test_size=0.3, random_state=args.seed, stratify=y)
    print(f"Synthetic attendance, {args.rows} rows, no-show rate {y.mean():.1%}, holdout {len(y_te)}")
    print("| Model | ROC-AUC (holdout) | Fit + predict |")
    print("|---|---|---|")
    aucs: dict[str, float] = {}
    for name in [m.strip() for m in args.models.split(",") if m.strip()]:
        if name not in MODEL_NAMES:
            print(f"unknown model {name}", file=sys.stderr)
            return 2
        started = time.perf_counter()
        try:
            model = train(name, x_tr, y_tr)
            auc = roc_auc_score(y_te, model.predict_proba(x_te)[:, 1])
        except ModelUnavailable as error:
            print(f"| {name} | unavailable: {error} | — |")
            continue
        aucs[name] = auc
        print(f"| {name} | {auc:.3f} | {time.perf_counter() - started:.1f} s |")
    if args.min_auc is not None and aucs.get("logistic", 0.0) < args.min_auc:
        print(f"logistic AUC below {args.min_auc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
