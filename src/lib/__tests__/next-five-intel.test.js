import test from 'node:test';
import assert from 'node:assert/strict';

import { executionQualityScore } from '../execution-quality.js';
import { attentionVsAlpha } from '../attention.js';
import { buildMorningBrief } from '../digest.js';
import { buildCalibrationReport } from '../calibration-report.js';

test('execution quality score and slippage are returned', () => {
  const q = executionQualityScore({ spread: 0.03, depth: 600, volume: 900, freshnessSeconds: 120 });
  assert.ok(q.score > 0);
  assert.ok(q.expectedSlippageBps >= 0);
  assert.equal(Array.isArray(q.guidance), true);
});

test('attention vs alpha labels warn when clicks rise but edge is weak', () => {
  const x = attentionVsAlpha({ edge: 0.02, risingScore: 2.2 });
  assert.equal(x.label, 'Attention > Alpha');
});

test('morning brief returns top 3 ranked opportunities', () => {
  const brief = buildMorningBrief([
    { id: 'a', title: 'A', rankScore: 80, edge: 0.1, confidence: 'high', signalQualityGrade: 'A' },
    { id: 'b', title: 'B', rankScore: 70, edge: 0.05, confidence: 'medium', signalQualityGrade: 'B' },
    { id: 'c', title: 'C', rankScore: 60, edge: 0.03, confidence: 'low', signalQualityGrade: 'C' },
    { id: 'd', title: 'D', rankScore: 50, edge: 0.01, confidence: 'low', signalQualityGrade: 'D' },
  ]);
  assert.equal(brief.length, 3);
  assert.equal(brief[0].id, 'a');
});

test('calibration report computes wins, misses, and win rate', () => {
  const report = buildCalibrationReport([{ correct: true }, { correct: false }, { correct: true }]);
  assert.equal(report.total, 3);
  assert.equal(report.wins, 2);
  assert.equal(report.misses, 1);
  assert.equal(report.winRate, Number((2/3).toFixed(4)));
});
