export function buildForecastReview(outliers) {
  return {
    generatedAt: new Date().toISOString(),
    count: outliers.length,
    forecasts: outliers.map((item) => ({
      id: item.id,
      market: item.title,
      event: item.event,
      direction: item.direction,
      score: Number(item.rankScore?.toFixed(2) ?? item.score.toFixed(2)),
      thesis: `Large ${item.direction} move with market/model edge ${((item.edge || 0) * 100).toFixed(2)}% and ${item.confidence} confidence.`,
      postMortem: 'Fill this in after the event resolves to compare the forecast with the outcome.',
    })),
  };
}
