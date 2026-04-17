import test from 'node:test';
import assert from 'node:assert/strict';

import { rankOpportunities } from '../ranking.js';
import { applyLatencyAndStaleGuardrails } from '../guardrails.js';

const nowIso = new Date().toISOString();

const seeds = [
  { id: 'a', title: 'A', event: 'ea', price: 55, move: 10, volume: 1000, depth: 700, spread: 0.03, confidence: 'high', freshnessSeconds: 50, updatedAt: nowIso },
  { id: 'b', title: 'B', event: 'eb', price: 35, move: 14, volume: 300, depth: 140, spread: 0.08, confidence: 'medium', freshnessSeconds: 60, updatedAt: nowIso },
  { id: 'c', title: 'C', event: 'ec', price: 40, move: 5, volume: 600, depth: 420, spread: 0.04, confidence: 'low', freshnessSeconds: 1800, updatedAt: nowIso },
];

test('ranking emits score breakdown and penalizes low-tradeability', () => {
  const ranked = rankOpportunities(seeds);
  assert.equal(ranked.length, 3);
  assert.ok(ranked[0].scoreBreakdown);
  assert.ok(Object.hasOwn(ranked[0].scoreBreakdown, 'edge'));

  const b = ranked.find((x) => x.id === 'b');
  assert.equal(b.isTradeable, false);
  assert.ok(b.scoreBreakdown.tradeabilityPenalty > 0);
});

test('guardrails suppress stale and emit p50/p95', () => {
  const ranked = rankOpportunities(seeds);
  const report = applyLatencyAndStaleGuardrails(ranked, { freshnessThresholdSeconds: 900 });
  assert.equal(report.droppedSignals.length, 1);
  assert.equal(report.metrics.staleDropCount, 1);
  assert.ok(report.metrics.p50LatencyMs >= 0);
  assert.ok(report.metrics.p95LatencyMs >= report.metrics.p50LatencyMs);
});
