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
  const actualMove = Number.isFinite(lastPrice) && Number.isFinite(previousPrice) ? Math.round((lastPrice - previousPrice) * 100) : 0;
  const syntheticMove = Number.isFinite(marketProb) ? Math.round((marketProb - 0.5) * 100) : 0;
  const volume = Number(raw.volume_24h_fp ?? raw.volume_fp ?? raw.volume ?? 0);
  const liquidity = Number(raw.liquidity_dollars ?? raw.depth ?? 0);
  const depth = liquidity > 0 ? liquidity : Number(raw.volume_24h_fp ?? raw.volume_fp ?? raw.depth ?? 0);
  const spread = Number(Math.max(0, Number(raw.yes_ask_dollars ?? 0) - Number(raw.yes_bid_dollars ?? 0)).toFixed(3));

  return {
    id: ticker,
    title: yesSubTitle,
    event: raw.event_ticker || raw.event || ticker,
    price: Number.isFinite(marketProb) ? Math.round(marketProb * 100) : 0,
    move: actualMove !== 0 ? actualMove : syntheticMove,
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

async function fetchJsonWithRetry(fetchImpl, url, options = {}, attempts = 3, delayMs = 150) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetchJson(fetchImpl, url, options);
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (attempt === attempts || !message.includes('HTTP 429')) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError || 'Kalshi request failed'));
}

export async function loadLiveKalshiSnapshot({
  apiKeyId = process.env.KALSHI_API_KEY || process.env.KALSHI_API_TOKEN || '',
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
  const hasAuth = Boolean(apiKeyId && privateKey);
  const marketLimit = Math.max(1, Number(limit) || 5);
  const eventLimit = marketLimit;

  const eventsResult = await fetchJson(fetchImpl, `${baseUrl}/events?status=open&limit=${eventLimit}`);
  const eventTickers = Array.isArray(eventsResult.events)
    ? eventsResult.events.map((event) => event.event_ticker).filter(Boolean)
    : [];
  const marketPages = [];
  for (const eventTicker of eventTickers.slice(0, eventLimit)) {
    const eventMarketsResult = await fetchJsonWithRetry(fetchImpl, `${baseUrl}/markets?event_ticker=${encodeURIComponent(eventTicker)}&limit=${marketLimit}`);
    const firstMarket = Array.isArray(eventMarketsResult.markets) ? eventMarketsResult.markets[0] : null;
    if (firstMarket) marketPages.push([firstMarket]);
    if (marketPages.length >= marketLimit) break;
  }

  let markets = marketPages.flatMap((page) => page).map(normalizeKalshiMarket).filter((market) => market.id);
  if (!markets.length) {
    const marketsResult = await fetchJson(fetchImpl, `${baseUrl}/markets?status=open&limit=${marketLimit}`);
    markets = Array.isArray(marketsResult.markets) ? marketsResult.markets.map(normalizeKalshiMarket).filter((market) => market.id) : [];
  }

  const snapshotUpdatedAt = new Date(now()).toISOString();
  markets = markets
    .map((market) => ({ ...market, sourceUpdatedAt: market.updatedAt, updatedAt: snapshotUpdatedAt }))
    .sort((a, b) => Number(b.volume || 0) - Number(a.volume || 0) || Math.abs(Number(b.move || 0)) - Math.abs(Number(a.move || 0)))
    .slice(0, marketLimit);

  let balanceResult = null;
  let balanceError = null;
  if (hasAuth) {
    const balancePath = '/portfolio/balance';
    const timestamp = now();
    const balanceHeaders = buildKalshiAuthHeaders({
      apiKeyId,
      privateKeyPem: privateKey,
      method: 'GET',
      path: balancePath,
      timestampMs: timestamp,
    });
    try {
      balanceResult = await fetchJson(fetchImpl, `${baseUrl}${balancePath}`, { headers: balanceHeaders });
    } catch (error) {
      balanceError = error instanceof Error ? error.message : String(error);
    }
  }

  const balance = balanceResult && typeof balanceResult === 'object' ? balanceResult : null;

  return {
    ready: true,
    authReady: hasAuth && !balanceError,
    source: hasAuth ? (balanceError ? 'live-kalshi-backend-partial' : 'live-kalshi-backend') : 'live-kalshi-public',
    markets,
    balance,
    marketsCount: markets.length,
    balanceUpdatedTs: balance?.updated_ts || null,
    readError: balanceError || null,
    snapshotSource: hasAuth
      ? (balanceError
        ? `live Kalshi API (${markets.length} markets, balance skipped)`
        : `live Kalshi API (${markets.length} markets, balance verified)`)
      : `live Kalshi API (${markets.length} markets, balance skipped)`,
  };
}
