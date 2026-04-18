const COMPARE_SETS_STORAGE_KEY = 'ff_compare_sets_v1';
const COMPARE_BOARD_STORAGE_KEY = 'ff_compare_board_v1';
const DEFAULT_MAX_COMPARE_IDS = 4;

function safeParse(raw, fallback) {
  try {
    return JSON.parse(raw || '');
  } catch {
    return fallback;
  }
}

function uniqueIds(ids = [], selectedId = null, maxSize = DEFAULT_MAX_COMPARE_IDS) {
  const next = [];
  const seen = new Set();
  const add = (value) => {
    const id = String(value || '').trim();
    if (!id || seen.has(id) || next.length >= maxSize) return;
    seen.add(id);
    next.push(id);
  };
  add(selectedId);
  ids.forEach(add);
  return next;
}

export function loadCompareBoard(storage) {
  return uniqueIds(safeParse(storage?.getItem(COMPARE_BOARD_STORAGE_KEY), []));
}

export function saveCompareBoard(storage, ids = []) {
  const next = uniqueIds(ids);
  storage?.setItem(COMPARE_BOARD_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function toggleCompareBoardId(ids = [], id, selectedId = null, maxSize = DEFAULT_MAX_COMPARE_IDS) {
  const value = String(id || '').trim();
  if (!value) return uniqueIds(ids, selectedId, maxSize);
  const current = uniqueIds(ids, selectedId, maxSize);
  if (current.includes(value)) {
    return current.filter((item) => item !== value);
  }
  return uniqueIds([value, ...current], selectedId, maxSize);
}

export function saveCompareSet(storage, name, ids = []) {
  const key = String(name || '').trim();
  if (!key) return null;
  const store = loadCompareSets(storage);
  store[key] = {
    ids: uniqueIds(ids),
    updatedAt: new Date().toISOString(),
  };
  storage?.setItem(COMPARE_SETS_STORAGE_KEY, JSON.stringify(store));
  return store[key];
}

export function renameCompareSet(storage, fromName, toName) {
  const source = String(fromName || '').trim();
  const target = String(toName || '').trim();
  if (!source || !target || source === target) return loadCompareSet(storage, source);
  const store = loadCompareSets(storage);
  const existing = store[source];
  if (!existing) return null;
  delete store[source];
  store[target] = { ...existing, updatedAt: new Date().toISOString() };
  storage?.setItem(COMPARE_SETS_STORAGE_KEY, JSON.stringify(store));
  return store[target];
}

export function deleteCompareSet(storage, name) {
  const key = String(name || '').trim();
  if (!key) return false;
  const store = loadCompareSets(storage);
  if (!store[key]) return false;
  delete store[key];
  storage?.setItem(COMPARE_SETS_STORAGE_KEY, JSON.stringify(store));
  return true;
}

export function loadCompareSet(storage, name) {
  const key = String(name || '').trim();
  if (!key) return null;
  const store = loadCompareSets(storage);
  return store[key] || null;
}

export function listCompareSetNames(storage) {
  return Object.keys(loadCompareSets(storage)).sort((a, b) => a.localeCompare(b));
}

export function loadCompareSets(storage) {
  return safeParse(storage?.getItem(COMPARE_SETS_STORAGE_KEY), {});
}

export function saveCompareSets(storage, sets = {}) {
  storage?.setItem(COMPARE_SETS_STORAGE_KEY, JSON.stringify(sets || {}));
  return sets;
}

export function buildCompareScenario(markets = [], selectedId = null, compareIds = []) {
  const lookup = new Map(markets.map((market) => [String(market.id), market]));
  const orderedIds = uniqueIds(compareIds, selectedId, DEFAULT_MAX_COMPARE_IDS);
  return orderedIds.map((id) => lookup.get(String(id)) || { id, title: id, missing: true });
}

export function compareBoardLabel(items = []) {
  const count = Array.isArray(items) ? items.length : 0;
  return count === 1 ? '1 market' : `${count} markets`;
}

export const COMPARE_BOARD_KEY = COMPARE_BOARD_STORAGE_KEY;
export const COMPARE_SETS_KEY = COMPARE_SETS_STORAGE_KEY;
