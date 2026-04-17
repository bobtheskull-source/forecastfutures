function quoteCsv(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function rowToCsv(cells) {
  return cells.map(quoteCsv).join(',');
}

export function forecastReviewToCsv({ review = {}, archive = [] } = {}) {
  const header = ['section', 'rank', 'id', 'market', 'event', 'direction', 'score', 'thesis', 'postMortem', 'outcome', 'correct'];
  const reviewRows = (review.forecasts || []).map((item, index) => rowToCsv([
    'review',
    index + 1,
    item.id,
    item.market,
    item.event,
    item.direction,
    Number(item.score || 0).toFixed(2),
    item.thesis,
    item.postMortem,
    '',
    '',
  ]));
  const archiveRows = archive.map((item, index) => rowToCsv([
    'archive',
    index + 1,
    item.id,
    item.market,
    item.event,
    item.direction,
    Number(item.score || 0).toFixed(2),
    item.thesis || '',
    item.postMortem || '',
    item.outcome?.label || '',
    item.correct ? 'true' : 'false',
  ]));
  return [header.join(','), ...reviewRows, ...archiveRows].join('\n') + '\n';
}
