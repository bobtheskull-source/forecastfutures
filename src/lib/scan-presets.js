const STORAGE_KEY = 'ff_scan_presets_v1';

const DEFAULTS = {
  query: '',
  sort: 'score',
  watchlistOnly: false,
  feedMode: 'now',
  minEdgePreset: null,
  maxResolveHours: null,
  breakoutOnly: false,
  executionReadyOnly: false,
};

const PRESET_MAP = {
  breakout: { minEdgePreset: 5, maxResolveHours: 168, breakoutOnly: true, executionReadyOnly: true },
  watchlist: { watchlistOnly: true, feedMode: 'discover' },
  highEdge: { minEdgePreset: 5, feedMode: 'now' },
};

export function applyScanPreset(state = {}, presetName = 'clear') {
  const cleared = {
    ...state,
    watchlistOnly: false,
    feedMode: 'now',
    minEdgePreset: null,
    maxResolveHours: null,
    breakoutOnly: false,
    executionReadyOnly: false,
  };
  if (presetName === 'clear') return cleared;
  return { ...cleared, ...(PRESET_MAP[presetName] || {}) };
}

export function computeSavedScanPresets(storage = window?.localStorage) {
  if (!storage) return {};
  try {
    return JSON.parse(storage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveScanPreset(storage = window?.localStorage, name = 'default', state = {}) {
  if (!storage) return {};
  const presets = computeSavedScanPresets(storage);
  presets[name] = {
    ...DEFAULTS,
    ...state,
  };
  storage.setItem(STORAGE_KEY, JSON.stringify(presets));
  return presets[name];
}

export function loadScanPreset(storage = window?.localStorage, name = 'default') {
  const presets = computeSavedScanPresets(storage);
  return presets[name] ? { ...DEFAULTS, ...presets[name] } : null;
}

export function listSavedScanPresets(storage = window?.localStorage) {
  return Object.keys(computeSavedScanPresets(storage));
}

export function compareMarketToMedian(markets = [], selectedId = null) {
  const selected = markets.find((m) => String(m.id) === String(selectedId)) || null;
  const sample = markets.filter((m) => String(m.id) !== String(selectedId));
  const median = (values = []) => {
    const list = values.map((value) => Number(value)).filter(Number.isFinite).sort((a, b) => a - b);
    if (!list.length) return 0;
    const mid = Math.floor(list.length / 2);
    return list.length % 2 ? list[mid] : (list[mid - 1] + list[mid]) / 2;
  };
  const metrics = {
    edge: median(sample.map((m) => Math.abs(Number(m.edge || 0)) * 100)),
    depth: median(sample.map((m) => Number(m.depth || 0))),
    freshnessSeconds: median(sample.map((m) => Number(m.freshnessSeconds || 0))),
  };
  return { selected, median: metrics };
}

export function compareMarketToEventMedian(markets = [], selectedId = null) {
  const selected = markets.find((m) => String(m.id) === String(selectedId)) || null;
  const pool = selected?.event
    ? markets.filter((market) => String(market.event || '') === String(selected.event))
    : markets;
  const median = (values = []) => {
    const list = values.map((value) => Number(value)).filter(Number.isFinite).sort((a, b) => a - b);
    if (!list.length) return 0;
    const mid = Math.floor(list.length / 2);
    return list.length % 2 ? list[mid] : (list[mid - 1] + list[mid]) / 2;
  };
  const eventMedian = {
    edge: median(pool.map((m) => Math.abs(Number(m.edge || 0)) * 100)),
    depth: median(pool.map((m) => Number(m.depth || 0))),
    freshnessSeconds: median(pool.map((m) => Number(m.freshnessSeconds || 0))),
  };
  const deltas = selected ? {
    edge: Number((Math.abs(Number(selected.edge || 0)) * 100 - eventMedian.edge).toFixed(2)),
    depth: Number((Number(selected.depth || 0) - eventMedian.depth).toFixed(0)),
    freshnessSeconds: Number((Number(selected.freshnessSeconds || 0) - eventMedian.freshnessSeconds).toFixed(0)),
  } : null;
  return { selected, event: selected?.event || null, median: eventMedian, deltas };
}
