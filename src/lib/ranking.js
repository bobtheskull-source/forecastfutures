const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));

function confidenceToScore(confidence = 'low') {
  if (confidence === 'high') return 0.9;
  if (confidence === 'medium') return 0.6;
  return 0.35;
}

function recencyScore(freshnessSeconds) {
  return clamp(1 - (Number(freshnessSeconds || 0) / 3600));
}

function liquidityScore(volume, depth) {
  const v = clamp(Math.log10(Math.max(1, Number(volume) + 1)) / 4);
  const d = clamp(Math.log10(Math.max(1, Number(depth) + 1)) / 4);
  return (v + d) / 2;
}

function spreadQualityScore(spread) {
  return clamp(1 - (Number(spread) / 0.08));
}

function volumeAnomalyScore(volume, baselineVolume = 450) {
  const ratio = Number(volume || 0) / Math.max(1, Number(baselineVolume || 1));
  return clamp((ratio - 1) / 2.5);
}

function deriveModelProb(marketProb, move, volume) {
  const moveLift = clamp((Number(move) || 0) / 30, -0.25, 0.25);
  const volumeLift = clamp((Math.log10(Math.max(1, Number(volume) + 1)) - 2.0) / 10, -0.05, 0.05);
  return clamp(marketProb + moveLift + volumeLift);
}

export function scoreOpportunity(signal) {
  const marketProb = clamp(Number(signal.price) / 100);
  const modelProb = signal.modelProb == null
    ? deriveModelProb(marketProb, signal.move, signal.volume)
    : clamp(Number(signal.modelProb));
  const edge = modelProb - marketProb;

  const edgeScore = clamp(Math.abs(edge) / 0.25);
  const confidenceScore = confidenceToScore(signal.confidence);
  const liquidity = liquidityScore(signal.volume, signal.depth);
  const spreadQuality = spreadQualityScore(signal.spread);
  const recency = recencyScore(signal.freshnessSeconds);
  const volumeAnomaly = volumeAnomalyScore(signal.volume, signal.avgVolume24h ?? signal.volumeBaseline ?? 450);

  const isTradeable = Number(signal.spread) <= 0.06 && Number(signal.depth) >= 250 && Number(signal.volume) >= 200 && Number(signal.freshnessSeconds) <= 900;
  const tradeabilityPenalty = isTradeable ? 0 : 12;

  const weighted =
    (edgeScore * 30) +
    (volumeAnomaly * 15) +
    (confidenceScore * 15) +
    (liquidity * 20) +
    (spreadQuality * 10) +
    (recency * 10);
  const rankScore = Math.max(0, weighted - tradeabilityPenalty);

  return {
    ...signal,
    marketProb,
    modelProb,
    edge,
    rankScore,
    isTradeable,
    scoreBreakdown: {
      move: Number(Math.min(15, Math.abs(Number(signal.move || 0)) * 0.9).toFixed(2)),
      volumeAnomaly: Number((volumeAnomaly * 15).toFixed(2)),
      modelEdge: Number((edgeScore * 30).toFixed(2)),
      liquidity: Number((liquidity * 20).toFixed(2)),
      recency: Number((recency * 10).toFixed(2)),
      confidence: Number((confidenceScore * 15).toFixed(2)),
      spreadQuality: Number((spreadQuality * 10).toFixed(2)),
      tradeabilityPenalty,
    },
  };
}

export function rankOpportunities(signals = []) {
  return [...signals]
    .map(scoreOpportunity)
    .sort((a, b) => b.rankScore - a.rankScore);
}
