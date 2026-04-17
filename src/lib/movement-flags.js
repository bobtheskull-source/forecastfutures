const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

export function classifyMovement(signal = {}) {
  const history = Array.isArray(signal.probabilityHistory) ? signal.probabilityHistory : [];
  const first = Number(history[0] ?? signal.marketProb ?? signal.price / 100 ?? 0);
  const last = Number(history[history.length - 1] ?? signal.modelProb ?? signal.price / 100 ?? 0);
  const driftPp = Number(((last - first) * 100).toFixed(2));
  const move = Number(signal.move || 0);
  const amplitudePp = Math.max(Math.abs(driftPp), Math.abs(move));

  let label = 'Normal';
  if (amplitudePp >= 12) label = 'Breakout';
  else if (amplitudePp >= 7) label = 'Elevated';

  const direction = driftPp === 0 ? (move >= 0 ? 'up' : 'down') : (driftPp > 0 ? 'up' : 'down');
  const reliability = clamp((Number(signal.depth || 0) / 700) * 0.5 + (1 - Number(signal.spread || 0) / 0.08) * 0.5, 0, 1);

  return {
    label,
    direction,
    driftPp,
    amplitudePp: Number(amplitudePp.toFixed(2)),
    reliability: Number(reliability.toFixed(3)),
  };
}
