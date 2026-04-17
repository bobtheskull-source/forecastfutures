const DEFAULT_HALF_LIFE_MS = 6 * 60 * 60 * 1000;

export function decayScore(entries = [], { now = Date.now(), halfLifeMs = DEFAULT_HALF_LIFE_MS } = {}) {
  return (Array.isArray(entries) ? entries : []).reduce((acc, entry) => {
    const ts = Number(entry?.ts || 0);
    if (!ts || ts > now) return acc;
    return acc + Math.exp(-(now - ts) / halfLifeMs);
  }, 0);
}

export function rankMostClicked(markets = [], telemetry = {}, { now = Date.now(), limit = 5 } = {}) {
  return [...markets]
    .map((market) => {
      const entries = Array.isArray(telemetry?.[market.id]) ? telemetry[market.id] : [];
      return {
        ...market,
        clickCount: entries.length,
        uniqueVisitors: new Set(entries.map((entry) => entry.visitor).filter(Boolean)).size,
        clickScore: Number(decayScore(entries, { now }).toFixed(4)),
      };
    })
    .sort((a, b) => b.clickScore - a.clickScore)
    .slice(0, Math.max(1, Number(limit || 5)));
}

export function rankMostExecuted(markets = [], funnelEvents = [], { now = Date.now(), windowMs = 24 * 60 * 60 * 1000, limit = 5 } = {}) {
  const byId = new Map(markets.map((market) => [String(market.id), market]));
  const counts = new Map();

  for (const event of funnelEvents || []) {
    if (event?.type !== 'trade') continue;
    const ts = Number(event?.ts || 0);
    if (!ts || (now - ts) > windowMs) continue;
    const id = String(event?.marketId || '');
    if (!id) continue;
    counts.set(id, (counts.get(id) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([id, tradeCount]) => ({
      ...(byId.get(id) || { id, title: id, tradeUrl: '#' }),
      tradeCount,
    }))
    .sort((a, b) => b.tradeCount - a.tradeCount)
    .slice(0, Math.max(1, Number(limit || 5)));
}
