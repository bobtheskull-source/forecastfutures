import test from 'node:test';
import assert from 'node:assert/strict';

import { renderApp } from '../render.js';
import { summarizeProbabilityTrend } from '../trend.js';
import { computeRiskSizingGuidance } from '../risk-sizing.js';
import { morningBriefToCsv } from '../brief-export.js';
import { buildSummaryShareText } from '../share.js';

test('summarizeProbabilityTrend returns 24h delta and acceleration', () => {
  const summary = summarizeProbabilityTrend({ probabilityHistory: [0.2, 0.25, 0.31, 0.34] });
  assert.equal(summary.direction, 'up');
  assert.match(summary.summary, /24h/);
  assert.match(summary.badge, /^\+/);
});

test('computeRiskSizingGuidance escalates strong breakout opportunities', () => {
  const sizing = computeRiskSizingGuidance({
    edge: 0.12,
    signalQualityGrade: 'A',
    isTradeable: true,
    movementFlag: { label: 'Breakout' },
  }, { score: 84, expectedSlippageBps: 12 });
  assert.equal(sizing.tier, 'full');
  assert.equal(sizing.multiplier, 1);
  assert.match(sizing.summary, /Full size/);
});

test('morningBriefToCsv exports trend columns', () => {
  const csv = morningBriefToCsv([
    {
      id: 'm1',
      title: 'CPI surprise next print',
      event: 'BLS CPI release',
      edgePct: 8.25,
      confidence: 'high',
      quality: 'A',
      tradeUrl: 'https://kalshi.com/x',
      trendSummary: { delta24hPp: 6.4, accelerationPp: 1.2 },
    },
  ]);
  assert.match(csv, /rank,id,title,event,edgePercent,confidence,quality,24hDeltaPp,accelerationPp,tradeUrl/);
  assert.match(csv, /6\.40/);
});

test('buildSummaryShareText combines brief, compare, and selected market context', () => {
  const text = buildSummaryShareText({
    briefItems: [{ title: 'CPI surprise next print', quality: 'A', confidence: 'high', trendSummary: { badge: '+6.40pp' } }],
    selectedItem: {
      title: 'CPI surprise next print',
      tradeUrl: 'https://kalshi.com/x',
      trendSummary: { summary: '+6.40pp over 24h · accelerating 1.20pp' },
      edge: 0.082,
      depth: 800,
      freshnessSeconds: 120,
    },
    compare: {
      selected: { edge: 0.082, depth: 800, freshnessSeconds: 120 },
      median: { edge: 0.041, depth: 500, freshnessSeconds: 300 },
    },
  });
  assert.match(text, /Forecast Futures summary/);
  assert.match(text, /Compare:/);
  assert.match(text, /Morning Brief:/);
  assert.match(text, /Trade: https:\/\/kalshi\.com\/x/);
});

test('renderApp groups markets by event and surfaces brief/share controls', () => {
  const html = renderApp({
    markets: [
      { id: 'a', title: 'A', event: 'BLS CPI release', price: 40 },
      { id: 'b', title: 'B', event: 'BLS CPI release', price: 42 },
    ],
    outliers: [
      {
        id: 'a',
        title: 'A',
        event: 'BLS CPI release',
        price: 40,
        edge: 0.08,
        rankScore: 88,
        confidence: 'high',
        signalQualityGrade: 'A',
        move: 8,
        freshnessSeconds: 100,
        probabilityHistory: [0.2, 0.25, 0.3, 0.32],
        tradeUrl: 'https://kalshi.com/x',
        updatedAt: '2026-04-17T00:00:00.000Z',
      },
      {
        id: 'b',
        title: 'B',
        event: 'BLS CPI release',
        price: 42,
        edge: 0.06,
        rankScore: 76,
        confidence: 'medium',
        signalQualityGrade: 'B',
        move: 5,
        freshnessSeconds: 120,
        probabilityHistory: [0.22, 0.26, 0.29, 0.31],
        tradeUrl: 'https://kalshi.com/y',
        updatedAt: '2026-04-17T00:10:00.000Z',
      },
    ],
    archive: [],
    rules: [],
    edgeCases: [],
    guardrails: { metrics: { droppedCount: 0, p95LatencyMs: 20, p50LatencyMs: 10, executionQualityGate: {}, reasonCounts: {} } },
  });

  assert.match(html, /BLS CPI release/);
  assert.match(html, /group\.items\.length/);
  assert.match(html, /24h probability delta/);
  assert.match(html, /exportBriefCsvBtn/);
  assert.match(html, /shareBriefSummaryBtn/);
  assert.match(html, /data-action="share-summary"/);
});
