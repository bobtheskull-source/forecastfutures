const WATCHLIST_KEY = 'ff_watchlist_v1';

export function loadWatchlist(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem?.(WATCHLIST_KEY) || '[]';
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveWatchlist(ids = [], storage = globalThis.localStorage) {
  const uniq = [...new Set(ids.map(String))];
  storage?.setItem?.(WATCHLIST_KEY, JSON.stringify(uniq));
  return uniq;
}

export function toggleWatchlist(marketId, storage = globalThis.localStorage) {
  const current = loadWatchlist(storage);
  const id = String(marketId);
  if (current.includes(id)) {
    return saveWatchlist(current.filter((x) => x != id), storage);
  }
  return saveWatchlist([...current, id], storage);
}

export function isWatchlisted(marketId, storage = globalThis.localStorage) {
  return loadWatchlist(storage).includes(String(marketId));
}
