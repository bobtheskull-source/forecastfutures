import { classifyMove } from './rules.js';
import { explainSignal, rankSignal } from './explanations.js';
import { rankOpportunities } from './ranking.js';

export function detectOutliers(markets) {
  const now = Date.now();

  const enriched = markets
    .map((market) => {
      const classification = classifyMove(market);
      const direction = market.move > 0 ? 'up' : 'down';
      const updatedAt = market.updatedAt || new Date().toISOString();
      const freshnessSeconds = Math.max(0, Math.floor((now - new Date(updatedAt).getTime()) / 1000));

      return {
        ...market,
        score: classification.score,
        direction,
        rank: rankSignal(market),
        reason: explainSignal(market),
        confidence: classification.confidence,
        edgeCase: classification.edgeCase,
        freshnessSeconds,
      };
    })
    .filter((market) => market.score >= 15);

  return rankOpportunities(enriched);
}
