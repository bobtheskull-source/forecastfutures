function normalizeKey(value) {
  return String(value || '').trim().toLowerCase();
}

function scoreBucket(score) {
  const value = Number(score || 0);
  if (value >= 80) return 'high';
  if (value >= 60) return 'medium';
  return 'low';
}

function summarizeBucket(items, bucketName) {
  const bucketItems = items.filter((item) => scoreBucket(item.score) === bucketName);
  const correct = bucketItems.filter((item) => item.correct).length;
  const accuracy = bucketItems.length ? Number((correct / bucketItems.length).toFixed(4)) : 0;
  return {
    bucket: bucketName,
    count: bucketItems.length,
    correct,
    accuracy,
    label: bucketName === 'high' ? 'high-confidence' : bucketName === 'medium' ? 'medium-confidence' : 'low-confidence',
  };
}

export function buildCalibrationFeedback(archive = []) {
  const items = Array.isArray(archive) ? archive : [];
  const total = items.length;
  const wins = items.filter((item) => item.correct).length;
  const misses = total - wins;
  const winRate = total ? Number((wins / total).toFixed(4)) : 0;
  const buckets = ['high', 'medium', 'low'].map((bucket) => summarizeBucket(items, bucket));
  const label = winRate >= 0.7 ? 'well calibrated' : winRate >= 0.5 ? 'watch calibration' : 'needs calibration';
  const bucketText = buckets
    .filter((bucket) => bucket.count > 0)
    .map((bucket) => `${bucket.label} ${Number(bucket.accuracy * 100).toFixed(1)}% correct (${bucket.count})`)
    .join(' · ');

  return {
    total,
    wins,
    misses,
    winRate,
    label,
    buckets,
    methodology: [
      'Model vs market probability dislocation',
      'Execution-quality filters before surfacing',
      'Confidence and uncertainty band on every signal',
    ],
    summaryText: total
      ? `Historical outcomes: ${wins} wins, ${misses} ${misses === 1 ? 'miss' : 'misses'} (win rate ${(winRate * 100).toFixed(1)}%). ${bucketText || 'No confidence buckets yet.'} Feedback: ${label}.`
      : 'No resolved outcomes yet. Calibration feedback will appear once archive items are available.',
  };
}

function buildEventStats(archive = []) {
  const stats = new Map();
  (Array.isArray(archive) ? archive : []).forEach((item) => {
    const key = normalizeKey(item.event || item.market || item.title);
    if (!key) return;
    const current = stats.get(key) || { total: 0, correct: 0 };
    current.total += 1;
    if (item.correct) current.correct += 1;
    stats.set(key, current);
  });
  return stats;
}

function eventAdjustmentFromStats(stats) {
  if (!stats || !stats.total) return 0;
  const accuracy = stats.correct / stats.total;
  const support = Math.min(1, stats.total / 3);
  const delta = (accuracy - 0.5) * 12 * support;
  return Number(delta.toFixed(2));
}

export function adjustOpportunityScores(markets = [], archive = []) {
  const eventStats = buildEventStats(archive);
  return (Array.isArray(markets) ? markets : []).map((item) => {
    const key = normalizeKey(item.event || item.market || item.title);
    const stats = eventStats.get(key) || null;
    const baseRankScore = Number(item.rankScore || 0);
    const adjustmentDelta = eventAdjustmentFromStats(stats);
    const adjustedRankScore = Number(Math.max(0, Math.min(100, baseRankScore + adjustmentDelta)).toFixed(2));
    const calibrationNote = stats && stats.total
      ? `${stats.correct}/${stats.total} resolved correctly for this event` 
      : 'No resolved outcomes yet';

    return {
      ...item,
      baseRankScore,
      adjustedRankScore,
      rankScore: adjustedRankScore,
      calibrationAdjustment: adjustmentDelta,
      calibrationNote,
      calibrationTrend: stats && stats.total
        ? (stats.correct / stats.total) >= 0.7 ? 'improving' : (stats.correct / stats.total) >= 0.5 ? 'mixed' : 'needs review'
        : 'unproven',
    };
  });
}
