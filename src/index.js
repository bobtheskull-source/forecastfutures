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

const demo = process.argv.includes('--demo');
const snapshotArgIndex = process.argv.indexOf('--snapshot');
const snapshotPath = snapshotArgIndex >= 0 ? process.argv[snapshotArgIndex + 1] : '';
const config = loadConfig();
const markets = snapshotPath ? loadMarketSnapshots(snapshotPath) : loadSampleMarkets();

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
const infra = serverReadinessReport();
const html = renderApp({
  markets,
  outliers,
  review,
  archive,
  infra,
  rules: MOVE_RULES,
  edgeCases: EDGE_CASES,
  snapshotSource: describeSnapshotSource(snapshotPath),
  guardrails,
});

const distDir = new URL('../dist/', import.meta.url);
mkdirSync(distDir, { recursive: true });
writeFileSync(new URL('../dist/index.html', import.meta.url), html);
writeFileSync(new URL('../index.html', import.meta.url), html);

console.log('# Forecast Futures');
console.log('Mode:', demo ? 'demo' : 'local');
console.log('Base URL:', config.baseUrl);
console.log('Markets loaded:', markets.length);
console.log('Snapshot source:', describeSnapshotSource(snapshotPath));
console.log('Outliers detected:', outliers.length);
console.log('Guardrails stale drops:', guardrails.metrics.staleDropCount);
console.log('Guardrails latency p50/p95:', `${guardrails.metrics.p50LatencyMs}ms / ${guardrails.metrics.p95LatencyMs}ms`);
console.log('Rendered:', 'dist/index.html');
console.log('Server ready:', infra.ready ? 'yes' : 'no');
console.log('Missing:', infra.missing.join(', ') || 'none');
console.log('');
console.log(JSON.stringify({ review, archive, infra, rules: MOVE_RULES, edgeCases: EDGE_CASES, snapshotSource: describeSnapshotSource(snapshotPath), guardrails }, null, 2));
