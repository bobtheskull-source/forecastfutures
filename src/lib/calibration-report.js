export function buildCalibrationReport(archive = []) {
  const total = archive.length;
  const wins = archive.filter((x) => x.correct).length;
  const misses = total - wins;
  const winRate = total ? Number((wins / total).toFixed(4)) : 0;

  return {
    total,
    wins,
    misses,
    winRate,
    methodology: [
      'Model vs market probability dislocation',
      'Execution-quality filters before surfacing',
      'Confidence and uncertainty band on every signal',
    ],
  };
}
