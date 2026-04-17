import test from 'node:test';
import assert from 'node:assert/strict';

import { pickPaywallVariant, summarizeFunnel } from '../analytics.js';
import { opportunitiesToCsv } from '../exporter.js';
import { isWatchlisted, loadWatchlist, toggleWatchlist } from '../watchlist.js';

test('watchlist toggle persists IDs', () => {
  const storage = {
    map: new Map(),
    getItem(k) { return this.map.get(k) || null; },
    setItem(k, v) { this.map.set(k, v); },
  };

  assert.equal(loadWatchlist(storage).length, 0);
  toggleWatchlist('mkt-1', storage);
  assert.equal(isWatchlisted('mkt-1', storage), true);
  toggleWatchlist('mkt-1', storage);
  assert.equal(isWatchlisted('mkt-1', storage), false);
});

test('funnel analytics computes ctr and conversion', () => {
  const funnel = summarizeFunnel([
    { type: 'listImpressions' },
    { type: 'listImpressions' },
    { type: 'pretradeOpens' },
    { type: 'tradeClicks' },
    { type: 'paywallViews' },
    { type: 'trialsStarted' },
  ]);

  assert.equal(funnel.listImpressions, 2);
  assert.equal(funnel.tradeClicks, 1);
  assert.equal(funnel.ctr, 0.5);
  assert.equal(funnel.paywallConversion, 1);
});

test('paywall variant is stable for same visitor', () => {
  const a = pickPaywallVariant('visitor-123');
  const b = pickPaywallVariant('visitor-123');
  assert.equal(a, b);
  assert.ok(['A', 'B'].includes(a));
});

test('CSV exporter emits explainability columns', () => {
  const csv = opportunitiesToCsv([
    {
      id: 'x',
      title: 'Market X',
      event: 'Event X',
      rankScore: 75.1,
      edge: 0.12,
      isTradeable: true,
      tradeUrl: 'https://kalshi.com/x',
      scoreBreakdown: { move: 8, volumeAnomaly: 6, modelEdge: 21, liquidity: 12, recency: 8 },
    },
  ]);

  assert.ok(csv.includes('volumeAnomaly'));
  assert.ok(csv.includes('https://kalshi.com/x'));
  assert.ok(csv.includes('Market X'));
});
