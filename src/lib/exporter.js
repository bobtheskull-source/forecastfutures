function escapeCsv(value) {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function opportunitiesToCsv(rows = []) {
  const headers = [
    'id',
    'title',
    'event',
    'rankScore',
    'edgePercent',
    'move',
    'volumeAnomaly',
    'modelEdge',
    'liquidity',
    'recency',
    'tradeable',
    'tradeUrl',
  ];

  const lines = [headers.join(',')];
  for (const row of rows) {
    const values = [
      row.id,
      row.title,
      row.event,
      Number(row.rankScore || 0).toFixed(2),
      (Math.abs(Number(row.edge || 0)) * 100).toFixed(2),
      Number(row?.scoreBreakdown?.move || 0).toFixed(2),
      Number(row?.scoreBreakdown?.volumeAnomaly || 0).toFixed(2),
      Number(row?.scoreBreakdown?.modelEdge || 0).toFixed(2),
      Number(row?.scoreBreakdown?.liquidity || 0).toFixed(2),
      Number(row?.scoreBreakdown?.recency || 0).toFixed(2),
      row.isTradeable ? 'yes' : 'no',
      row.tradeUrl || '',
    ].map(escapeCsv);
    lines.push(values.join(','));
  }

  return `${lines.join('\n')}\n`;
}
