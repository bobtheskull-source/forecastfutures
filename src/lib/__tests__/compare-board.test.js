import test from 'node:test';
import assert from 'node:assert/strict';

import { renderApp } from '../render.js';

const guardrails = { metrics: { droppedCount: 0, p95LatencyMs: 20, p50LatencyMs: 10, executionQualityGate: {}, reasonCounts: {} } };

const markets = [
  {
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
  },
  {
    id: 'jobs',
    title: 'Jobs surprise next print',
    event: 'BLS jobs report',
    price: 38,
    edge: 0.05,
    rankScore: 76,
    confidence: 'medium',
    signalQualityGrade: 'B',
    move: 5,
    freshnessSeconds: 240,
    probabilityHistory: [0.18, 0.2, 0.23, 0.26],
    tradeUrl: 'https://kalshi.com/y',
    updatedAt: '2026-04-17T01:00:00.000Z',
    depth: 650,
    spread: 0.03,
    isTradeable: true,
  },
];

test('renderApp surfaces compare board controls and pin actions', () => {
  const html = renderApp({
    markets,
    outliers: markets,
    archive: [],
    rules: [],
    edgeCases: [],
    guardrails,
  });

  assert.match(html, /compareBoardPanel/);
  assert.match(html, /Scenario board/);
  assert.match(html, /data-action="compare-pin"/);
  assert.match(html, /data-action="compare-snapshot"/);
  assert.match(html, /data-action="compare-restore"/);
  assert.match(html, /data-action="compare-clear"/);
  assert.match(html, /data-action="compare-undo"/);
  assert.match(html, /data-action="compare-swap"/);
  assert.match(html, /data-action="compare-rename"/);
  assert.match(html, /data-action="compare-delete"/);
});
