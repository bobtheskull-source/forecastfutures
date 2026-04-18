import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCompareScenario,
  compareBoardLabel,
  loadCompareBoard,
  loadCompareSet,
  listCompareSetNames,
  saveCompareBoard,
  saveCompareSet,
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
  saveCompareSet(storage, 'Evening', ['m3']);
  assert.deepEqual(listCompareSetNames(storage), ['Evening', 'Morning']);
  assert.deepEqual(loadCompareSet(storage, 'Morning').ids, ['m1', 'm2']);
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
