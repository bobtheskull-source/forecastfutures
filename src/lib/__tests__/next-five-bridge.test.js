import test from 'node:test';
import assert from 'node:assert/strict';

import { renderApp } from '../render.js';

const markets = [
  { id: 'cpi', title: 'CPI surprise next print', event: 'BLS CPI release', price: 40, edge: 0.08, depth: 800, freshnessSeconds: 120, isTradeable: true },
  { id: 'fed', title: 'Fed cuts at next meeting', event: 'FOMC decision', price: 18, edge: 0.06, depth: 500, freshnessSeconds: 180, isTradeable: true },
];

const outliers = [
  { id: 'cpi', title: 'CPI surprise next print', event: 'BLS CPI release', price: 40, edge: 0.08, rankScore: 88, confidence: 'high', signalQualityGrade: 'A', move: 8, freshnessSeconds: 120, probabilityHistory: [0.2, 0.25, 0.3, 0.32], tradeUrl: 'https://kalshi.com/x', updatedAt: '2026-04-17T00:00:00.000Z', isTradeable: true },
];

const review = {
  generatedAt: '2026-04-17T03:00:00.000Z',
  forecasts: [
    { id: 'cpi', market: 'CPI surprise next print', event: 'BLS CPI release', direction: 'up', score: 91.25, thesis: 'Large upside move with improving momentum.', postMortem: 'Compare the thesis against the release and post-event drift.' },
  ],
};

const archive = [
  { id: 'cpi', market: 'CPI surprise next print', event: 'BLS CPI release', direction: 'up', score: 91.25, thesis: 'Large upside move with improving momentum.', postMortem: 'Compare the thesis against the release and post-event drift.', outcome: { label: 'Real world confirmed the move', direction: 'up' }, correct: true, accuracyLabel: 'correct' },
];

const guardrails = { metrics: { droppedCount: 0, p95LatencyMs: 20, p50LatencyMs: 10, executionQualityGate: {}, reasonCounts: {} } };

const infra = { ready: false, missing: ['KALSHI_API_KEY', 'private key file'], deploymentNotes: ['Deploy API separately from Pages client.'] };

test('renderApp bridges backend provenance and sticky layout guidance', () => {
  const html = renderApp({
    markets,
    outliers,
    review,
    archive,
    rules: [],
    edgeCases: [],
    guardrails,
    infra,
    snapshotSource: 'loaded from ./fixtures/latest-markets.json',
  });

  assert.match(html, /Snapshot provenance/);
  assert.match(html, /loaded from \.\/fixtures\/latest-markets\.json/);
  assert.match(html, /Review export and share/);
  assert.match(html, /Funnel analytics/);
  assert.match(html, /CTR/);
  assert.match(html, /sticky-trade/);
  assert.match(html, /safe-area-inset-bottom/);
});