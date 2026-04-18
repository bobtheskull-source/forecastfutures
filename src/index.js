import { mkdirSync, writeFileSync } from 'node:fs';
import { loadConfig } from './lib/config.js';
import { loadSampleMarkets } from './lib/sample-data.js';
import { loadMarketSnapshots, describeSnapshotSource } from './lib/importer.js';
import { detectOutliers } from './lib/detector.js';
import { buildForecastReview } from './lib/review.js';
import { buildAccuracyArchive } from './lib/archive.js';
import { serverReadinessReport } from './lib/infrastructure.js';
import { MOVE_RULES, EDGE_CASES } from './lib/rules.js';
import { renderApp } from './lib/render.js';
import { applyLatencyAndStaleGuardrails } from './lib/guardrails.js';
import { loadLiveKalshiSnapshot } from './lib/kalshi-backend.js';

const demo = process.argv.includes('--demo');
const snapshotArgIndex = process.argv.indexOf('--snapshot');
const snapshotPath = snapshotArgIndex >= 0 ? process.argv[snapshotArgIndex + 1] : '';

async function main() {
  const config = loadConfig();
  let liveSnapshot;
  if (snapshotPath) {
    liveSnapshot = { ready: false, source: 'snapshot-file', markets: loadMarketSnapshots(snapshotPath), balance: null, snapshotSource: describeSnapshotSource(snapshotPath) };
  } else if (demo) {
    liveSnapshot = { ready: false, source: 'demo-mode', markets: loadSampleMarkets(), balance: null, snapshotSource: 'using bundled sample markets' };
  } else {
    try {
      liveSnapshot = await loadLiveKalshiSnapshot({
        apiKeyId: process.env.KALSHI_API_KEY || process.env.KALSHI_API_TOKEN || '',
        baseUrl: config.baseUrl,
      });
    } catch (error) {
      liveSnapshot = {
        ready: false,
        source: 'live-kalshi-backend-failed',
        readError: error instanceof Error ? error.message : String(error),
        markets: null,
        balance: null,
      };
    }
  }

  const markets = Array.isArray(liveSnapshot.markets) && liveSnapshot.markets.length
    ? liveSnapshot.markets
    : (snapshotPath ? loadMarketSnapshots(snapshotPath) : loadSampleMarkets());

  const rankedSignals = detectOutliers(markets);
  const guardrails = applyLatencyAndStaleGuardrails(rankedSignals, {
    freshnessThresholdSeconds: 900,
    minDepth: 250,
    minVolume: 200,
    maxSpread: 0.06,
  });
  const outliers = guardrails.acceptedSignals;

  const review = buildForecastReview(outliers);
  const archive = buildAccuracyArchive(review);
  const readiness = serverReadinessReport();
  const infra = {
    ...readiness,
    liveSource: liveSnapshot.source,
    liveSnapshotBalance: liveSnapshot.balance || null,
    readError: liveSnapshot.readError || null,
    authReady: readiness.ready,
    ready: Boolean(liveSnapshot.ready),
  };
  const html = renderApp({
    markets,
    outliers,
    review,
    archive,
    infra,
    rules: MOVE_RULES,
    edgeCases: EDGE_CASES,
    snapshotSource: liveSnapshot.snapshotSource || describeSnapshotSource(snapshotPath),
    guardrails,
  });

  const distDir = new URL('../dist/', import.meta.url);
  mkdirSync(distDir, { recursive: true });
  writeFileSync(new URL('../dist/index.html', import.meta.url), html);
  writeFileSync(new URL('../index.html', import.meta.url), html);

  const modeLabel = demo
    ? 'demo'
    : snapshotPath
      ? 'snapshot'
      : String(liveSnapshot.source || '').startsWith('live')
        ? (liveSnapshot.authReady ? 'live-auth' : 'live-public')
        : 'local';

  console.log('# Forecast Futures');
  console.log('Mode:', modeLabel);
  console.log('Base URL:', config.baseUrl);
  console.log('Markets loaded:', markets.length);
  console.log('Snapshot source:', liveSnapshot.snapshotSource || describeSnapshotSource(snapshotPath));
  console.log('Outliers detected:', outliers.length);
  console.log('Guardrails stale drops:', guardrails.metrics.staleDropCount);
  console.log('Guardrails latency p50/p95:', `${guardrails.metrics.p50LatencyMs}ms / ${guardrails.metrics.p95LatencyMs}ms`);
  console.log('Rendered:', 'dist/index.html');
  console.log('Server ready:', infra.ready ? 'yes' : 'no');
  console.log('Missing:', infra.missing.join(', ') || 'none');
  console.log('');
  console.log(JSON.stringify({ review, archive, infra, rules: MOVE_RULES, edgeCases: EDGE_CASES, snapshotSource: liveSnapshot.snapshotSource || describeSnapshotSource(snapshotPath), guardrails }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
