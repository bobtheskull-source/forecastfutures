export function filterMarkets(markets, query, tabFilters = {}) {
  const q = String(query || '').trim().toLowerCase();
  return markets.filter((market) => {
    const matchesQuery = !q || [market.title, market.event, market.reason, market.rank, market.confidence]
      .join(' ')
      .toLowerCase()
      .includes(q);
    const directionOk = !tabFilters.direction || market.direction === tabFilters.direction;
    const rankOk = !tabFilters.rank || market.rank === tabFilters.rank;
    return matchesQuery && directionOk && rankOk;
  });
}

export function buildActiveFilterSummary(filters = {}) {
  const parts = [];
  if (filters.query) parts.push(`Search: ${String(filters.query).trim()}`);
  if (filters.rank) parts.push(`Rank: ${String(filters.rank).trim()}`);
  if (filters.direction) parts.push(`Direction: ${String(filters.direction).trim()}`);
  if (filters.watchlistOnly) parts.push('Watchlist only');
  if (filters.feedMode && filters.feedMode !== 'now') parts.push(`Feed: ${String(filters.feedMode).trim()}`);
  if (filters.minEdgePreset != null) parts.push(`Edge ≥ ${Number(filters.minEdgePreset).toFixed(0)}%`);
  if (filters.maxResolveHours != null) parts.push(`Resolve ≤ ${Number(filters.maxResolveHours).toFixed(0)}h`);
  if (filters.breakoutOnly) parts.push('Breakouts');
  if (filters.executionReadyOnly) parts.push('Tradeable only');
  return parts.length ? parts.join(' · ') : 'No active filters';
}

export function sortMarkets(markets, sortKey = 'score') {
  const list = [...markets];
  const compare = {
    score: (a, b) => b.score - a.score,
    move: (a, b) => Math.abs(b.move) - Math.abs(a.move),
    volume: (a, b) => b.volume - a.volume,
  }[sortKey] || ((a, b) => b.score - a.score);
  return list.sort(compare);
}
