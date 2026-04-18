import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createPublicKey, verify, constants } from 'node:crypto';

import { buildKalshiAuthHeaders, loadLiveKalshiSnapshot } from '../kalshi-backend.js';

function makeTestKeyPair() {
  return generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
}

test('buildKalshiAuthHeaders signs the timestamped request path', () => {
  const { publicKey, privateKey } = makeTestKeyPair();
  const headers = buildKalshiAuthHeaders({
    apiKeyId: 'test-key-id',
    privateKeyPem: privateKey,
    method: 'GET',
    path: '/trade-api/v2/portfolio/balance?subaccount=0',
    timestampMs: 1710000000000,
  });

  assert.equal(headers['KALSHI-ACCESS-KEY'], 'test-key-id');
  assert.equal(headers['KALSHI-ACCESS-TIMESTAMP'], '1710000000000');
  assert.ok(headers['KALSHI-ACCESS-SIGNATURE']);

  const signature = Buffer.from(headers['KALSHI-ACCESS-SIGNATURE'], 'base64');
  const message = Buffer.from('1710000000000GET/trade-api/v2/portfolio/balance');
  assert.equal(
    verify('sha256', message, {
      key: createPublicKey(publicKey),
      padding: constants.RSA_PKCS1_PSS_PADDING,
      saltLength: constants.RSA_PSS_SALTLEN_DIGEST,
    }, signature),
    true,
  );
});

test('loadLiveKalshiSnapshot returns live markets when authenticated requests succeed', async () => {
  const { privateKey } = makeTestKeyPair();
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url, options });
    if (String(url).includes('/portfolio/balance')) {
      return new Response(JSON.stringify({ balance: 12345, portfolio_value: 23456, updated_ts: 1710000000000 }), { status: 200 });
    }
    return new Response(JSON.stringify({
      markets: [{
        ticker: 'CPI-APR',
        event_ticker: 'BLS-CPI',
        market_type: 'binary',
        yes_sub_title: 'CPI above consensus',
        no_sub_title: 'CPI below consensus',
        created_time: '2026-04-17T00:00:00.000Z',
        updated_time: '2026-04-17T00:00:00.000Z',
        open_time: '2026-04-17T00:00:00.000Z',
        close_time: '2026-04-17T00:00:00.000Z',
        latest_expiration_time: '2026-04-17T00:00:00.000Z',
        settlement_timer_seconds: 3600,
        status: 'open',
        notional_value_dollars: 100,
        yes_bid_dollars: 0.41,
        yes_ask_dollars: 0.42,
        no_bid_dollars: 0.58,
        no_ask_dollars: 0.59,
        yes_bid_size_fp: 100,
        yes_ask_size_fp: 100,
        last_price_dollars: 0.42,
        previous_yes_bid_dollars: 0.39,
        previous_yes_ask_dollars: 0.4,
        previous_price_dollars: 0.4,
        volume_fp: 2500,
        volume_24h_fp: 2500,
        liquidity_dollars: 1000,
        open_interest_fp: 500,
        result: null,
        can_close_early: false,
        fractional_trading_enabled: true,
        expiration_value: null,
        rules_primary: 'Primary rule',
        rules_secondary: 'Secondary rule',
        price_level_structure: null,
        price_ranges: [],
      }],
      cursor: '',
    }), { status: 200 });
  };

  const live = await loadLiveKalshiSnapshot({
    apiKeyId: 'test-key-id',
    privateKeyPem: privateKey,
    baseUrl: 'https://demo-api.kalshi.co/trade-api/v2',
    fetchImpl,
    now: () => 1710000000000,
  });

  assert.equal(live.source, 'live-kalshi-backend');
  assert.equal(live.ready, true);
  assert.equal(live.balance.balance, 12345);
  assert.equal(live.markets[0].id, 'CPI-APR');
  assert.equal(live.markets[0].title, 'CPI above consensus');
  assert.ok(requests.some((request) => String(request.url).includes('/portfolio/balance')));
  assert.ok(requests.some((request) => String(request.url).includes('/markets')));
});
