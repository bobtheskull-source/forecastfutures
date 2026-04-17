import test from 'node:test';
import assert from 'node:assert/strict';

import { renderApp } from '../render.js';

const guardrails = { metrics: { droppedCount: 0, p95LatencyMs: 20, p50LatencyMs: 10, executionQualityGate: {}, reasonCounts: {} } };

const infra = {
  ready: false,
  missing: ['KALSHI_API_KEY', 'private key file'],
  deploymentNotes: [
    'Keep Kalshi auth on the server side only.',
    'Expose read-only market data to the mobile client.',
  ],
};

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

test('renderApp surfaces backend readiness and Pages guidance', () => {
  const html = renderApp({
    markets: [signal],
    outliers: [signal],
    archive: [],
    rules: [],
    edgeCases: [],
    guardrails,
    infra,
  });

  assert.match(html, /Backend readiness/);
  assert.match(html, /needs secrets/);
  assert.match(html, /KALSHI_API_KEY/);
  assert.match(html, /API host vs GitHub Pages/);
  assert.match(html, /read-only GitHub Pages UI/);
  assert.match(html, /Refresh snapshot/);
});

test('renderApp keeps safe-area spacing and sticky controls outside content flow', () => {
  const html = renderApp({
    markets: [signal],
    outliers: [signal],
    archive: [],
    rules: [],
    edgeCases: [],
    guardrails,
    infra,
  });

  assert.match(html, /env\(safe-area-inset-bottom\)/);
  assert.match(html, /sticky-trade\{position:fixed[^}]*bottom:calc\(92px \+ env\(safe-area-inset-bottom\)\)/s);
  assert.match(html, /@media \(max-width:760px\).*padding-bottom:calc\(206px \+ env\(safe-area-inset-bottom\)\)/s);
});
