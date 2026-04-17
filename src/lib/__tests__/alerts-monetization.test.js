import test from 'node:test';
import assert from 'node:assert/strict';

import { filterEligibleAlerts, isAlertEligible, mergeAlertPrefs } from '../alerts.js';
import { buildPaywallOffer, copyIsCompliant, enforceCompliantCopy, shouldShowPaywall } from '../monetization.js';

const signals = [
  { id: 'x', edge: 0.09, confidence: 'high', rankScore: 82, title: 'High edge market' },
  { id: 'y', edge: 0.02, confidence: 'medium', rankScore: 45, title: 'Low edge market' },
];

test('alert controls enforce edge and confidence floor', () => {
  const prefs = mergeAlertPrefs({ minEdgePercent: 5, confidenceFloor: 'medium', quietHoursStart: 0, quietHoursEnd: 0 });
  const now = new Date('2026-01-01T13:00:00Z');
  const eligible = filterEligibleAlerts(signals, prefs, now);
  assert.equal(eligible.length, 1);
  assert.equal(eligible[0].id, 'x');
  assert.equal(isAlertEligible(signals[1], prefs, now), false);
});

test('compliant copy guardrails strip forbidden language and append disclaimer', () => {
  const bad = 'Guaranteed returns, risk-free setup and a sure thing.';
  assert.equal(copyIsCompliant(bad), false);
  const cleaned = enforceCompliantCopy(bad);
  assert.equal(/guaranteed|risk[- ]?free|sure thing/i.test(cleaned), false);
  assert.ok(cleaned.includes('not financial advice'));
});

test('paywall offer returns onboarding-to-trial flow for high-intent users', () => {
  assert.equal(shouldShowPaywall({ tradeClicks: 2, selectedSignal: signals[0] }), true);
  const offer = buildPaywallOffer({ selectedSignal: signals[0], tradeClicks: 2 });
  assert.equal(offer.ctaLabel, 'Start 7-day trial');
  assert.equal(Array.isArray(offer.onboardingSteps), true);
  assert.ok(offer.onboardingSteps.length >= 3);
});
