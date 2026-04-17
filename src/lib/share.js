export function buildShareText(market = {}) {
  const title = market.title || 'Forecast Futures opportunity';
  const url = market.tradeUrl || '#';
  return `${title}\n${url}`;
}

export async function copyShareText(text, clipboard = globalThis.navigator?.clipboard) {
  if (clipboard?.writeText) {
    await clipboard.writeText(String(text || ''));
    return true;
  }
  return false;
}
