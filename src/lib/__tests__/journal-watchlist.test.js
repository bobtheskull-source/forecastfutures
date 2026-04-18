import test from 'node:test';
import assert from 'node:assert/strict';

import { buildJournalPrompt, findTradeJournalEntry, journalSummary, loadTradeJournal, saveTradeJournal, upsertTradeJournalEntry } from '../journal.js';
import { groupMarketsByPin, isPinnedWatchlist, loadPinnedWatchlist, savePinnedWatchlist, togglePinnedWatchlist } from '../watchlist-pins.js';

function makeStorage() {
  const store = new Map();
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
  };
}

test('journal entries round-trip and summarize tags', () => {
  const storage = makeStorage();
  saveTradeJournal([{ marketId: 'cpi', note: 'Watch inflation drift', tags: ['inflation', 'rates'] }], storage);
  upsertTradeJournalEntry({ marketId: 'cpi', title: 'CPI surprise next print', event: 'BLS CPI release', note: 'Check energy inputs', tags: ['inflation', 'macro'] }, storage);
  const entry = findTradeJournalEntry('cpi', storage);
  assert.equal(entry.title, 'CPI surprise next print');
  assert.match(entry.note, /energy/);
  assert.deepEqual(loadTradeJournal(storage).map((item) => item.marketId), ['cpi']);
  const summary = journalSummary(loadTradeJournal(storage));
  assert.equal(summary.total, 1);
  assert.deepEqual(summary.topTags[0][0], 'inflation');
  assert.deepEqual(buildJournalPrompt(entry).tags.includes('inflation'), true);
});

test('watchlist pinning groups pinned markets first and persists state', () => {
  const storage = makeStorage();
  savePinnedWatchlist(['m2'], storage);
  togglePinnedWatchlist('m1', storage);
  assert.equal(isPinnedWatchlist('m1', storage), true);
  assert.deepEqual(loadPinnedWatchlist(storage), ['m1', 'm2']);
  const groups = groupMarketsByPin([
    { id: 'm1' },
    { id: 'm2' },
    { id: 'm3' },
  ], loadPinnedWatchlist(storage));
  assert.deepEqual(groups.pinned.map((item) => item.id), ['m1', 'm2']);
  assert.deepEqual(groups.unpinned.map((item) => item.id), ['m3']);
});
