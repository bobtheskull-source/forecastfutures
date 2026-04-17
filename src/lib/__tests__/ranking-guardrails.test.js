import test from 'node:test';
import assert from 'node:assert/strict';

import { rankOpportunities } from '../ranking.js';
import { applyLatencyAndStaleGuardrails, executionQualityReport } from '../guardrails.js';

const nowIso = new Date().toISOString();

const seeds = [
  { id: 'a', title: 'A', event: 'ea', price: 55, move: 10, volume: 1000, depth: 700, spread: 0.03, confidence: 'high', freshnessSeconds: 50, updatedAt: nowIso },
  { id: 'b', title: 'B', event: 'eb', price: 35, move: 14, volume: 120, depth: 140, spread: 0.08, confidence: 'medium', freshnessSeconds: 60, updatedAt: nowIso },
  { id: 'c', title: 'C', event: 'ec', price: 40, move: 5, volume: 600, depth: 420, spread: 0.04, confidence: 'low', freshnessSeconds: 1800, updatedAt: nowIso },
];

test('ranking emits explainability components including volume anomaly', () => {
  const ranked = rankOpportunities(seeds);
  assert.equal(ranked.length, 3);
  assert.ok(ranked[0].scoreBreakdown);

  const a = ranked.find((x) => x.id === 'a');
  assert.ok(Object.hasOwn(a.scoreBreakdown, 'move'));
  assert.ok(Object.hasOwn(a.scoreBreakdown, 'volumeAnomaly'));
  assert.ok(Object.hasOwn(a.scoreBreakdown, 'modelEdge'));
  assert.ok(Object.hasOwn(a.scoreBreakdown, 'liquidity'));
  assert.ok(Object.hasOwn(a.scoreBreakdown, 'recency'));
  assert.ok(['A', 'B', 'C', 'D'].includes(a.signalQualityGrade));
  assert.equal(Array.isArray(a.confidenceInterval), true);
  assert.equal(a.confidenceInterval.length, 2);
  assert.ok(a.confidenceInterval[0] <= a.confidenceInterval[1]);
});

test('execution quality report flags low-liquidity/wide-spread/stale', () => {
  const report = executionQualityReport(seeds[1], { freshnessThresholdSeconds: 30 });
  assert.equal(report.pass, false);
  assert.ok(report.reasons.includes('low_liquidity_depth'));
  assert.ok(report.reasons.includes('low_liquidity_volume'));
  assert.ok(report.reasons.includes('wide_spread'));
  assert.ok(report.reasons.includes('stale_quote'));
});

test('guardrails suppress non-tradeable opportunities and emit reason counts', () => {
  const ranked = rankOpportunities(seeds);
  const report = applyLatencyAndStaleGuardrails(ranked, { freshnessThresholdSeconds: 900 });
  assert.equal(report.acceptedSignals.length, 1);
  assert.equal(report.droppedSignals.length, 2);
  assert.ok(report.metrics.reasonCounts.low_liquidity_depth >= 1);
  assert.ok(report.metrics.reasonCounts.wide_spread >= 1);
  assert.ok(report.metrics.reasonCounts.stale_quote >= 1);
  assert.ok(report.metrics.p95LatencyMs >= report.metrics.p50LatencyMs);
});
