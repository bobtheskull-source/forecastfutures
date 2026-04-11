export function explainSignal(market) {
  const move = Math.abs(Number(market.move) || 0);
  const volume = Math.max(Number(market.volume) || 0, 0);
  if (move >= 12 && volume >= 700) return 'big move with enough volume to matter';
  if (move >= 8 && volume >= 400) return 'credible move with real participation';
  if (move >= 5) return 'watchlist drift with some momentum';
  return 'low signal, probably noise';
}

export function rankSignal(market) {
  const score = Math.abs(Number(market.move) || 0) * Math.log10(Math.max(Number(market.volume) || 0, 0) + 10);
  return score >= 30 ? 'A' : score >= 22 ? 'B' : score >= 15 ? 'C' : 'D';
}
