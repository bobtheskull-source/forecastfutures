function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[idx];
}

function syntheticLatencyMs(signal) {
  const base = 45;
  const freshnessPenalty = Math.min(140, Number(signal.freshnessSeconds || 0) / 12);
  const liquidityBonus = Math.min(25, Math.log10(Math.max(1, Number(signal.volume || 0))) * 4);
  const complexity = Math.min(60, Math.abs(Number(signal.move || 0)) * 2);
  return Number((base + freshnessPenalty + complexity - liquidityBonus).toFixed(2));
}

export function executionQualityReport(signal, options = {}) {
  const minDepth = Number(options.minDepth ?? 250);
  const minVolume = Number(options.minVolume ?? 200);
  const maxSpread = Number(options.maxSpread ?? 0.06);
  const freshnessThresholdSeconds = Number(options.freshnessThresholdSeconds ?? 900);

  const reasons = [];
  if (Number(signal.depth || 0) < minDepth) reasons.push('low_liquidity_depth');
  if (Number(signal.volume || 0) < minVolume) reasons.push('low_liquidity_volume');
  if (Number(signal.spread || 0) > maxSpread) reasons.push('wide_spread');
  if (Number(signal.freshnessSeconds || 0) > freshnessThresholdSeconds) reasons.push('stale_quote');

  return {
    pass: reasons.length === 0,
    reasons,
  };
}

export function applyLatencyAndStaleGuardrails(signals = [], options = {}) {
  const freshnessThresholdSeconds = Number(options.freshnessThresholdSeconds ?? 900);

  const accepted = [];
  const dropped = [];
  const latencies = [];
  const reasonCounts = {
    low_liquidity_depth: 0,
    low_liquidity_volume: 0,
    wide_spread: 0,
    stale_quote: 0,
  };

  for (const signal of signals) {
    const processingLatencyMs = syntheticLatencyMs(signal);
    const quality = executionQualityReport(signal, options);

    if (!quality.pass) {
      for (const reason of quality.reasons) {
        if (Object.hasOwn(reasonCounts, reason)) reasonCounts[reason] += 1;
      }
      dropped.push({
        marketId: signal.id,
        reasons: quality.reasons,
        freshnessSeconds: Number(signal.freshnessSeconds || 0),
      });
      continue;
    }

    latencies.push(processingLatencyMs);
    accepted.push({ ...signal, processingLatencyMs });
  }

  return {
    acceptedSignals: accepted,
    droppedSignals: dropped,
    metrics: {
      acceptedCount: accepted.length,
      droppedCount: dropped.length,
      staleDropCount: reasonCounts.stale_quote,
      p50LatencyMs: Number(percentile(latencies, 0.5).toFixed(2)),
      p95LatencyMs: Number(percentile(latencies, 0.95).toFixed(2)),
      reasonCounts,
      executionQualityGate: {
        minDepth: Number(options.minDepth ?? 250),
        minVolume: Number(options.minVolume ?? 200),
        maxSpread: Number(options.maxSpread ?? 0.06),
        freshnessThresholdSeconds,
      },
    },
  };
}
