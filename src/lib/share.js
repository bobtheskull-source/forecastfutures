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

export async function copyShareText(text, clipboard = globalThis.navigator?.clipboard) {
  if (clipboard?.writeText) {
    await clipboard.writeText(String(text || ''));
    return true;
  }
  return false;
}
