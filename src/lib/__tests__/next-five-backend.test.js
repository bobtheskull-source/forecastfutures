import test from 'node:test';
import assert from 'node:assert/strict';

import { renderApp } from '../render.js';

const guardrails = { metrics: { droppedCount: 1, p95LatencyMs: 24, p50LatencyMs: 12, executionQualityGate: {}, reasonCounts: {} } };

const signal = {
  id: 'cpi',
  title: 'CPI surprise next print',
  event: 'BLS CPI release',
  price: 42,
  edge: 0.08,
  rankScore: 88,
  confidence: 'high',
  signalQualityGrade: 'A',
  move: 8,
  freshnessSeconds: 120,
  probabilityHistory: [0.2, 0.24, 0.28, 0.31],
  tradeUrl: 'https://kalshi.com/x',
  updatedAt: '2026-04-17T00:00:00.000Z',
  depth: 820,
  spread: 0.028,
  isTradeable: true,
};

test('renderApp wires backend action rails and retry states through list detail and archive surfaces', () => {
  const html = renderApp({
    markets: [signal],
    outliers: [signal],
    archive: [],
    rules: [],
    edgeCases: [],
    guardrails,
    snapshotSource: 'loaded from ./fixtures/latest-markets.json',
    infra: {
      ready: false,
      missing: ['KALSHI_API_KEY', 'private key file'],
      deploymentNotes: ['Keep Kalshi auth on the server side only.'],
      readError: 'market read failed',
    },
  });

  assert.match(html, /Settings guide/);
  assert.match(html, /Backend action rail/);
  assert.match(html, /Retry read/);
  assert.match(html, /Backend read error/);
  assert.match(html, /market read failed/);
  assert.match(html, /Source: loaded from \.\/fixtures\/latest-markets\.json/);
  assert.match(html, /Keep Kalshi auth on the server side only\./);
  assert.match(html, /Open detail/);
  assert.match(html, /Open archive/);
});

test('renderApp surfaces big mover odds calibration and unique refresh controls', () => {
  const html = renderApp({
    markets: [signal],
    outliers: [signal],
    archive: [
      {
        id: 'resolved-1',
        market: 'CPI surprise next print',
        event: 'BLS CPI release',
        direction: 'up',
        score: 81.22,
        thesis: 'Estimated odds aligned with the realized move.',
        postMortem: 'Outcome confirmed the model signal.',
        outcome: { direction: 'up', label: 'Resolved up' },
        correct: true,
        accuracyLabel: 'correct',
        freshnessSeconds: 240,
      },
    ],
    rules: [],
    edgeCases: [],
    guardrails,
    snapshotSource: 'loaded from ./fixtures/latest-markets.json',
    infra: {
      ready: true,
      missing: [],
      deploymentNotes: ['Keep Kalshi auth on the server side only.'],
    },
  });

  assert.match(html, /Big mover/);
  assert.match(html, /Outcome odds/);
  assert.match(html, /Opportunity score/);
  assert.match(html, /Calibration/);
  assert.match(html, /Big movers/);
  assert.match(html, /Broad scan/);
  assert.match(html, /Open alert controls/);
  assert.match(html, /Reload snapshot/);
  assert.match(html, /id="backendRefreshSnapshotBtn"/);
  assert.equal((html.match(/id="refreshSnapshotBtn"/g) || []).length, 1);
});
