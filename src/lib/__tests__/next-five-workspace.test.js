import test from 'node:test';
import assert from 'node:assert/strict';

import { renderApp } from '../render.js';

const guardrails = { metrics: { droppedCount: 0, p95LatencyMs: 20, p50LatencyMs: 10, executionQualityGate: {}, reasonCounts: {} } };
const market = {
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

test('renderApp surfaces chart-range controls and section jump anchors', () => {
  const html = renderApp({
    markets: [market],
    outliers: [market],
    archive: [],
    rules: [],
    edgeCases: [],
    guardrails,
  });

  assert.match(html, /data-action="chart-range"/);
  assert.match(html, /Chart range/);
  assert.match(html, /Go to list/);
  assert.match(html, /Go to archive/);
});
