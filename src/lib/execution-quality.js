const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));

export function executionQualityScore(signal = {}) {
  const spread = Number(signal.spread || 0.1);
  const depth = Number(signal.depth || 0);
  const volume = Number(signal.volume || 0);
  const freshnessSeconds = Number(signal.freshnessSeconds || 9999);

  const spreadScore = clamp((0.08 - spread) / 0.08 * 35, 0, 35);
  const depthScore = clamp(depth / 800 * 25, 0, 25);
  const volumeScore = clamp(volume / 1200 * 20, 0, 20);
  const freshnessScore = clamp((1200 - freshnessSeconds) / 1200 * 20, 0, 20);

  const score = Number((spreadScore + depthScore + volumeScore + freshnessScore).toFixed(2));
  const expectedSlippageBps = Number((Math.max(0, spread * 10000 * (1.1 - Math.min(1, depth / 900)))).toFixed(1));

  const guidance = [];
  if (spread > 0.06) guidance.push('Use limit order due to wide spread');
  if (depth < 250) guidance.push('Reduce size due to shallow depth');
  if (freshnessSeconds > 900) guidance.push('Refresh quote before execution');
  if (!guidance.length) guidance.push('Execution conditions look healthy');

  return {
    score,
    expectedSlippageBps,
    guidance,
  };
}
