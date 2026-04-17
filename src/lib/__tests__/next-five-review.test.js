import test from 'node:test';
import assert from 'node:assert/strict';

import { buildReviewShareText } from '../share.js';
import { forecastReviewToCsv } from '../review-export.js';
import { renderApp } from '../render.js';

const review = {
  generatedAt: '2026-04-17T03:00:00.000Z',
  forecasts: [
    {
      id: 'cpi',
      market: 'CPI surprise next print',
      event: 'BLS CPI release',
      direction: 'up',
      score: 91.25,
      thesis: 'Large upside move with improving momentum.',
      postMortem: 'Compare the thesis against the release and post-event drift.',
    },
    {
      id: 'fed',
      market: 'Fed cuts at next meeting',
      event: 'FOMC decision',
      direction: 'down',
      score: 84.5,
      thesis: 'Cooling labor data is pressuring cut odds.',
      postMortem: 'Check whether move was driven by rates or headline churn.',
    },
  ],
};

const archive = [
  {
    id: 'cpi',
    market: 'CPI surprise next print',
    event: 'BLS CPI release',
    direction: 'up',
    score: 91.25,
    thesis: 'Large upside move with improving momentum.',
    postMortem: 'Compare the thesis against the release and post-event drift.',
    outcome: { label: 'Real world confirmed the move', direction: 'up' },
    correct: true,
    accuracyLabel: 'correct',
  },
  {
    id: 'fed',
    market: 'Fed cuts at next meeting',
    event: 'FOMC decision',
    direction: 'down',
    score: 84.5,
    thesis: 'Cooling labor data is pressuring cut odds.',
    postMortem: 'Check whether move was driven by rates or headline churn.',
    outcome: { label: 'Signal overshot and reversed', direction: 'down' },
    correct: false,
    accuracyLabel: 'missed',
  },
];

const guardrails = { metrics: { droppedCount: 0, p95LatencyMs: 20, p50LatencyMs: 10, executionQualityGate: {}, reasonCounts: {} } };

test('forecastReviewToCsv exports review and archive rows', () => {
  const csv = forecastReviewToCsv({ review, archive });
  assert.match(csv, /section,rank,id,market,event,direction,score,thesis,postMortem,outcome,correct/);
  assert.match(csv, /review,1,cpi,CPI surprise next print,BLS CPI release,up,91\.25/);
  assert.match(csv, /archive,2,fed,Fed cuts at next meeting,FOMC decision,down,84\.50/);
  assert.match(csv, /Signal overshot and reversed/);
  assert.match(csv, /true/);
});

test('buildReviewShareText includes archive summary and forecast theses', () => {
  const text = buildReviewShareText({
    review,
    archiveSummary: {
      wins: 1,
      misses: 1,
      topWin: archive[0],
      topMiss: archive[1],
    },
  });
  assert.match(text, /Forecast Futures review/);
  assert.match(text, /Archive: 1 wins · 1 misses/);
  assert.match(text, /Top win: CPI surprise next print/);
  assert.match(text, /Top miss: Fed cuts at next meeting/);
  assert.match(text, /Forecast theses:/);
  assert.match(text, /Cooling labor data/);
});

test('renderApp surfaces archive review panel and review export/share controls', () => {
  const html = renderApp({
    markets: [
      { id: 'cpi', title: 'CPI surprise next print', event: 'BLS CPI release', price: 40, edge: 0.08, depth: 800, freshnessSeconds: 120, isTradeable: true },
      { id: 'fed', title: 'Fed cuts at next meeting', event: 'FOMC decision', price: 18, edge: 0.06, depth: 500, freshnessSeconds: 180, isTradeable: true },
    ],
    outliers: [
      { id: 'cpi', title: 'CPI surprise next print', event: 'BLS CPI release', price: 40, edge: 0.08, rankScore: 88, confidence: 'high', signalQualityGrade: 'A', move: 8, freshnessSeconds: 120, probabilityHistory: [0.2, 0.25, 0.3, 0.32], tradeUrl: 'https://kalshi.com/x', updatedAt: '2026-04-17T00:00:00.000Z', isTradeable: true },
    ],
    review,
    archive,
    rules: [],
    edgeCases: [],
    guardrails,
  });

  assert.match(html, /exportReviewCsvBtn/);
  assert.match(html, /shareReviewSummaryBtn/);
  assert.match(html, /Forecast theses/);
  assert.match(html, /Post-mortem prompt/);
  assert.match(html, /Resolved archive/);
  assert.match(html, /correct/);
  assert.match(html, /missed/);
});

test('renderApp adds watchlist health card to trends view', () => {
  const html = renderApp({
    markets: [
      { id: 'cpi', title: 'CPI surprise next print', event: 'BLS CPI release', price: 40, edge: 0.08, depth: 800, freshnessSeconds: 120, isTradeable: true },
    ],
    outliers: [
      { id: 'cpi', title: 'CPI surprise next print', event: 'BLS CPI release', price: 40, edge: 0.08, rankScore: 88, confidence: 'high', signalQualityGrade: 'A', move: 8, freshnessSeconds: 120, probabilityHistory: [0.2, 0.25, 0.3, 0.32], tradeUrl: 'https://kalshi.com/x', updatedAt: '2026-04-17T00:00:00.000Z', isTradeable: true },
    ],
    review,
    archive,
    rules: [],
    edgeCases: [],
    guardrails,
  });

  assert.match(html, /Watchlist health/);
  assert.match(html, /watchlistHealth/);
});

test('renderApp summary counts are still exposed in archive review', () => {
  const html = renderApp({
    markets: [
      { id: 'cpi', title: 'CPI surprise next print', event: 'BLS CPI release', price: 40, edge: 0.08, depth: 800, freshnessSeconds: 120, isTradeable: true },
    ],
    outliers: [
      { id: 'cpi', title: 'CPI surprise next print', event: 'BLS CPI release', price: 40, edge: 0.08, rankScore: 88, confidence: 'high', signalQualityGrade: 'A', move: 8, freshnessSeconds: 120, probabilityHistory: [0.2, 0.25, 0.3, 0.32], tradeUrl: 'https://kalshi.com/x', updatedAt: '2026-04-17T00:00:00.000Z', isTradeable: true },
    ],
    review,
    archive,
    rules: [],
    edgeCases: [],
    guardrails,
  });

  assert.match(html, /Review summary/);
  assert.match(html, /1 wins · 1 misses/);
  assert.match(html, /Top win: CPI surprise next print/);
});
