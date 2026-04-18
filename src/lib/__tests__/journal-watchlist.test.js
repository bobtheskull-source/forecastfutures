import test from 'node:test';
import assert from 'node:assert/strict';

import { buildJournalPrompt, deleteTradeJournalEntry, findTradeJournalEntry, journalSummary, loadTradeJournal, saveTradeJournal, upsertTradeJournalEntry } from '../journal.js';
import { groupMarketsByPin, isPinnedWatchlist, loadPinnedWatchlist, movePinnedWatchlist, savePinnedWatchlist, togglePinnedWatchlist } from '../watchlist-pins.js';

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

test('journal entries can be deleted without disturbing the rest of the journal', () => {
  const storage = makeStorage();
  saveTradeJournal([
    { marketId: 'cpi', note: 'Watch inflation drift', tags: ['inflation'] },
    { marketId: 'jobs', note: 'Check payrolls', tags: ['labor'] },
  ], storage);
  deleteTradeJournalEntry('cpi', storage);
  assert.deepEqual(loadTradeJournal(storage).map((item) => item.marketId), ['jobs']);
});

test('pinned watchlist order can be moved up and down', () => {
  const storage = makeStorage();
  savePinnedWatchlist(['m1', 'm2', 'm3'], storage);
  movePinnedWatchlist('m3', -1, storage);
  assert.deepEqual(loadPinnedWatchlist(storage), ['m1', 'm3', 'm2']);
  movePinnedWatchlist('m3', -1, storage);
  assert.deepEqual(loadPinnedWatchlist(storage), ['m3', 'm1', 'm2']);
  const groups = groupMarketsByPin([
    { id: 'm3' },
    { id: 'm1' },
    { id: 'm2' },
    { id: 'm4' },
  ], loadPinnedWatchlist(storage));
  assert.deepEqual(groups.pinned.map((item) => item.id), ['m3', 'm1', 'm2']);
  assert.deepEqual(groups.unpinned.map((item) => item.id), ['m4']);
});
