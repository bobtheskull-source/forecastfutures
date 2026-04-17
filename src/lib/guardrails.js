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

export function applyLatencyAndStaleGuardrails(signals = [], options = {}) {
  const freshnessThresholdSeconds = Number(options.freshnessThresholdSeconds ?? 900);

  const accepted = [];
  const dropped = [];
  const latencies = [];

  for (const signal of signals) {
    const processingLatencyMs = syntheticLatencyMs(signal);
    const stale = Number(signal.freshnessSeconds || 0) > freshnessThresholdSeconds;

    if (stale) {
      dropped.push({
        marketId: signal.id,
        reason: 'stale_signal',
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
      staleDropCount: dropped.length,
      p50LatencyMs: Number(percentile(latencies, 0.5).toFixed(2)),
      p95LatencyMs: Number(percentile(latencies, 0.95).toFixed(2)),
    },
  };
}
