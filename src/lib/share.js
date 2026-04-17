export function buildShareText(market = {}) {
  const title = market.title || 'Forecast Futures opportunity';
  const url = market.tradeUrl || '#';
  const lines = [title, url];

  if (market.confidence) lines.push(`Confidence: ${market.confidence}`);
  if (market.rankScore != null) lines.push(`Rank score: ${Number(market.rankScore || 0).toFixed(2)}`);
  if (market.freshnessSeconds != null) lines.push(`Freshness: ${Number(market.freshnessSeconds || 0).toFixed(0)}s`);
  if (market.lastUpdated) lines.push(`Updated: ${market.lastUpdated}`);

  if (market.scoreBreakdown) {
    const breakdown = market.scoreBreakdown;
    lines.push(
      `Breakdown: move ${Number(breakdown.move || 0).toFixed(2)} · volume ${Number(breakdown.volumeAnomaly || 0).toFixed(2)} · edge ${Number(breakdown.modelEdge || 0).toFixed(2)} · liquidity ${Number(breakdown.liquidity || 0).toFixed(2)} · recency ${Number(breakdown.recency || 0).toFixed(2)}`,
    );
  }

  return lines.join('\n');
}

export function buildOpportunityCsv(markets = []) {
  const header = [
    'id',
    'title',
    'event',
    'rankScore',
    'edgePercent',
    'confidence',
    'freshnessSeconds',
    'lastUpdated',
    'quality',
    'move',
    'tradeUrl',
    'scoreMove',
    'scoreVolumeAnomaly',
    'scoreModelEdge',
    'scoreLiquidity',
    'scoreRecency',
    'scoreConfidence',
    'scoreSpreadQuality',
    'scoreTradeabilityPenalty',
  ];
  const rows = (Array.isArray(markets) ? markets : []).map((item) => [
    item.id,
    item.title,
    item.event,
    Number(item.rankScore || 0).toFixed(2),
    (Math.abs(Number(item.edge || 0)) * 100).toFixed(2),
    item.confidence || '',
    Number(item.freshnessSeconds || 0).toFixed(0),
    item.lastUpdated || '',
    item.signalQualityGrade || '',
    Number(item.move || 0).toFixed(2),
    item.tradeUrl || '',
    Number(item.scoreBreakdown?.move || 0).toFixed(2),
    Number(item.scoreBreakdown?.volumeAnomaly || 0).toFixed(2),
    Number(item.scoreBreakdown?.modelEdge || 0).toFixed(2),
    Number(item.scoreBreakdown?.liquidity || 0).toFixed(2),
    Number(item.scoreBreakdown?.recency || 0).toFixed(2),
    Number(item.scoreBreakdown?.confidence || 0).toFixed(2),
    Number(item.scoreBreakdown?.spreadQuality || 0).toFixed(2),
    Number(item.scoreBreakdown?.tradeabilityPenalty || 0).toFixed(2),
  ]);
  return [header.join(',')]
    .concat(rows.map((row) => row.map(csvCell).join(',')))
    .join('\n') + '\n';
}

function csvCell(value) {
  const cell = String(value ?? '');
  return (cell.includes(',') || cell.includes('"') || cell.includes('\n'))
    ? `"${cell.replaceAll('"', '""')}"`
    : cell;
}

export function buildSummaryShareText({ briefItems = [], selectedItem = null, compare = null } = {}) {
  const lines = ['Forecast Futures summary'];

  if (selectedItem?.title) {
    lines.push(`Selected: ${selectedItem.title}`);
  }

  if (selectedItem?.trendSummary?.summary) {
    lines.push(`Trend: ${selectedItem.trendSummary.summary}`);
  }

  if (selectedItem?.confidence) {
    lines.push(`Confidence: ${selectedItem.confidence}`);
  }
  if (selectedItem?.rankScore != null) {
    lines.push(`Rank score: ${Number(selectedItem.rankScore || 0).toFixed(2)}`);
  }
  if (selectedItem?.freshnessSeconds != null) {
    lines.push(`Freshness: ${Number(selectedItem.freshnessSeconds || 0).toFixed(0)}s`);
  }
  if (selectedItem?.lastUpdated) {
    lines.push(`Updated: ${selectedItem.lastUpdated}`);
  }

  if (compare?.selected) {
    const selected = compare.selected;
    const median = compare.median || {};
    lines.push(
      `Compare: edge ${((Math.abs(Number(selected.edge || 0)) * 100).toFixed(2))}% vs ${Number(median.edge || 0).toFixed(2)}% median · depth ${Number(selected.depth || 0)} vs ${Number(median.depth || 0)} median · freshness ${Number(selected.freshnessSeconds || 0)}s vs ${Number(median.freshnessSeconds || 0)}s median`,
    );
  }

  if (briefItems.length) {
    lines.push('Morning Brief:');
    briefItems.slice(0, 3).forEach((item, index) => {
      const delta = item.trendSummary?.badge || '0.00pp';
      lines.push(`${index + 1}. ${item.title} · ${delta} · ${item.quality} · ${item.confidence}`);
    });
  }

  if (selectedItem?.tradeUrl) {
    lines.push(`Trade: ${selectedItem.tradeUrl}`);
  }

  return lines.join('\n');
}

export function buildReviewShareText({ review = {}, archiveSummary = null } = {}) {
  const lines = ['Forecast Futures review'];

  if (archiveSummary) {
    lines.push(`Archive: ${Number(archiveSummary.wins || 0)} wins · ${Number(archiveSummary.misses || 0)} misses`);
    if (archiveSummary.topWin?.market) {
      lines.push(`Top win: ${archiveSummary.topWin.market} · ${archiveSummary.topWin.outcome?.label || 'correct'}`);
    }
    if (archiveSummary.topMiss?.market) {
      lines.push(`Top miss: ${archiveSummary.topMiss.market} · ${archiveSummary.topMiss.outcome?.label || 'missed'}`);
    }
  }

  if (review?.generatedAt) {
    lines.push(`Generated: ${review.generatedAt}`);
  }

  const forecasts = Array.isArray(review?.forecasts) ? review.forecasts : [];
  if (forecasts.length) {
    lines.push('Forecast theses:');
    forecasts.slice(0, 3).forEach((item, index) => {
      lines.push(`${index + 1}. ${item.market} · score ${Number(item.score || 0).toFixed(2)}`);
      lines.push(`   ${item.thesis}`);
      if (item.confidence || item.generatedAt || item.updatedAt) {
        lines.push(`   Confidence: ${item.confidence || 'n/a'} · Updated: ${item.updatedAt || item.generatedAt || 'n/a'}`);
      }
    });
  }

  return lines.join('\n');
}

export async function copyShareText(text, clipboard = globalThis.navigator?.clipboard) {
  if (clipboard?.writeText) {
    await clipboard.writeText(String(text || ''));
    return true;
  }
  return false;
}
