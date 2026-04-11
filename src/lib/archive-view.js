export function archiveSummary(archive) {
  return {
    wins: archive.filter((item) => item.correct).length,
    misses: archive.filter((item) => !item.correct).length,
    topWin: [...archive].filter((item) => item.correct).sort((a, b) => b.score - a.score)[0] || null,
    topMiss: [...archive].filter((item) => !item.correct).sort((a, b) => b.score - a.score)[0] || null,
  };
}
