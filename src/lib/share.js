export function buildShareText(market = {}) {
  const title = market.title || 'Forecast Futures opportunity';
  const url = market.tradeUrl || '#';
  return `${title}\n${url}`;
}

export function buildSummaryShareText({ briefItems = [], selectedItem = null, compare = null } = {}) {
  const lines = ['Forecast Futures summary'];

  if (selectedItem?.title) {
    lines.push(`Selected: ${selectedItem.title}`);
  }

  if (selectedItem?.trendSummary?.summary) {
    lines.push(`Trend: ${selectedItem.trendSummary.summary}`);
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
