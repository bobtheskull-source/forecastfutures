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

test('renderApp surfaces onboarding and accessible modal scaffolding', () => {
  const html = renderApp({
    markets: [baseSignal],
    outliers: [baseSignal],
    archive: [],
    rules: [],
    edgeCases: [],
    guardrails,
  });

  assert.match(html, /skip-link/);
  assert.match(html, /mainContent/);
  assert.match(html, /onboardingBanner/);
  assert.match(html, /Quick start/);
  assert.match(html, /role="dialog" aria-modal="true"/);
  assert.match(html, /button:focus-visible/);
});

test('renderApp surfaces loading, empty, and error states across list detail and archive', () => {
  const loadingHtml = renderApp({
    guardrails,
    rules: [],
    edgeCases: [],
  });

  assert.match(loadingHtml, /Loading opportunities\.\.\./);
  assert.match(loadingHtml, /Loading market detail\.\.\./);
  assert.match(loadingHtml, /Loading archive results\.\.\./);

  const emptyHtml = renderApp({
    markets: [],
    outliers: [],
    archive: [],
    rules: [],
    edgeCases: [],
    guardrails,
  });

  assert.match(emptyHtml, /No opportunities yet\. Add market data or relax filters/);
  assert.match(emptyHtml, /No market selected yet\./);
  assert.match(emptyHtml, /No archived forecasts yet\. Completed reviews will appear here once outcomes are recorded\./);
  assert.match(emptyHtml, /No resolved archive items yet\./);

  const errorHtml = renderApp({
    markets: [baseSignal],
    outliers: [baseSignal],
    archive: 'broken',
    rules: [],
    edgeCases: [],
    guardrails,
  });

  assert.match(errorHtml, /Error: archive data could not be rendered\./);
});

test('renderApp keeps alert history visible and renders large feeds without breaking', () => {
  const markets = Array.from({ length: 250 }, (_, index) => ({
    ...baseSignal,
    id: `m-${index}`,
    title: `Market ${index}`,
    event: index % 2 === 0 ? 'BLS CPI release' : 'FOMC decision',
    rankScore: 90 - (index % 5),
    edge: 0.05 + ((index % 7) * 0.01),
    freshnessSeconds: 100 + index,
  }));

  const html = renderApp({
    markets,
    outliers: markets.slice(0, 20),
    archive: [],
    rules: [],
    edgeCases: [],
    guardrails,
  });

  assert.match(html, /alertHistoryPanel/);
  assert.match(html, /Recently surfaced alerts/);
  assert.match(html, /Most clicked \(time-decay\)/);
  assert.match(html, /Market 0/);
});
