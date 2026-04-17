export const DEFAULT_ALERT_PREFS = {
  minEdgePercent: 4,
  confidenceFloor: 'medium',
  quietHoursStart: 22,
  quietHoursEnd: 7,
  cooldownMinutes: 30,
};

export const ALERT_HISTORY_STORAGE_KEY = 'ff_alert_history_v1';
const ALERT_HISTORY_LIMIT = 50;
const CONF_RANK = { low: 1, medium: 2, high: 3 };

function inQuietHours(hour, start, end) {
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

function toIsoTime(now = new Date()) {
  return now instanceof Date ? now.toISOString() : new Date(now).toISOString();
}

function normalizeAlertHistoryEntry(entry = {}) {
  const marketId = String(entry.marketId || entry.id || '');
  return {
    marketId,
    title: String(entry.title || entry.market || marketId),
    event: String(entry.event || ''),
    reason: String(entry.reason || ''),
    status: entry.status === 'archived' ? 'archived' : entry.status === 'dismissed' ? 'dismissed' : 'surfaced',
    surfacedAt: String(entry.surfacedAt || entry.updatedAt || toIsoTime()),
    updatedAt: String(entry.updatedAt || entry.surfacedAt || toIsoTime()),
  };
}

function sortAlertHistory(entries = []) {
  return entries.slice().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export function mergeAlertPrefs(raw = {}) {
  return {
    ...DEFAULT_ALERT_PREFS,
    ...raw,
  };
}

export function isAlertEligible(signal, prefsInput = DEFAULT_ALERT_PREFS, now = new Date()) {
  const prefs = mergeAlertPrefs(prefsInput);
  const hour = now.getHours();
  if (inQuietHours(hour, Number(prefs.quietHoursStart), Number(prefs.quietHoursEnd))) return false;

  const edgePct = Math.abs(Number(signal.edge || 0)) * 100;
  if (edgePct < Number(prefs.minEdgePercent)) return false;

  const requiredConf = CONF_RANK[prefs.confidenceFloor] || 2;
  const signalConf = CONF_RANK[signal.confidence] || 1;
  return signalConf >= requiredConf;
}

export function filterEligibleAlerts(signals = [], prefs = DEFAULT_ALERT_PREFS, now = new Date()) {
  return signals.filter((signal) => isAlertEligible(signal, prefs, now));
}

export function upsertAlertHistoryItem(history = [], signal = {}, status = 'surfaced', now = new Date()) {
  const entry = normalizeAlertHistoryEntry({
    marketId: signal.id,
    title: signal.title,
    event: signal.event,
    reason: signal.alertReason || signal.reason || `edge ${Math.abs(Number(signal.edge || 0) * 100).toFixed(2)}% · confidence ${signal.confidence || 'low'}`,
    status,
    surfacedAt: signal.surfacedAt || signal.updatedAt || toIsoTime(now),
    updatedAt: toIsoTime(now),
  });

  const next = history.filter((item) => String(item.marketId) !== entry.marketId);
  next.unshift(entry);
  return sortAlertHistory(next).slice(0, ALERT_HISTORY_LIMIT);
}

export function markAlertHistoryItem(history = [], marketId, status, now = new Date()) {
  const id = String(marketId || '');
  if (!id) return sortAlertHistory(history).slice(0, ALERT_HISTORY_LIMIT);
  const existing = history.find((item) => String(item.marketId) === id);
  const nextEntry = normalizeAlertHistoryEntry({
    ...existing,
    marketId: id,
    status,
    surfacedAt: existing?.surfacedAt || existing?.updatedAt || toIsoTime(now),
    updatedAt: toIsoTime(now),
  });
  const next = history.filter((item) => String(item.marketId) !== id);
  next.unshift(nextEntry);
  return sortAlertHistory(next).slice(0, ALERT_HISTORY_LIMIT);
}

export function archiveAlertHistoryItem(history = [], marketId, now = new Date()) {
  return markAlertHistoryItem(history, marketId, 'archived', now);
}

export function summarizeAlertHistory(history = []) {
  const entries = Array.isArray(history) ? history.map(normalizeAlertHistoryEntry) : [];
  return entries.reduce((acc, item) => {
    acc.total += 1;
    if (item.status === 'dismissed') acc.dismissed += 1;
    if (item.status === 'archived') acc.archived += 1;
    if (item.status === 'surfaced') acc.surfaced += 1;
    acc.recent = acc.recent || [];
    if (acc.recent.length < 5) acc.recent.push(item);
    return acc;
  }, { total: 0, surfaced: 0, dismissed: 0, archived: 0, recent: [] });
}
