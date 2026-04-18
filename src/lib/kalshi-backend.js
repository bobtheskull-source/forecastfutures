import { constants, sign } from 'node:crypto';

import { readKalshiPrivateKey } from './kalshi-path.js';

export const DEFAULT_KALSHI_BASE_URL = 'https://api.elections.kalshi.com/trade-api/v2';

export function buildKalshiAuthHeaders({
  apiKeyId = '',
  privateKeyPem = '',
  method = 'GET',
  path = '/',
  timestampMs = Date.now(),
} = {}) {
  const signedPath = String(path || '/').split('?')[0] || '/';
  const timestamp = String(timestampMs);
  const normalizedMethod = String(method || 'GET').toUpperCase();
  const message = Buffer.from(`${timestamp}${normalizedMethod}${signedPath}`);
  const signature = sign('sha256', message, {
    key: privateKeyPem,
    padding: constants.RSA_PKCS1_PSS_PADDING,
    saltLength: constants.RSA_PSS_SALTLEN_DIGEST,
  });

  return {
    'KALSHI-ACCESS-KEY': apiKeyId,
    'KALSHI-ACCESS-SIGNATURE': signature.toString('base64'),
    'KALSHI-ACCESS-TIMESTAMP': timestamp,
  };
}

export function normalizeKalshiMarket(raw = {}) {
  const ticker = raw.ticker || raw.market_ticker || raw.id || '';
  const yesSubTitle = raw.yes_sub_title || raw.title || raw.subtitle || ticker || 'Kalshi market';
  const lastPrice = Number(raw.last_price_dollars ?? raw.yes_bid_dollars ?? raw.price ?? 0);
  const previousPrice = Number(raw.previous_price_dollars ?? raw.previous_yes_bid_dollars ?? lastPrice);
  const marketProb = Number.isFinite(lastPrice) ? lastPrice : 0;
  const modelProb = Number(raw.yes_ask_dollars ?? raw.last_price_dollars ?? marketProb);
  const volume = Number(raw.volume_24h_fp ?? raw.volume_fp ?? raw.volume ?? 0);
  const depth = Number(raw.liquidity_dollars ?? raw.depth ?? 0);
  const spread = Number(Math.max(0, Number(raw.yes_ask_dollars ?? 0) - Number(raw.yes_bid_dollars ?? 0)).toFixed(3));

  return {
    id: ticker,
    title: yesSubTitle,
    event: raw.event_ticker || raw.event || ticker,
    price: Number.isFinite(marketProb) ? Math.round(marketProb * 100) : 0,
    move: Number.isFinite(lastPrice) && Number.isFinite(previousPrice) ? Math.round((lastPrice - previousPrice) * 100) : 0,
    volume,
    depth,
    spread,
    updatedAt: raw.updated_time || raw.updatedAt || new Date().toISOString(),
    scenarioDrivers: [raw.rules_primary, raw.rules_secondary].filter(Boolean),
    probabilityHistory: [previousPrice, lastPrice].filter((value) => Number.isFinite(value)),
    tradeUrl: raw.tradeUrl || `https://kalshi.com/markets/${ticker}`,
    marketProb,
    modelProb: Number.isFinite(modelProb) ? modelProb : marketProb,
    confidence: raw.confidence || 'medium',
    signalQualityGrade: raw.signalQualityGrade || 'B',
    rankScore: Number(raw.rankScore ?? raw.score ?? 0),
    isTradeable: raw.status ? raw.status === 'open' : true,
    status: raw.status || 'open',
  };
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { rawText: text };
  }
}

async function fetchJson(fetchImpl, url, options = {}) {
  const response = await fetchImpl(url, options);
  const body = await readJsonResponse(response);
  if (!response.ok) {
    const message = body && typeof body === 'object' && body.message
      ? body.message
      : body?.rawText || `HTTP ${response.status}`;
    throw new Error(`Kalshi request failed for ${url}: ${message}`);
  }
  return body;
}

export async function loadLiveKalshiSnapshot({
  apiKeyId = process.env.KALSHI_API_KEY || '',
  privateKeyPem,
  baseUrl = process.env.KALSHI_BASE_URL || DEFAULT_KALSHI_BASE_URL,
  fetchImpl = globalThis.fetch,
  now = () => Date.now(),
  limit = 5,
} = {}) {
  if (typeof fetchImpl !== 'function') {
    return {
      ready: false,
      source: 'missing-fetch',
      readError: 'No fetch implementation available.',
      markets: null,
      balance: null,
    };
  }

  const { privateKey } = privateKeyPem
    ? { privateKey: privateKeyPem }
    : readKalshiPrivateKey();

  if (!apiKeyId || !privateKey) {
    return {
      ready: false,
      source: 'credentials-missing',
      readError: 'Kalshi credentials are incomplete.',
      markets: null,
      balance: null,
    };
  }

  const marketsPath = `/markets?status=open&limit=${Number(limit) || 5}`;
  const balancePath = '/portfolio/balance';
  const timestamp = now();
  const balanceHeaders = buildKalshiAuthHeaders({
    apiKeyId,
    privateKeyPem: privateKey,
    method: 'GET',
    path: balancePath,
    timestampMs: timestamp,
  });

  const [marketsResult, balanceResult] = await Promise.all([
    fetchJson(fetchImpl, `${baseUrl}${marketsPath}`),
    fetchJson(fetchImpl, `${baseUrl}${balancePath}`, { headers: balanceHeaders }),
  ]);

  const markets = Array.isArray(marketsResult.markets) ? marketsResult.markets.map(normalizeKalshiMarket) : [];
  const balance = balanceResult && typeof balanceResult === 'object' ? balanceResult : {};

  return {
    ready: true,
    source: 'live-kalshi-backend',
    markets,
    balance,
    marketsCount: markets.length,
    balanceUpdatedTs: balance.updated_ts || null,
    snapshotSource: `live Kalshi API (${markets.length} markets, balance verified)`,
  };
}
