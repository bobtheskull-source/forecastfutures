import { markForecastOutcome } from './outcome-tracker.js';

export function buildAccuracyArchive(review) {
  const outcomes = [
    { direction: 'up', label: 'Real world confirmed the move' },
    { direction: 'down', label: 'Signal overshot and reversed' },
    { direction: 'up', label: 'Event pressure kept building' },
    { direction: 'down', label: 'Market cooled after the headline' },
  ];

  return review.forecasts.map((forecast, index) => {
    const outcome = outcomes[index % outcomes.length];
    return markForecastOutcome(forecast, outcome);
  });
}
