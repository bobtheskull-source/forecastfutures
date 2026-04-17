function escapeCsv(value) {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function morningBriefToCsv(rows = []) {
  const headers = [
    'rank',
    'id',
    'title',
    'event',
    'edgePercent',
    'confidence',
    'quality',
    '24hDeltaPp',
    'accelerationPp',
    'tradeUrl',
  ];

  const lines = [headers.join(',')];
  rows.forEach((row, index) => {
    const trend = row.trendSummary || {};
    const values = [
      index + 1,
      row.id,
      row.title,
      row.event,
      Number(row.edgePct || 0).toFixed(2),
      row.confidence,
      row.quality,
      Number(trend.delta24hPp || 0).toFixed(2),
      Number(trend.accelerationPp || 0).toFixed(2),
      row.tradeUrl || '',
    ].map(escapeCsv);
    lines.push(values.join(','));
  });

  return `${lines.join('\n')}\n`;
}
