import test from 'node:test';
import assert from 'node:assert/strict';

import { rankMostClicked, rankMostExecuted } from '../click-intel.js';
import { classifyMovement } from '../movement-flags.js';
import { computePaywallIntent, paywallHeadlineByIntent } from '../paywall-intent.js';

test('rankMostClicked returns click score and unique visitors', () => {
  const now = 1_700_000_000_000;
  const markets = [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }];
  const telemetry = {
    a: [{ ts: now - 1_000, visitor: 'u1' }, { ts: now - 2_000, visitor: 'u2' }],
    b: [{ ts: now - 10_000, visitor: 'u1' }],
  };
  const ranked = rankMostClicked(markets, telemetry, { now });
  assert.equal(ranked[0].id, 'a');
  assert.equal(ranked[0].clickCount, 2);
  assert.equal(ranked[0].uniqueVisitors, 2);
});

test('rankMostExecuted returns top traded market from funnel events', () => {
  const now = 1_700_000_000_000;
  const markets = [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }];
  const events = [
    { type: 'trade', marketId: 'a', ts: now - 1_000 },
    { type: 'trade', marketId: 'a', ts: now - 2_000 },
    { type: 'trade', marketId: 'b', ts: now - 3_000 },
    { type: 'impression', marketId: 'b', ts: now - 4_000 },
  ];
  const ranked = rankMostExecuted(markets, events, { now });
  assert.equal(ranked[0].id, 'a');
  assert.equal(ranked[0].tradeCount, 2);
});

test('classifyMovement flags breakout when amplitude is high', () => {
  const movement = classifyMovement({
    price: 40,
    move: 13,
    spread: 0.03,
    depth: 800,
    probabilityHistory: [0.31, 0.36, 0.42, 0.45],
  });
  assert.equal(movement.label, 'Breakout');
  assert.equal(movement.direction, 'up');
  assert.ok(movement.reliability > 0.8);
});

test('computePaywallIntent returns hot tier for strong intent', () => {
  const intent = computePaywallIntent({ tradeClicks: 4, rankScore: 89, edge: 0.11, risingScore: 3.3, clickScore: 2.8 });
  assert.equal(intent.tier, 'hot');
  assert.ok(intent.score > 0.75);
});

test('paywall headline varies by tier', () => {
  assert.match(paywallHeadlineByIntent({ tier: 'hot' }), /Hot market momentum/);
  assert.match(paywallHeadlineByIntent({ tier: 'warm' }), /Strong opportunities/);
  assert.match(paywallHeadlineByIntent({ tier: 'cold' }), /Start your trial/);
});
