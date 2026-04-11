export const MOVE_RULES = [
  { minMove: 12, minVolume: 400, scoreFloor: 22, label: 'breakout candidate' },
  { minMove: 8, minVolume: 700, scoreFloor: 18, label: 'liquid mover' },
  { minMove: 5, minVolume: 1000, scoreFloor: 15, label: 'watchlist drift' },
];

export const EDGE_CASES = [
  'Tiny move plus huge volume can still be filtered out if the score stays below the floor.',
  'Big move on thin volume is flagged, but the label should note lower confidence.',
  'Zero or missing volume should never crash the detector, it should just score conservatively.',
];

export function classifyMove(market) {
  const move = Math.abs(Number(market.move) || 0);
  const volume = Math.max(Number(market.volume) || 0, 0);
  const score = move * Math.log10(volume + 10);
  const rule = MOVE_RULES.find((entry) => move >= entry.minMove && volume >= entry.minVolume && score >= entry.scoreFloor);

  return {
    score,
    rule: rule ? rule.label : 'background noise',
    confidence: score >= 30 ? 'high' : score >= 18 ? 'medium' : 'low',
    edgeCase: volume === 0 ? 'no volume' : move >= 12 && volume < 400 ? 'thin volume' : null,
  };
}
