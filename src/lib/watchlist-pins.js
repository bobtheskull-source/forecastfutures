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

export function movePinnedWatchlist(marketId, direction = -1, storage = globalThis.localStorage) {
  const id = String(marketId || '').trim();
  if (!id) return loadPinnedWatchlist(storage);
  const current = loadPinnedWatchlist(storage);
  const index = current.indexOf(id);
  if (index === -1) return current;
  const targetIndex = Math.max(0, Math.min(current.length - 1, index + Number(direction || 0)));
  if (targetIndex === index) return current;
  const next = current.slice();
  next.splice(index, 1);
  next.splice(targetIndex, 0, id);
  return savePinnedWatchlist(next, storage);
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
  const pins = unique(pinnedIds);
  const lookup = new Map((Array.isArray(markets) ? markets : []).map((market) => [String(market?.id || '').trim(), market]));
  const pinned = pins.map((id) => lookup.get(id)).filter(Boolean);
  const unpinned = (Array.isArray(markets) ? markets : []).filter((market) => !pins.includes(String(market?.id || '').trim()));
  return { pinned, unpinned };
}
