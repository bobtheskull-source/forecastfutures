const FORBIDDEN = [
  /guaranteed/gi,
  /risk[- ]?free/gi,
  /can[']?t lose/gi,
  /sure thing/gi,
  /financial advice/gi,
];

const REQUIRED_DISCLAIMER = 'Forecasts are probabilistic and not financial advice. Trade responsibly.';

export function copyIsCompliant(text = '') {
  if (!text || typeof text !== 'string') return false;
  return FORBIDDEN.every((pattern) => !pattern.test(text));
}

export function enforceCompliantCopy(text = '') {
  let sanitized = String(text || '').trim();
  for (const pattern of FORBIDDEN) {
    sanitized = sanitized.replace(pattern, '');
  }
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  if (!sanitized.endsWith(REQUIRED_DISCLAIMER)) {
    sanitized = `${sanitized} ${REQUIRED_DISCLAIMER}`.trim();
  }
  return sanitized;
}

export function shouldShowPaywall({ tradeClicks = 0, selectedSignal = null } = {}) {
  const highIntentByClicks = Number(tradeClicks) >= 2;
  const highIntentBySignal = Number(selectedSignal?.rankScore || 0) >= 65;
  return highIntentByClicks || highIntentBySignal;
}

export function buildPaywallOffer({ selectedSignal = null, tradeClicks = 0 } = {}) {
  const rankScore = Number(selectedSignal?.rankScore || 0);
  const highIntent = shouldShowPaywall({ tradeClicks, selectedSignal });
  const tier = rankScore >= 80 ? 'pro' : rankScore >= 60 ? 'plus' : 'starter';

  const headline = highIntent
    ? 'Unlock pro opportunities + faster execution intel'
    : 'Start your trial for advanced market intel';

  const body = enforceCompliantCopy(
    `Get explainability, personalized alerts, and execution-quality filters tuned for ${selectedSignal?.title || 'your watchlist'}.`
  );

  return {
    tier,
    headline,
    body,
    ctaLabel: 'Start 7-day trial',
    onboardingSteps: [
      'Choose focus markets',
      'Set your alert thresholds',
      'Activate trial + trade links',
    ],
  };
}
