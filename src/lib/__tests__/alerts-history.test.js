import test from 'node:test';
import assert from 'node:assert/strict';

import {
  archiveAlertHistoryItem,
  markAlertHistoryItem,
  summarizeAlertHistory,
  upsertAlertHistoryItem,
} from '../alerts.js';
import { renderApp } from '../render.js';

const signal = {
  id: 'cpi',
  title: 'CPI surprise next print',
  event: 'BLS CPI release',
  edge: 0.08,
  confidence: 'high',
  rankScore: 88,
  signalQualityGrade: 'A',
  move: 8,
  freshnessSeconds: 120,
  probabilityHistory: [0.2, 0.24, 0.28, 0.31],
  tradeUrl: 'https://kalshi.com/x',
  updatedAt: '2026-04-17T00:00:00.000Z',
  isTradeable: true,
  depth: 820,
  spread: 0.028,
};

test('alert history records surfaced items and updates dismiss/archive status', () => {
  const surfaced = upsertAlertHistoryItem([], signal, 'surfaced', new Date('2026-04-17T00:00:00.000Z'));
  assert.equal(surfaced.length, 1);
  assert.equal(surfaced[0].status, 'surfaced');
  assert.equal(surfaced[0].marketId, 'cpi');
  assert.match(surfaced[0].reason, /edge/i);

  const dismissed = markAlertHistoryItem(surfaced, 'cpi', 'dismissed', new Date('2026-04-17T01:00:00.000Z'));
  assert.equal(dismissed[0].status, 'dismissed');
  assert.ok(dismissed[0].updatedAt.includes('2026-04-17T01:00:00.000Z'));

  const archived = archiveAlertHistoryItem(dismissed, 'cpi', new Date('2026-04-17T02:00:00.000Z'));
  assert.equal(archived[0].status, 'archived');

  const summary = summarizeAlertHistory(archived);
  assert.equal(summary.total, 1);
  assert.equal(summary.dismissed, 0);
  assert.equal(summary.archived, 1);
  assert.equal(summary.surfaced, 0);
});

test('renderApp surfaces alert history controls for surfaced opportunities', () => {
  const html = renderApp({
    markets: [signal],
    outliers: [signal],
    archive: [],
    rules: [],
    edgeCases: [],
    guardrails: { metrics: { droppedCount: 0, p95LatencyMs: 20, p50LatencyMs: 10, executionQualityGate: {}, reasonCounts: {} } },
  });

  assert.match(html, /Alert history/);
  assert.match(html, /alertHistoryPanel/);
  assert.match(html, /data-action="dismiss-alert"/);
  assert.match(html, /data-action="archive-alert"/);
  assert.match(html, /Recently surfaced alerts/);
});
