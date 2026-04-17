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

test('renderApp persists the last selected market and view in local storage', () => {
  const html = renderApp({
    markets: [market],
    outliers: [market],
    archive: [],
    rules: [],
    edgeCases: [],
    guardrails,
  });

  assert.match(html, /ff_ui_state_v1/);
  assert.match(html, /selectedProvided/);
  assert.match(html, /saveUiState\(\{ selectedId: state\.selectedId, view: 'detail' \}\)/);
  assert.match(html, /savedUiState\.view \|\| 'list'/);
});
