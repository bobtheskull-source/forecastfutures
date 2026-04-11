export function buildForecastReview(outliers) {
  return {
    generatedAt: new Date().toISOString(),
    count: outliers.length,
    forecasts: outliers.map((item) => ({
      market: item.title,
      event: item.event,
      direction: item.direction,
      score: Number(item.score.toFixed(2)),
      thesis: `Large ${item.direction} move with elevated volume suggests the market is pricing in a real catalyst.`,
      postMortem: 'Fill this in after the event resolves to compare the forecast with the outcome.',
    })),
  };
}
