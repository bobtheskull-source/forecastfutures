import test from 'node:test';
import assert from 'node:assert/strict';

import { applyScanPreset, compareMarketToMedian, loadScanPreset, saveScanPreset } from '../scan-presets.js';

function makeStorage() {
  const store = new Map();
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
  };
}

test('applyScanPreset toggles breakout scan controls', () => {
  const state = applyScanPreset({}, 'breakout');
  assert.equal(state.breakoutOnly, true);
  assert.equal(state.executionReadyOnly, true);
  assert.equal(state.minEdgePreset, 5);
});

test('saved scan preset round-trips through storage', () => {
  const storage = makeStorage();
  saveScanPreset(storage, 'mobile', { watchlistOnly: true, maxResolveHours: 72 });
  const preset = loadScanPreset(storage, 'mobile');
  assert.equal(preset.watchlistOnly, true);
  assert.equal(preset.maxResolveHours, 72);
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
