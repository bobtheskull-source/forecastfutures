import fs from 'node:fs';

function normalizeMarket(market) {
  const now = Date.now();
  const updatedAt = market.updatedAt || new Date(now).toISOString();
  const tradeUrl = market.tradeUrl || `https://kalshi.com/markets/${market.id || 'unknown'}`;

  return {
    ...market,
    depth: Number(market.depth ?? 300),
    spread: Number(market.spread ?? 0.05),
    updatedAt,
    scenarioDrivers: Array.isArray(market.scenarioDrivers) ? market.scenarioDrivers : ['Market structure', 'Event flow'],
    probabilityHistory: Array.isArray(market.probabilityHistory) ? market.probabilityHistory : [Number(market.price || 50) / 100],
    tradeUrl,
  };
}

export function loadMarketSnapshots(snapshotPath) {
  if (!snapshotPath) {
    return null;
  }
  const raw = fs.readFileSync(snapshotPath, 'utf8');
  const parsed = JSON.parse(raw);
  const rows = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.markets) ? parsed.markets : null);
  if (!rows) {
    throw new Error('Snapshot file must contain an array or a { markets: [] } object.');
  }
  return rows.map(normalizeMarket);
}

export function describeSnapshotSource(snapshotPath) {
  if (!snapshotPath) {
    return 'using bundled sample markets';
  }
  return `loaded from ${snapshotPath}`;
}
