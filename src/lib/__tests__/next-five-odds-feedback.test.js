import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCalibrationFeedback, adjustOpportunityScores } from '../odds-feedback.js';
import { renderApp } from '../render.js';

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
    tradeUrl: 'https://kalshi.com/x',
    updatedAt: '2026-04-17T00:00:00.000Z',
    isTradeable: true,
  },
  {
    id: 'fed',
    title: 'Fed cuts at next meeting',
    event: 'FOMC decision',
    price: 18,
    edge: -0.06,
    rankScore: 72,
    confidence: 'medium',
    signalQualityGrade: 'B',
    move: -6,
    freshnessSeconds: 180,
    tradeUrl: 'https://kalshi.com/y',
    updatedAt: '2026-04-17T00:00:00.000Z',
    isTradeable: true,
  },
];

const archive = [
  { market: 'CPI surprise next print', event: 'BLS CPI release', direction: 'up', score: 92, correct: true, outcome: { label: 'Resolved up', direction: 'up' } },
  { market: 'CPI surprise next print', event: 'BLS CPI release', direction: 'up', score: 86, correct: true, outcome: { label: 'Resolved up', direction: 'up' } },
  { market: 'Fed cuts at next meeting', event: 'FOMC decision', direction: 'down', score: 83, correct: false, outcome: { label: 'Missed', direction: 'up' } },
];

test('buildCalibrationFeedback summarizes historical accuracy by confidence bucket', () => {
  const feedback = buildCalibrationFeedback(archive);

  assert.equal(feedback.total, 3);
  assert.equal(feedback.wins, 2);
  assert.equal(feedback.misses, 1);
  assert.match(feedback.summaryText, /Historical outcomes: 2 wins, 1 miss/);
  assert.match(feedback.summaryText, /high-confidence/);
  assert.match(feedback.summaryText, /Feedback:/);
});

test('adjustOpportunityScores nudges event-specific opportunity scores deterministically', () => {
  const adjusted = adjustOpportunityScores(markets, archive);

  const cpi = adjusted.find((item) => item.id === 'cpi');
  const fed = adjusted.find((item) => item.id === 'fed');

  assert.ok(cpi.adjustedRankScore > cpi.baseRankScore);
  assert.ok(fed.adjustedRankScore < fed.baseRankScore);
  assert.match(cpi.calibrationNote, /resolved correctly for this event/);
  assert.match(fed.calibrationTrend, /needs review|mixed/);
});

test('renderApp surfaces calibration feedback and adaptive opportunity scores in the command center', () => {
  const html = renderApp({
    markets,
    outliers: markets,
    archive,
    review: { forecasts: [] },
    rules: [],
    edgeCases: [],
    guardrails: { metrics: { p95LatencyMs: 20, p50LatencyMs: 10, executionQualityGate: {}, reasonCounts: {} } },
  });

  assert.match(html, /Opportunity score/);
  assert.match(html, /Calibration/);
  assert.match(html, /More list controls/);
  assert.match(html, /Open alert controls/);
  assert.match(html, /Open top signal/);
  assert.match(html, /Pre-trade check/);
  assert.match(html, /Copy trade link/);
  assert.match(html, /Historical outcomes:/);
  assert.match(html, /calibration/);
});
