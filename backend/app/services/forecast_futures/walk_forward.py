from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

from .train import train_baseline, predict


def _target(row: Dict[str, Any]) -> float:
    if "resolved_outcome" in row:
        return float(row["resolved_outcome"])
    return 1.0 if float(row.get("implied_prob", 0.5)) >= 0.5 else 0.0


def _brier(rows: List[Dict[str, Any]], model, use_market=False) -> float:
    if not rows:
        return 0.0
    vals = []
    for r in rows:
        y = _target(r)
        p = float(r["implied_prob"]) if use_market else predict(model, r["market_id"], float(r["implied_prob"]))["model_prob"]
        vals.append((p - y) ** 2)
    return sum(vals) / len(vals)


def _calibration_curve(rows: List[Dict[str, Any]], model, bins: int = 5) -> List[Dict[str, float]]:
    bucketed = [{"pred": [], "obs": []} for _ in range(bins)]
    for r in rows:
        pred = predict(model, r["market_id"], float(r["implied_prob"]))["model_prob"]
        idx = min(bins - 1, int(pred * bins))
        bucketed[idx]["pred"].append(pred)
        bucketed[idx]["obs"].append(_target(r))

    out = []
    for i, b in enumerate(bucketed):
        if not b["pred"]:
            out.append({"bin": i, "pred_mean": 0.0, "obs_rate": 0.0, "count": 0})
            continue
        out.append({
            "bin": i,
            "pred_mean": sum(b["pred"]) / len(b["pred"]),
            "obs_rate": sum(b["obs"]) / len(b["obs"]),
            "count": len(b["pred"]),
        })
    return out


def run_walk_forward(
    rows: List[Dict[str, Any]],
    train_size: int = 50,
    validate_size: int = 20,
    test_size: int = 20,
    step_size: int = 20,
) -> Dict[str, Any]:
    sorted_rows = sorted(rows, key=lambda r: r["timestamp"])
    windows = []
    all_test_rows = []
    i = 0

    while i + train_size + validate_size + test_size <= len(sorted_rows):
        train_rows = sorted_rows[i:i + train_size]
        validate_rows = sorted_rows[i + train_size:i + train_size + validate_size]
        test_rows = sorted_rows[i + train_size + validate_size:i + train_size + validate_size + test_size]
        all_test_rows.extend(test_rows)

        model = train_baseline(train_rows)
        window = {
            "train_start": train_rows[0]["timestamp"],
            "train_end": train_rows[-1]["timestamp"],
            "validate_start": validate_rows[0]["timestamp"],
            "validate_end": validate_rows[-1]["timestamp"],
            "test_start": test_rows[0]["timestamp"],
            "test_end": test_rows[-1]["timestamp"],
            "model_brier": _brier(test_rows, model, use_market=False),
            "market_brier": _brier(test_rows, model, use_market=True),
            "drift_delta_mean_prob": abs(
                (sum(float(r["implied_prob"]) for r in train_rows) / len(train_rows))
                - (sum(float(r["implied_prob"]) for r in test_rows) / len(test_rows))
            ),
        }
        windows.append(window)
        i += max(1, step_size)

    if not windows:
        raise ValueError("Not enough rows for walk-forward windows")

    # Use final window model for aggregate calibration curve over all test rows
    final_train_end = rows[min(len(rows)-1, train_size-1)]
    _ = final_train_end
    aggregate_model = train_baseline(sorted_rows[:train_size])

    model_brier = sum(w["model_brier"] for w in windows) / len(windows)
    market_brier = sum(w["market_brier"] for w in windows) / len(windows)

    drift_vals = [w["drift_delta_mean_prob"] for w in windows]

    return {
        "windows_evaluated": len(windows),
        "windows": windows,
        "calibration_curve": _calibration_curve(all_test_rows, aggregate_model),
        "drift_indicators": {
            "mean_delta": sum(drift_vals) / len(drift_vals),
            "max_delta": max(drift_vals),
        },
        "model_vs_market_baseline": {
            "model_brier": model_brier,
            "market_brier": market_brier,
            "improvement": market_brier - model_brier,
        },
    }
