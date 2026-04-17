export function loadSampleMarkets() {
  const now = Date.now();
  const at = (minsAgo) => new Date(now - minsAgo * 60_000).toISOString();

  return [
    {
      id: 'inflation-cpi',
      title: 'CPI surprise next print',
      price: 42,
      move: 7,
      volume: 1200,
      depth: 820,
      spread: 0.028,
      event: 'BLS CPI release',
      updatedAt: at(6),
      scenarioDrivers: ['Energy print drift', 'Shelter stickiness', 'Core goods rebound'],
      probabilityHistory: [0.31, 0.34, 0.37, 0.39, 0.42],
      tradeUrl: 'https://kalshi.com/markets/kxcpinext/cpi-next-print'
    },
    {
      id: 'fed-cut',
      title: 'Fed cuts at next meeting',
      price: 18,
      move: -11,
      volume: 980,
      depth: 560,
      spread: 0.036,
      event: 'FOMC decision',
      updatedAt: at(4),
      scenarioDrivers: ['Payroll cooling', 'Services disinflation', 'Forward-guidance pivot'],
      probabilityHistory: [0.34, 0.30, 0.27, 0.22, 0.18],
      tradeUrl: 'https://kalshi.com/markets/kxfedcut/fed-rate-cut-next-meeting'
    },
    {
      id: 'storm-track',
      title: 'Major storm makes landfall',
      price: 63,
      move: 9,
      volume: 540,
      depth: 310,
      spread: 0.055,
      event: 'Weather event',
      updatedAt: at(11),
      scenarioDrivers: ['Track confidence', 'Sea-surface heat', 'Late-cycle intensification'],
      probabilityHistory: [0.47, 0.51, 0.56, 0.60, 0.63],
      tradeUrl: 'https://kalshi.com/markets/kxstorm/major-storm-landfall'
    },
    {
      id: 'election-turnout',
      title: 'Turnout shock in swing state',
      price: 31,
      move: 5,
      volume: 860,
      depth: 610,
      spread: 0.041,
      event: 'Election result',
      updatedAt: at(17),
      scenarioDrivers: ['Mail-ballot velocity', 'Early-vote partisan split', 'Campus turnout'],
      probabilityHistory: [0.25, 0.27, 0.28, 0.30, 0.31],
      tradeUrl: 'https://kalshi.com/markets/kxturnout/swing-state-turnout-shock'
    },
    {
      id: 'ai-policy',
      title: 'Federal AI policy announced',
      price: 27,
      move: 13,
      volume: 430,
      depth: 210,
      spread: 0.069,
      event: 'Policy announcement',
      updatedAt: at(2),
      scenarioDrivers: ['Hill calendar', 'Agency leak chatter', 'Executive order timing'],
      probabilityHistory: [0.12, 0.15, 0.19, 0.23, 0.27],
      tradeUrl: 'https://kalshi.com/markets/kxaipolicy/federal-ai-policy-announced'
    }
  ];
}
