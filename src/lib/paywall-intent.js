export function computePaywallIntent({
  tradeClicks = 0,
  rankScore = 0,
  edge = 0,
  risingScore = 0,
  clickScore = 0,
} = {}) {
  const clicks = Math.min(1, Number(tradeClicks || 0) / 4);
  const rank = Math.min(1, Number(rankScore || 0) / 100);
  const edgeLift = Math.min(1, Math.abs(Number(edge || 0)) / 0.12);
  const rising = Math.min(1, Number(risingScore || 0) / 3.5);
  const clickLift = Math.min(1, Number(clickScore || 0) / 3);
  const score = (clicks * 0.25) + (rank * 0.25) + (edgeLift * 0.2) + (rising * 0.15) + (clickLift * 0.15);
  const tier = score >= 0.75 ? 'hot' : score >= 0.5 ? 'warm' : 'cold';
  return { score: Number(score.toFixed(4)), tier };
}

export function paywallHeadlineByIntent(intent = { tier: 'cold' }) {
  if (intent?.tier === 'hot') return 'Hot market momentum detected — unlock pro execution intel';
  if (intent?.tier === 'warm') return 'Strong opportunities detected — unlock deeper trade timing intel';
  return 'Start your trial for advanced market intel';
}
