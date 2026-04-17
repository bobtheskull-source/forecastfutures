from __future__ import annotations

from datetime import datetime
from math import log
from typing import Any, Dict, List, Optional

from .train import train_baseline, predict


def _target(row: Dict[str, Any]) -> float:
    if "resolved_outcome" in row:
        return float(row["resolved_outcome"])
    return 1.0 if float(row.get("implied_prob", 0.5)) >= 0.5 else 0.0


def _safe_logloss(y: float, p: float) -> float:
    p = min(1 - 1e-9, max(1e-9, p))
    return -(y * log(p) + (1 - y) * log(1 - p))


def run_backtest(
    rows: List[Dict[str, Any]],
    start_ts: datetime,
    end_ts: datetime,
    market_subset: Optional[List[str]] = None,
    fee_bps: float = 0.0,
    slippage_bps: float = 0.0,
    calibration_method: str = "platt",
) -> Dict[str, Any]:
    market_subset = set(market_subset or [])

    scoped = []
    for r in rows:
        ts = datetime.fromisoformat(str(r["timestamp"]).replace("Z", "+00:00"))
        if ts < start_ts or ts > end_ts:
            continue
        if market_subset and r["market_id"] not in market_subset:
            continue
        scoped.append(r)

    if not scoped:
        raise ValueError("No rows in requested backtest scope")

    artifact = train_baseline(scoped, calibration_method=calibration_method)

    brier, logloss = [], []
    gross_edge = 0.0
    for row in scoped:
        mkt = float(row["implied_prob"])
        y = _target(row)
        pred = predict(artifact, row["market_id"], mkt)["model_prob"]
        brier.append((pred - y) ** 2)
        logloss.append(_safe_logloss(y, pred))

        # proxy edge: alignment with realized direction
        gross_edge += (pred - mkt) * (1 if y > 0.5 else -1)

    gross_edge /= len(scoped)
    cost_rate = (fee_bps + slippage_bps) / 10_000.0
    net_edge = gross_edge - cost_rate

    return {
        "config": {
            "start_ts": start_ts.isoformat(),
            "end_ts": end_ts.isoformat(),
            "market_subset": sorted(market_subset) if market_subset else "all",
            "fee_bps": fee_bps,
            "slippage_bps": slippage_bps,
            "rows_evaluated": len(scoped),
        },
        "metrics": {
            "brier_score": sum(brier) / len(brier),
            "log_loss": sum(logloss) / len(logloss),
            "gross_edge": gross_edge,
            "net_edge": net_edge,
        },
    }
