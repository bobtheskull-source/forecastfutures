from __future__ import annotations

from datetime import datetime, timezone
from time import perf_counter
from typing import Any, Dict, Tuple

from .train import predict


class UnknownMarketError(ValueError):
    def __init__(self, market_id: str):
        self.code = "UNKNOWN_MARKET_ID"
        super().__init__(f"Unknown market_id: {market_id}")


class InferenceAPI:
    def __init__(self, model_artifact: Dict[str, Any]):
        self.model_artifact = model_artifact
        self._cache: Dict[Tuple[str, float], Dict[str, Any]] = {}

    def predict(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        start = perf_counter()
        market_id = str(payload.get("market_id", "")).strip()
        market_prob = float(payload.get("market_prob", -1.0))

        if not market_id:
            raise ValueError("market_id is required")
        if market_id not in self.model_artifact.get("market_params", {}):
            raise UnknownMarketError(market_id)
        if not (0.0 <= market_prob <= 1.0):
            raise ValueError("market_prob must be between 0 and 1")

        key = (market_id, round(market_prob, 6))
        if key in self._cache:
            cached = dict(self._cache[key])
            cached["cache_hit"] = True
            cached["latency_ms"] = (perf_counter() - start) * 1000.0
            return cached

        model = predict(self.model_artifact, market_id=market_id, implied_prob=market_prob)
        response = {
            "market_prob": market_prob,
            "model_prob": model["model_prob"],
            "confidence_interval": model["confidence_interval"],
            "model_version": self.model_artifact.get("model_version", "unknown"),
            "computed_at": datetime.now(timezone.utc).isoformat(),
            "cache_hit": False,
        }
        response["latency_ms"] = (perf_counter() - start) * 1000.0
        self._cache[key] = dict(response)
        return response

    def benchmark_cached_path(self, market_id: str, market_prob: float, iterations: int = 50) -> Dict[str, float]:
        self.predict({"market_id": market_id, "market_prob": market_prob})
        timings = []
        for _ in range(max(1, iterations)):
            start = perf_counter()
            _ = self.predict({"market_id": market_id, "market_prob": market_prob})
            timings.append((perf_counter() - start) * 1000.0)

        timings.sort()
        idx = min(len(timings) - 1, int(0.95 * len(timings)))
        return {
            "iterations": len(timings),
            "p95_ms": timings[idx],
            "p50_ms": timings[len(timings) // 2],
        }
