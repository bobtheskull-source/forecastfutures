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

export function sortMarkets(markets, sortKey = 'score') {
  const list = [...markets];
  const compare = {
    score: (a, b) => b.score - a.score,
    move: (a, b) => Math.abs(b.move) - Math.abs(a.move),
    volume: (a, b) => b.volume - a.volume,
  }[sortKey] || ((a, b) => b.score - a.score);
  return list.sort(compare);
}
