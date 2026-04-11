export function markForecastOutcome(forecast, outcome) {
  const correct = forecast.direction === outcome.direction;
  return {
    ...forecast,
    outcome,
    correct,
    accuracyLabel: correct ? 'correct' : 'missed',
  };
}
