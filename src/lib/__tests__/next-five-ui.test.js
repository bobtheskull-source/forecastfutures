import test from 'node:test';
import assert from 'node:assert/strict';

import { applyScanPreset, compareMarketToMedian, compareMarketToEventMedian, loadScanPreset, saveScanPreset } from '../scan-presets.js';
import { buildActiveFilterSummary } from '../filters.js';

function makeStorage() {
  const store = new Map();
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
  };
}

test('applyScanPreset toggles breakout scan controls', () => {
  const state = applyScanPreset({ rankFilter: 'A', directionFilter: 'down', journalQuery: 'rates', journalTag: 'inflation' }, 'breakout');
  assert.equal(state.breakoutOnly, true);
  assert.equal(state.executionReadyOnly, true);
  assert.equal(state.minEdgePreset, 5);
  assert.equal(state.rankFilter, null);
  assert.equal(state.directionFilter, null);
  assert.equal(state.journalQuery, '');
  assert.equal(state.journalTag, '');
});

test('saved scan preset round-trips through storage', () => {
  const storage = makeStorage();
  saveScanPreset(storage, 'mobile', {
    watchlistOnly: true,
    maxResolveHours: 72,
    rankFilter: 'B',
    directionFilter: 'up',
    journalQuery: 'inflation',
  });
  const preset = loadScanPreset(storage, 'mobile');
  assert.equal(preset.watchlistOnly, true);
  assert.equal(preset.maxResolveHours, 72);
  assert.equal(preset.rankFilter, 'B');
  assert.equal(preset.directionFilter, 'up');
  assert.equal(preset.journalQuery, 'inflation');
});

test('active filter summary includes rank, direction, and scan context', () => {
  assert.equal(buildActiveFilterSummary({ query: 'cpi', rank: 'A', direction: 'down', watchlistOnly: true, feedMode: 'discover', minEdgePreset: 5, maxResolveHours: 72, breakoutOnly: true, executionReadyOnly: true }), 'Search: cpi · Rank: A · Direction: down · Watchlist only · Feed: discover · Edge ≥ 5% · Resolve ≤ 72h · Breakouts · Tradeable only');
});

test('compareMarketToMedian returns selected item and median metrics', () => {
  const result = compareMarketToMedian([
    { id: 'a', edge: 0.08, depth: 800, freshnessSeconds: 100 },
    { id: 'b', edge: 0.02, depth: 200, freshnessSeconds: 400 },
    { id: 'c', edge: 0.11, depth: 600, freshnessSeconds: 200 },
  ], 'b');
  assert.equal(result.selected.id, 'b');
  assert.equal(result.median.depth, 700);
  assert.equal(result.median.edge, 9.5);
});

test('compareMarketToEventMedian returns event-specific deltas', () => {
  const result = compareMarketToEventMedian([
    { id: 'a', event: 'E1', edge: 0.08, depth: 800, freshnessSeconds: 100 },
    { id: 'b', event: 'E1', edge: 0.02, depth: 200, freshnessSeconds: 400 },
    { id: 'c', event: 'E2', edge: 0.11, depth: 600, freshnessSeconds: 200 },
  ], 'a');
  assert.equal(result.selected.id, 'a');
  assert.equal(result.event, 'E1');
  assert.equal(result.median.edge, 5);
  assert.equal(result.deltas.edge, 3);
  assert.equal(result.deltas.depth, 300);
});
