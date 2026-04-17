from datetime import datetime, timedelta, timezone

import pytest

from app.services.forecast_futures.backfill import run_backfill
from app.services.forecast_futures.backtest import run_backtest
from app.services.forecast_futures.contracts import validate_market_data_record
from app.services.forecast_futures.data_quality import run_dq_checks
from app.services.forecast_futures.feature_store import fetch_rows
from app.services.forecast_futures.inference_api import InferenceAPI, UnknownMarketError
from app.services.forecast_futures.signal_detector import detect_large_moves
from app.services.forecast_futures.train import train_baseline, predict
from app.services.forecast_futures.walk_forward import run_walk_forward


def _sample_record(ts, market_id="mkt-1", implied_prob=0.61):
    return {
        "market_id": market_id,
        "event_id": f"evt-{market_id}",
        "timestamp": ts.isoformat(),
        "implied_prob": implied_prob,
        "volume": 1200.0,
        "spread": 0.02,
        "depth": 800.0,
        "source": "test",
        "freshness_seconds": 0,
    }


def _labeled_rows(n=30):
    now = datetime.now(timezone.utc)
    rows = []
    for i in range(n):
        prob = 0.30 + ((i % 10) * 0.05)
        rows.append({
            **_sample_record(now - timedelta(minutes=i), market_id=f"mkt-{i % 3}", implied_prob=prob),
            "resolved_outcome": 1 if prob >= 0.5 else 0,
        })
    return rows


def test_contract_validation_accepts_valid_record():
    rec = validate_market_data_record(_sample_record(datetime.now(timezone.utc)))
    assert rec.market_id == "mkt-1"


def test_backfill_is_idempotent_and_generates_report(tmp_path):
    now = datetime.now(timezone.utc)
    records = [
        _sample_record(now - timedelta(days=1)),
        _sample_record(now - timedelta(hours=1), market_id="mkt-2"),
    ]
    in_file = tmp_path / "history.json"
    in_file.write_text(__import__("json").dumps(records), encoding="utf-8")

    report_file = tmp_path / "report.json"
    db_path = tmp_path / "feature_store.db"

    first = run_backfill(in_file, report_file, db_path=db_path, months=12)
    second = run_backfill(in_file, report_file, db_path=db_path, months=12)

    rows = fetch_rows(db_path=db_path)
    assert first["rows_upserted"] == 2
    assert second["rows_upserted"] == 2
    assert len(rows) == 2
    assert report_file.exists()


def test_dq_checks_catch_out_of_range_probability():
    bad = _sample_record(datetime.now(timezone.utc))
    bad["implied_prob"] = 2.0
    result = run_dq_checks([bad])
    assert result["summary"]["failed_records"] == 1


def test_card_016_calibration_method_selectable_and_ci_and_error_metric():
    rows = _labeled_rows(40)
    artifact = train_baseline(rows, calibration_method="isotonic")
    pred = predict(artifact, "mkt-1", implied_prob=0.58)

    assert artifact["calibration"]["method"] == "isotonic"
    assert "calibration_error_mae" in artifact["metrics"]
    assert artifact["metrics"]["calibration_error_mae"] >= 0
    lo, hi = pred["confidence_interval"]
    assert 0 <= lo <= hi <= 1


def test_card_017_inference_endpoint_contract_and_unknown_market_and_cached_latency():
    rows = _labeled_rows(50)
    artifact = train_baseline(rows, calibration_method="platt")
    api = InferenceAPI(artifact)

    response = api.predict({"market_id": "mkt-1", "market_prob": 0.61})
    assert set(["market_prob", "model_prob", "confidence_interval", "model_version", "computed_at"]).issubset(response.keys())

    with pytest.raises(UnknownMarketError):
        api.predict({"market_id": "mkt-404", "market_prob": 0.51})

    bench = api.benchmark_cached_path("mkt-1", 0.61, iterations=40)
    assert bench["p95_ms"] <= 250


def test_card_018_backtest_reports_brier_logloss_and_net_edge():
    rows = _labeled_rows(60)
    start = datetime.fromisoformat(rows[-1]["timestamp"])
    end = datetime.fromisoformat(rows[0]["timestamp"])
    result = run_backtest(
        rows,
        start_ts=start,
        end_ts=end,
        market_subset=["mkt-1", "mkt-2"],
        fee_bps=10,
        slippage_bps=15,
    )
    assert "brier_score" in result["metrics"]
    assert "log_loss" in result["metrics"]
    assert "net_edge" in result["metrics"]


def test_card_019_walk_forward_outputs_no_leakage_calibration_and_drift():
    rows = _labeled_rows(90)
    summary = run_walk_forward(rows, train_size=30, validate_size=15, test_size=15, step_size=15)

    assert summary["windows_evaluated"] >= 2
    assert "calibration_curve" in summary
    assert "drift_indicators" in summary
    assert "model_vs_market_baseline" in summary

    for window in summary["windows"]:
        assert window["train_end"] <= window["validate_start"]
        assert window["validate_end"] <= window["test_start"]


def test_card_020_large_move_detector_thresholds_context_and_dedupe():
    now = datetime.now(timezone.utc)
    history = [0.45, 0.46, 0.47, 0.46, 0.45, 0.47, 0.46]

    # first detection emits event
    events_1 = detect_large_moves(
        market_id="mkt-1",
        event_id="evt-mkt-1",
        current_prob=0.68,
        history_probs=history,
        timestamp=now,
        freshness_seconds=4,
        abs_threshold=0.10,
        z_threshold=2.0,
        dedupe_window_seconds=300,
    )
    assert len(events_1) == 1
    assert events_1[0]["movement_context"]["freshness_seconds"] == 4

    # second immediate call is deduped
    events_2 = detect_large_moves(
        market_id="mkt-1",
        event_id="evt-mkt-1",
        current_prob=0.69,
        history_probs=history,
        timestamp=now + timedelta(seconds=10),
        freshness_seconds=3,
        abs_threshold=0.10,
        z_threshold=2.0,
        dedupe_window_seconds=300,
    )
    assert events_2 == []
