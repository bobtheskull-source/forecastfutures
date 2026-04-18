const JOURNAL_KEY = 'ff_trade_journal_v1';

function normalizeTags(tags = []) {
  return [...new Set(tags.map((tag) => String(tag || '').trim()).filter(Boolean))].slice(0, 6);
}

function normalizeEntry(entry = {}) {
  const marketId = String(entry.marketId || entry.id || '').trim();
  return {
    marketId,
    title: String(entry.title || entry.market || marketId || 'Forecast opportunity'),
    event: String(entry.event || ''),
    note: String(entry.note || entry.text || '').trim(),
    tags: normalizeTags(Array.isArray(entry.tags) ? entry.tags : String(entry.tags || '').split(',')).join(','),
    updatedAt: String(entry.updatedAt || new Date().toISOString()),
  };
}

export function loadTradeJournal(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem?.(JOURNAL_KEY) || '[]';
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeEntry) : [];
  } catch {
    return [];
  }
}

export function saveTradeJournal(entries = [], storage = globalThis.localStorage) {
  const next = entries.map(normalizeEntry).filter((entry) => entry.marketId);
  storage?.setItem?.(JOURNAL_KEY, JSON.stringify(next));
  return next;
}

export function deleteTradeJournalEntry(marketId, storage = globalThis.localStorage) {
  const id = String(marketId || '').trim();
  if (!id) return loadTradeJournal(storage);
  const next = loadTradeJournal(storage).filter((entry) => entry.marketId !== id);
  return saveTradeJournal(next, storage);
}

export function upsertTradeJournalEntry(entry = {}, storage = globalThis.localStorage) {
  const current = loadTradeJournal(storage);
  const normalized = normalizeEntry({
    ...entry,
    tags: normalizeTags(entry.tags || []),
    updatedAt: new Date().toISOString(),
  });
  const next = current.filter((item) => item.marketId !== normalized.marketId);
  if (normalized.marketId) next.unshift(normalized);
  return saveTradeJournal(next, storage);
}

export function findTradeJournalEntry(marketId, storage = globalThis.localStorage) {
  return loadTradeJournal(storage).find((entry) => entry.marketId === String(marketId || '').trim()) || null;
}

export function journalSummary(entries = []) {
  const list = Array.isArray(entries) ? entries.map(normalizeEntry) : [];
  const tags = list.flatMap((entry) => String(entry.tags || '').split(',').filter(Boolean));
  const tagCounts = tags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {});
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return {
    total: list.length,
    recent: list.slice(0, 5),
    topTags,
  };
}

export function searchTradeJournalEntries(entries = [], query = '', tag = '') {
  const q = String(query || '').trim().toLowerCase();
  const activeTag = String(tag || '').trim().toLowerCase();
  return (Array.isArray(entries) ? entries : [])
    .map(normalizeEntry)
    .filter((entry) => {
      const haystack = [entry.title, entry.event, entry.note, entry.tags].join(' ').toLowerCase();
      const queryOk = !q || haystack.includes(q);
      const tagOk = !activeTag || String(entry.tags || '').toLowerCase().split(',').includes(activeTag);
      return queryOk && tagOk;
    });
}

export function buildJournalPrompt(entry = {}) {
  const normalized = normalizeEntry(entry);
  const tags = String(normalized.tags || '').split(',').filter(Boolean);
  return {
    marketId: normalized.marketId,
    title: normalized.title,
    event: normalized.event,
    note: normalized.note,
    tags,
    updatedAt: normalized.updatedAt,
  };
}
