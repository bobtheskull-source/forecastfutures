import test from 'node:test';
import assert from 'node:assert/strict';

import { buildShareText, buildOpportunityCsv } from '../share.js';

test('buildShareText returns title and trade url', () => {
  const text = buildShareText({
    title: 'CPI surprise next print',
    tradeUrl: 'https://kalshi.com/x',
    confidence: 'high',
    rankScore: 88.4,
    freshnessSeconds: 120,
    lastUpdated: '2026-04-17T00:00:00.000Z',
    scoreBreakdown: { move: 7.5, volumeAnomaly: 8.1, modelEdge: 22.5, liquidity: 14.1, recency: 8.8 },
  });
  assert.match(text, /CPI surprise next print/);
  assert.match(text, /https:\/\/kalshi\.com\/x/);
  assert.match(text, /Confidence: high/);
  assert.match(text, /Rank score: 88\.40/);
  assert.match(text, /Freshness: 120s/);
  assert.match(text, /Breakdown:/);
});

 test('buildOpportunityCsv includes confidence and timestamp columns', () => {
  const csv = buildOpportunityCsv([
    {
      id: 'm1',
      title: 'CPI surprise next print',
      event: 'BLS CPI release',
      rankScore: 88.4,
      edge: 0.081,
      confidence: 'high',
      freshnessSeconds: 120,
      lastUpdated: '2026-04-17T00:00:00.000Z',
      signalQualityGrade: 'A',
      move: 7.4,
      tradeUrl: 'https://kalshi.com/x',
      scoreBreakdown: { move: 7.5, volumeAnomaly: 8.1, modelEdge: 22.5, liquidity: 14.1, recency: 8.8, confidence: 13.5, spreadQuality: 5.5, tradeabilityPenalty: 0 },
    },
  ]);
  assert.match(csv, /confidence,freshnessSeconds,lastUpdated,quality,move,tradeUrl/);
  assert.match(csv, /high/);
  assert.match(csv, /2026-04-17T00:00:00\.000Z/);
  assert.match(csv, /22\.50/);
});
