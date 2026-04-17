FORECAST FUTURES - CARD DECOMPOSITION + ACCEPTANCE CRITERIA

Parent cards reviewed: CARD-006..CARD-010
Result: All 5 were Medium/Large and split into small executable backlog cards.

PARENT TRACKING
- CARD-006 Data ingestion and feature store (split)
- CARD-007 Forecast model service (split)
- CARD-008 Backtesting and evaluation (split)
- CARD-009 Real-time signal engine (split)
- CARD-010 Forecast Futures UI (split)

CHILD CARDS

CARD-011 | Backlog | Define market data schema + feature store contracts
AC:
1) Canonical schema includes market_id, event_id, timestamp, implied_prob, volume, spread, depth, source, freshness_seconds.
2) JSON schema validation exists and rejects malformed records.
3) Contract doc committed and referenced by ingestion + model services.

CARD-012 | Backlog | Build historical backfill pipeline
AC:
1) Backfill job imports at least 12 months (or max available) for selected markets.
2) Idempotent rerun does not duplicate rows.
3) Job output includes per-market row counts + missing interval report.

CARD-013 | Backlog | Build live market ingestion pipeline
AC:
1) Live ingest updates records at configured polling/stream interval.
2) freshness_seconds computed on each record.
3) Retry with exponential backoff on transient failures.

CARD-014 | Backlog | Add data quality checks for ingestion
AC:
1) DQ checks cover nulls, monotonic timestamps, out-of-range probabilities, negative volume/spread/depth.
2) Failed checks produce structured error logs.
3) Daily DQ summary artifact generated.

CARD-015 | Backlog | Train baseline probability model
AC:
1) Baseline model trains from feature store and outputs calibrated probabilities in [0,1].
2) Model artifact is versioned.
3) Training run is reproducible via single command.

CARD-016 | Backlog | Add calibration + confidence interval module
AC:
1) Calibration method implemented (Platt or isotonic) and selectable by config.
2) Prediction response includes confidence interval bounds.
3) Calibration error metric logged per run.

CARD-017 | Backlog | Expose model inference API
AC:
1) Endpoint returns market_prob, model_prob, confidence_interval, model_version, computed_at.
2) p95 response time <= 250ms on cached path.
3) Input validation rejects unknown market IDs with typed error.

CARD-018 | Backlog | Build historical backtest engine
AC:
1) Backtest runs across configurable date range and market subset.
2) Reports Brier score + log loss.
3) Net edge includes fees/slippage parameters.

CARD-019 | Backlog | Build walk-forward evaluation pipeline
AC:
1) Time-sliced train/validate/test windows implemented with no leakage.
2) Outputs calibration curve and drift indicators.
3) Run summary compares model vs market baseline.

CARD-020 | Backlog | Implement large-move detector
AC:
1) Detector flags moves by configurable thresholds (absolute and z-score).
2) Emits event payload with movement context and freshness.
3) Duplicate suppression window prevents alert spam.

CARD-021 | Deployed Done | Implement edge/ranking engine
AC:
1) Rank score combines edge, confidence, liquidity, spread quality, recency.
2) Low-tradeability markets are penalized or gated.
3) Ranking output includes score breakdown fields.

CARD-022 | Deployed Done | Add latency + stale-signal guardrails
AC:
1) End-to-end latency measured from ingest to emitted signal.
2) Signals older than freshness threshold are auto-suppressed.
3) Monitoring exposes p50/p95 latency and stale-drop counts.

CARD-023 | Deployed Done | Build Forecast Futures list screen
AC:
1) List shows top opportunities with market move, model edge, confidence, freshness.
2) Supports sort by score, recency, and most-clicked.
3) Empty/loading/error states implemented.

CARD-024 | Deployed Done | Build Forecast detail screen
AC:
1) Detail view shows probability trend chart + scenario driver tags.
2) Displays market_prob vs model_prob with confidence interval.
3) Last updated timestamp visible.

CARD-025 | Deployed Done | Add trade deep-link + click telemetry
AC:
1) "Open in Kalshi" deep-link launches target market reliably.
2) Click telemetry records unique clicks per market for trending.
3) Most-clicked module renders from telemetry with time decay window.

CARD-026 | Ready to Deploy | Add saved watchlists + focused market filters
AC:
1) Users can save and restore named watchlists in local storage.
2) List view can filter to selected watchlists and preserve the active set.
3) Watchlist state survives refresh and does not break existing sort/search controls.

CARD-027 | Ready to Deploy | Add URL-shareable list state and deep links
AC:
1) Search, sort, feed mode, and selected market can be encoded in the URL.
2) Opening a shared link restores the same list/detail state.
3) Invalid or missing query params fall back safely to defaults.

CARD-028 | Ready to Deploy | Improve export/share helpers for briefs and reviews
AC:
1) CSV and share text exports include score breakdown, confidence, and timestamp fields.
2) Export actions work from list, detail, and archive surfaces.
3) Exported text stays concise enough for mobile sharing and clipboard fallback.

CARD-029 | Ready to Deploy | Add model/market freshness indicators and staleness badges
AC:
1) Every surfaced market shows freshness and update age in a visible badge.
2) Stale signals are labeled consistently across list, detail, and archive views.
3) Badge thresholds match guardrail settings and are tested directly.

CARD-030 | Ready to Deploy | Clean up mobile layout spacing and blocking controls
AC:
1) Fixed/sticky controls never cover the main content on mobile or desktop.
2) Buttons, chips, and modals have safe spacing and accessible tap targets.
3) No primary section becomes unreachable after scrolling or opening overlays.

CARD-031 | Backlog | Add selected-market compare panel with event median deltas
AC:
1) Detail view shows selected market vs event median edge, depth, and freshness.
2) Comparison uses the same data model as list sort/share flows.
3) Missing comparison data falls back safely without breaking the detail panel.

CARD-032 | Backlog | Add alert history and dismiss/archive state for surfaced opportunities
AC:
1) Users can see recently surfaced alerts with timestamps and reasons.
2) Alerts can be dismissed or archived per market without affecting rankings.
3) Alert history persists locally and survives refresh.

CARD-033 | Backlog | Add first-run onboarding guidance for list, detail, and trade actions
AC:
1) New users see a concise guided intro for list, detail, and trade CTA usage.
2) Onboarding state persists locally after dismissal.
3) Guidance does not block core screens or cover important controls.

CARD-034 | Backlog | Add accessibility and keyboard navigation fixes for all primary surfaces
AC:
1) All primary controls are reachable via keyboard and have visible focus states.
2) Modal open/close and tab navigation work without trapping the user.
3) Contrast and tap-target issues are remediated on mobile and desktop.

CARD-035 | Backlog | Improve feed performance for larger market sets
AC:
1) List rendering remains responsive with larger arrays of markets.
2) Expensive derived calculations are cached or minimized.
3) Filtering, sorting, and detail selection still work after performance changes.

CARD-036 | Backlog | Add dismissible onboarding banner with local persistence
AC:
1) New users see a compact banner that explains list, detail, and trade flows.
2) Dismissing the banner persists locally and restores on reload only for first-time visitors.
3) Banner never blocks core controls or covers the sticky trade action.

CARD-037 | Backlog | Add keyboard focus management and escape handling for modals
AC:
1) Primary controls have visible focus states and are reachable via keyboard.
2) Escape closes open modals and returns focus to the triggering control.
3) Modal tab order stays contained while open and releases cleanly on close.

CARD-066 | Backlog | Surface server readiness and missing credential status in the UI
AC:
1) App shows a clear backend readiness card with ready/missing state from the server report.
2) Missing credentials and private-key issues are visible to the operator without opening code or logs.
3) Deployment notes explain that auth stays server-side and the Pages client remains read-only.

CARD-067 | Backlog | Add backend sync health, refresh, and retry status for data reads
AC:
1) The UI shows last refresh time, retry state, and a visible error banner when data reads fail.
2) A retry action reruns the read path without requiring a full page reload.
3) Health state does not block normal list, detail, or archive navigation.

CARD-068 | Backlog | Wire infrastructure guidance into onboarding and settings surfaces
AC:
1) Onboarding or settings surfaces explain the API host vs GitHub Pages split.
2) Guidance includes the read-only client rule and where credentials live.
3) The guidance is dismissible and does not cover primary controls.

CARD-069 | Backlog | Unblock sticky controls and overlay layers across list/detail/archive
AC:
1) Sticky trade and nav controls never cover list rows, detail panels, or archive cards.
2) Overlay z-index and bottom spacing are adjusted so modal and action layers stay usable.
3) The fix is verified on narrow and tall viewports.

CARD-070 | Backlog | Tighten responsive spacing and safe-area padding for mobile controls
AC:
1) Button groups, chips, and action rows keep safe tap targets on mobile.
2) Safe-area padding prevents content from sitting under fixed controls.
3) Horizontal scrolling is not introduced on the primary views.

Suggested execution order:
CARD-011 -> 012 -> 013 -> 014 -> 015 -> 016 -> 017 -> 018 -> 019 -> 020 -> 021 -> 022 -> 023 -> 024 -> 025 -> 026 -> 027 -> 028 -> 029 -> 030 -> 031 -> 032 -> 033 -> 034 -> 035 -> 036 -> 037 -> 066 -> 067 -> 068 -> 069 -> 070
