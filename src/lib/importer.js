import fs from 'node:fs';

export function loadMarketSnapshots(snapshotPath) {
  if (!snapshotPath) {
    return null;
  }
  const raw = fs.readFileSync(snapshotPath, 'utf8');
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (Array.isArray(parsed.markets)) {
    return parsed.markets;
  }
  throw new Error('Snapshot file must contain an array or a { markets: [] } object.');
}

export function describeSnapshotSource(snapshotPath) {
  if (!snapshotPath) {
    return 'using bundled sample markets';
  }
  return `loaded from ${snapshotPath}`;
}
