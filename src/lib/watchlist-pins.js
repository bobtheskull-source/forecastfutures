const WATCHLIST_PINS_KEY = 'ff_watchlist_pins_v1';

function unique(values = []) {
  return [...new Set(values.map(String).map((value) => value.trim()).filter(Boolean))];
}

export function loadPinnedWatchlist(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem?.(WATCHLIST_PINS_KEY) || '[]';
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? unique(parsed) : [];
  } catch {
    return [];
  }
}

export function savePinnedWatchlist(ids = [], storage = globalThis.localStorage) {
  const next = unique(ids);
  storage?.setItem?.(WATCHLIST_PINS_KEY, JSON.stringify(next));
  return next;
}

export function togglePinnedWatchlist(marketId, storage = globalThis.localStorage) {
  const current = loadPinnedWatchlist(storage);
  const id = String(marketId || '').trim();
  if (!id) return current;
  const next = current.includes(id) ? current.filter((value) => value !== id) : [id, ...current];
  return savePinnedWatchlist(next, storage);
}

export function isPinnedWatchlist(marketId, storage = globalThis.localStorage) {
  return loadPinnedWatchlist(storage).includes(String(marketId || '').trim());
}

export function groupMarketsByPin(markets = [], pinnedIds = []) {
  const pins = new Set(unique(pinnedIds));
  const pinned = [];
  const unpinned = [];
  (Array.isArray(markets) ? markets : []).forEach((market) => {
    if (pins.has(String(market?.id || '').trim())) pinned.push(market);
    else unpinned.push(market);
  });
  return { pinned, unpinned };
}
