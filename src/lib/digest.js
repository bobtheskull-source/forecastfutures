export function buildMorningBrief(signals = []) {
  const ranked = [...signals].sort((a, b) => (b.rankScore || 0) - (a.rankScore || 0)).slice(0, 3);
  return ranked.map((item) => ({
    id: item.id,
    title: item.title,
    edgePct: Number((Math.abs(Number(item.edge || 0)) * 100).toFixed(2)),
    confidence: item.confidence,
    quality: item.signalQualityGrade || 'C',
  }));
}
