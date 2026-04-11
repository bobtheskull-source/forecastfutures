import { classifyMove } from './rules.js';
import { explainSignal, rankSignal } from './explanations.js';

export function detectOutliers(markets) {
  return markets
    .map((market) => {
      const classification = classifyMove(market);
      const direction = market.move > 0 ? 'up' : 'down';
      return {
        ...market,
        score: classification.score,
        direction,
        rank: rankSignal(market),
        reason: explainSignal(market),
        confidence: classification.confidence,
        edgeCase: classification.edgeCase,
      };
    })
    .filter((market) => market.score >= 15)
    .sort((a, b) => b.score - a.score);
}
