import test from 'node:test';
import assert from 'node:assert/strict';

import { renderApp } from '../render.js';

test('renderApp surfaces watchlist controls, freshness badges, and URL-state-ready list UI', () => {
  const html = renderApp({
    markets: [
      { id: 'a', title: 'A', event: 'BLS CPI release', price: 40 },
      { id: 'b', title: 'B', event: 'BLS CPI release', price: 42 },
    ],
    outliers: [
      {
        id: 'a',
        title: 'A',
        event: 'BLS CPI release',
        price: 40,
        edge: 0.08,
        rankScore: 88,
        confidence: 'high',
        signalQualityGrade: 'A',
        move: 8,
        freshnessSeconds: 100,
        probabilityHistory: [0.2, 0.25, 0.3, 0.32],
        tradeUrl: 'https://kalshi.com/x',
        updatedAt: '2026-04-17T00:00:00.000Z',
        scoreBreakdown: { move: 7.5, volumeAnomaly: 8.1, modelEdge: 22.5, liquidity: 14.1, recency: 8.8, confidence: 13.5, spreadQuality: 5.5, tradeabilityPenalty: 0 },
      },
    ],
    archive: [
      {
        market: 'A',
        direction: 'up',
        score: 78,
        outcome: { label: 'Confirmed', direction: 'up' },
        correct: true,
        accuracyLabel: 'correct',
        freshnessSeconds: 240,
      },
    ],
    rules: [],
    edgeCases: [],
    guardrails: { metrics: { droppedCount: 0, p95LatencyMs: 20, p50LatencyMs: 10, executionQualityGate: {}, reasonCounts: {} } },
  });

  assert.match(html, /saveWatchlistBtn/);
  assert.match(html, /restoreWatchlistBtn/);
  assert.match(html, /fresh-badge/);
  assert.match(html, /Compare vs event median/);
  assert.match(html, /ff_saved_watchlists_v1/);
});
