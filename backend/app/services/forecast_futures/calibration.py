from __future__ import annotations

from typing import Any, Dict, List


def _safe_target(row: Dict[str, Any]) -> float:
    if "resolved_outcome" in row:
        return float(row["resolved_outcome"])
    return float(row.get("implied_prob", 0.5))


def fit_calibration(rows: List[Dict[str, Any]], method: str = "platt") -> Dict[str, Any]:
    method = (method or "platt").lower()
    if method not in {"platt", "isotonic"}:
        raise ValueError("calibration_method must be one of: platt, isotonic")

    if not rows:
        return {"method": method, "params": {}}

    if method == "platt":
        # Lightweight Platt-like scaling parameters around market mean.
        mean_target = sum(_safe_target(r) for r in rows) / len(rows)
        mean_input = sum(float(r.get("implied_prob", 0.5)) for r in rows) / len(rows)
        a = 1.5
        b = mean_target - mean_input
        return {"method": method, "params": {"a": a, "b": b}}

    # Isotonic-style monotonic bins without external deps.
    sorted_rows = sorted(rows, key=lambda r: float(r.get("implied_prob", 0.5)))
    bin_size = max(1, len(sorted_rows) // 5)
    bins = []
    for i in range(0, len(sorted_rows), bin_size):
        chunk = sorted_rows[i:i + bin_size]
        if not chunk:
            continue
        x = sum(float(r.get("implied_prob", 0.5)) for r in chunk) / len(chunk)
        y = sum(_safe_target(r) for r in chunk) / len(chunk)
        bins.append({"x": x, "y": y})

    # Enforce monotonic y
    for i in range(1, len(bins)):
        if bins[i]["y"] < bins[i - 1]["y"]:
            bins[i]["y"] = bins[i - 1]["y"]

    return {"method": method, "params": {"bins": bins}}


def apply_calibration(raw_prob: float, calibration: Dict[str, Any]) -> float:
    method = calibration.get("method", "platt")
    params = calibration.get("params", {})

    raw_prob = max(0.0, min(1.0, float(raw_prob)))

    if method == "platt":
        a = float(params.get("a", 1.0))
        b = float(params.get("b", 0.0))
        calibrated = (a * raw_prob) + b
        return max(0.0, min(1.0, calibrated))

    bins = params.get("bins", [])
    if not bins:
        return raw_prob

    # Piecewise linear interpolation between monotonic bins.
    if raw_prob <= bins[0]["x"]:
        return max(0.0, min(1.0, float(bins[0]["y"])))
    if raw_prob >= bins[-1]["x"]:
        return max(0.0, min(1.0, float(bins[-1]["y"])))

    for left, right in zip(bins, bins[1:]):
        if left["x"] <= raw_prob <= right["x"]:
            span = max(1e-9, right["x"] - left["x"])
            t = (raw_prob - left["x"]) / span
            y = left["y"] + t * (right["y"] - left["y"])
            return max(0.0, min(1.0, float(y)))

    return raw_prob


def calibration_error_mae(rows: List[Dict[str, Any]], calibration: Dict[str, Any]) -> float:
    if not rows:
        return 0.0
    errs = []
    for row in rows:
        p = apply_calibration(float(row.get("implied_prob", 0.5)), calibration)
        y = _safe_target(row)
        errs.append(abs(p - y))
    return sum(errs) / len(errs)
