import test from 'node:test';
import assert from 'node:assert/strict';

import { renderApp } from '../render.js';

const guardrails = { metrics: { droppedCount: 0, p95LatencyMs: 20, p50LatencyMs: 10, executionQualityGate: {}, reasonCounts: {} } };

const baseSignal = {
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

test('renderApp surfaces a market command center and compact row workspace', () => {
  const html = renderApp({
    markets: [baseSignal],
    outliers: [baseSignal],
    archive: [],
    rules: [],
    edgeCases: [],
    guardrails,
  });

  assert.match(html, /command-center/);
  assert.match(html, /primary-signal/);
  assert.match(html, /status-chip/);
  assert.match(html, /market-row/);
  assert.match(html, /chart-workspace/);
  assert.match(html, /drawer-surface/);
});
