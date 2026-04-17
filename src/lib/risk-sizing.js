const QUALITY_WEIGHT = {
  A: 1,
  B: 0.82,
  C: 0.64,
  D: 0.48,
};

const TIER_LABELS = {
  watch: 'Watch only',
  small: 'Small',
  medium: 'Medium',
  full: 'Full',
};

export function computeRiskSizingGuidance(signal = {}, executionQuality = {}) {
  const edgePct = Math.abs(Number(signal.edge || 0)) * 100;
  const quality = String(signal.signalQualityGrade || 'C').toUpperCase();
  const qualityWeight = QUALITY_WEIGHT[quality] ?? 0.58;
  const execScore = Number(executionQuality.score ?? signal?.executionQuality?.score ?? 0);
  const isTradeable = signal.isTradeable !== false;
  const movementLabel = String(signal?.movementFlag?.label || '').toLowerCase();

  let tier = 'small';
  if (!isTradeable || execScore < 45) {
    tier = 'watch';
  } else if (edgePct >= 8 && execScore >= 78 && qualityWeight >= 0.8 && movementLabel === 'breakout') {
    tier = 'full';
  } else if (edgePct >= 5 && execScore >= 65 && qualityWeight >= 0.65) {
    tier = 'medium';
  }

  const multiplier = tier === 'watch' ? 0 : tier === 'small' ? 0.25 : tier === 'medium' ? 0.5 : 1;
  const reasons = [];
  reasons.push(`${edgePct.toFixed(2)}% edge`);
  reasons.push(`quality ${quality}`);
  reasons.push(`execution ${execScore.toFixed(0)}`);
  if (!isTradeable) reasons.push('not tradeable');
  if (movementLabel === 'breakout') reasons.push('breakout move');
  if (movementLabel === 'elevated') reasons.push('elevated move');

  return {
    tier,
    label: TIER_LABELS[tier],
    multiplier,
    summary: `${TIER_LABELS[tier]} size · ${reasons.join(' · ')}`,
    reason: reasons.join(' · '),
    edgePct: Number(edgePct.toFixed(2)),
    execScore: Number(execScore.toFixed(1)),
    quality,
  };
}
