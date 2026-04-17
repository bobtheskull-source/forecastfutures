export function summarizeFunnel(events = []) {
  const counts = { listImpressions: 0, pretradeOpens: 0, tradeClicks: 0, paywallViews: 0, trialsStarted: 0 };
  for (const event of events) {
    if (Object.hasOwn(counts, event.type)) counts[event.type] += 1;
  }
  const ctr = counts.listImpressions ? counts.tradeClicks / counts.listImpressions : 0;
  const pretradeRate = counts.listImpressions ? counts.pretradeOpens / counts.listImpressions : 0;
  const paywallConversion = counts.paywallViews ? counts.trialsStarted / counts.paywallViews : 0;
  return {
    ...counts,
    ctr: Number(ctr.toFixed(4)),
    pretradeRate: Number(pretradeRate.toFixed(4)),
    paywallConversion: Number(paywallConversion.toFixed(4)),
  };
}

export function pickPaywallVariant(visitorId = '') {
  const id = String(visitorId || 'anon');
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) % 997;
  return hash % 2 === 0 ? 'A' : 'B';
}
