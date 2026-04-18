import test from 'node:test';
import assert from 'node:assert/strict';

import { renderApp } from '../render.js';
import { buildActiveOpportunityShareText } from '../share.js';

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
  marketProb: 0.42,
  modelProb: 0.56,
  updatedAt: '2026-04-17T00:00:00.000Z',
  depth: 820,
  spread: 0.028,
  isTradeable: true,
};

test('renderApp surfaces journal, pinned favorites, and help surfaces', () => {
  const html = renderApp({
    markets: [market],
    outliers: [market],
    archive: [],
    rules: [],
    edgeCases: [],
    guardrails,
  });

  assert.match(html, /Trade journal/);
  assert.match(html, /Pin favorite/);
  assert.match(html, /Help and action legend/);
  assert.match(html, /data-action="save-journal"/);
  assert.match(html, /data-action="open-help-drawer"/);
});

test('buildActiveOpportunityShareText includes odds, calibration, and journal notes', () => {
  const share = buildActiveOpportunityShareText({
    selectedItem: market,
    compare: { selected: market, median: { edge: 0.05, depth: 500, freshnessSeconds: 150 } },
    calibrationFeedback: { summaryText: '3 wins / 1 miss' },
    journalEntry: { note: 'Watch rates drift', tags: ['rates', 'inflation'] },
  });

  assert.match(share, /Odds:/);
  assert.match(share, /Calibration: 3 wins \/ 1 miss/);
  assert.match(share, /Journal note: Watch rates drift/);
  assert.match(share, /Compare vs event median/);
});
