const clamp = (value, min = -100, max = 100) => Math.max(min, Math.min(max, value));

function formatDelta(value) {
  const fixed = Number(value || 0).toFixed(2);
  return `${value >= 0 ? '+' : ''}${fixed}pp`;
}

export function summarizeProbabilityTrend(signal = {}) {
  const history = Array.isArray(signal.probabilityHistory)
    ? signal.probabilityHistory.map((value) => Number(value)).filter(Number.isFinite)
    : [];

  if (history.length < 2) {
    return {
      delta24hPp: 0,
      accelerationPp: 0,
      direction: 'flat',
      label: 'Flat',
      badge: '0.00pp',
      summary: 'No 24h probability history yet',
      accelerationLabel: 'steady pace',
    };
  }

  const first = history[0];
  const last = history[history.length - 1];
  const deltas = history.slice(1).map((point, index) => (point - history[index]) * 100);
  const lastStep = deltas[deltas.length - 1] || 0;
  const priorStep = deltas[deltas.length - 2] || 0;
  const delta24hPp = clamp((last - first) * 100);
  const accelerationPp = clamp(lastStep - priorStep);
  const direction = delta24hPp === 0 ? 'flat' : (delta24hPp > 0 ? 'up' : 'down');
  const accelerationLabel = Math.abs(accelerationPp) < 0.5
    ? 'steady pace'
    : `${accelerationPp > 0 ? 'accelerating' : 'cooling'} ${Math.abs(accelerationPp).toFixed(2)}pp`;

  return {
    delta24hPp: Number(delta24hPp.toFixed(2)),
    accelerationPp: Number(accelerationPp.toFixed(2)),
    direction,
    label: delta24hPp > 0 ? 'Rising' : delta24hPp < 0 ? 'Falling' : 'Flat',
    badge: formatDelta(delta24hPp),
    summary: `${formatDelta(delta24hPp)} over 24h · ${accelerationLabel}`,
    accelerationLabel,
  };
}
