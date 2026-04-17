from __future__ import annotations

from datetime import datetime, timezone
from statistics import mean, pstdev
from typing import Any, Dict, List, Tuple


_LAST_EMITTED: Dict[Tuple[str, str], datetime] = {}


def detect_large_moves(
    market_id: str,
    event_id: str,
    current_prob: float,
    history_probs: List[float],
    timestamp: datetime,
    freshness_seconds: int,
    abs_threshold: float = 0.10,
    z_threshold: float = 2.0,
    dedupe_window_seconds: int = 300,
) -> List[Dict[str, Any]]:
    if not history_probs:
        return []

    prev = float(history_probs[-1])
    abs_move = float(current_prob) - prev

    mu = mean(history_probs)
    sigma = pstdev(history_probs) if len(history_probs) > 1 else 0.0
    z = 0.0 if sigma == 0 else (float(current_prob) - mu) / sigma

    triggered = (abs(abs_move) >= abs_threshold) or (abs(z) >= z_threshold)
    if not triggered:
        return []

    key = (market_id, event_id)
    last = _LAST_EMITTED.get(key)
    if last and (timestamp - last).total_seconds() < dedupe_window_seconds:
        return []

    _LAST_EMITTED[key] = timestamp

    return [{
        "signal_type": "large_move",
        "market_id": market_id,
        "event_id": event_id,
        "detected_at": timestamp.astimezone(timezone.utc).isoformat(),
        "movement_context": {
            "current_prob": float(current_prob),
            "previous_prob": prev,
            "abs_move": abs_move,
            "z_score": z,
            "history_mean": mu,
            "history_std": sigma,
            "freshness_seconds": int(freshness_seconds),
            "abs_threshold": float(abs_threshold),
            "z_threshold": float(z_threshold),
        },
    }]
