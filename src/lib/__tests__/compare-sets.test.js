import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCompareScenario,
  compareBoardLabel,
  deleteCompareSet,
  loadCompareBoard,
  loadCompareSet,
  listCompareSetNames,
  listCompareSnapshotSummaries,
  renameCompareSet,
  saveCompareBoard,
  saveCompareSet,
  saveCompareSnapshot,
  toggleCompareBoardId,
} from '../compare-sets.js';

function makeStorage() {
  const store = new Map();
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
  };
}

test('compare board state keeps selected market first and removes duplicates', () => {
  const ids = toggleCompareBoardId(['m2', 'm3'], 'm2', 'm1');
  assert.deepEqual(ids, ['m1', 'm3']);
});

test('compare board storage round-trips through local storage', () => {
  const storage = makeStorage();
  saveCompareBoard(storage, ['m2', 'm1']);
  assert.deepEqual(loadCompareBoard(storage), ['m2', 'm1']);
});

test('saved compare sets round-trip and list in sorted order', () => {
  const storage = makeStorage();
  saveCompareSet(storage, 'Morning', ['m1', 'm2']);
  saveCompareSnapshot(storage, 'Snapshot', { ids: ['m3', 'm4'], note: 'Watch the spread' });
  renameCompareSet(storage, 'Morning', 'Sunrise');
  const summaries = listCompareSnapshotSummaries(storage);
  assert.equal(summaries.some((entry) => entry.name === 'Snapshot' && entry.note === 'Watch the spread'), true);
  assert.deepEqual(loadCompareSet(storage, 'Snapshot').ids, ['m3', 'm4']);
  assert.deepEqual(loadCompareSet(storage, 'Snapshot').note, 'Watch the spread');
  assert.equal(deleteCompareSet(storage, 'Snapshot'), true);
  assert.deepEqual(listCompareSetNames(storage), ['Sunrise']);
});

test('compare scenario builds side-by-side markets with a readable label', () => {
  const items = buildCompareScenario([
    { id: 'm1', title: 'One' },
    { id: 'm2', title: 'Two' },
    { id: 'm3', title: 'Three' },
  ], 'm2', ['m3', 'm1']);
  assert.equal(items[0].id, 'm2');
  assert.equal(items[1].id, 'm3');
  assert.equal(compareBoardLabel(items), '3 markets');
});
