export function loadSampleMarkets() {
  return [
    { id: 'inflation-cpi', title: 'CPI surprise next print', price: 42, move: 7, volume: 1200, event: 'BLS CPI release' },
    { id: 'fed-cut', title: 'Fed cuts at next meeting', price: 18, move: -11, volume: 980, event: 'FOMC decision' },
    { id: 'storm-track', title: 'Major storm makes landfall', price: 63, move: 9, volume: 540, event: 'Weather event' },
    { id: 'election-turnout', title: 'Turnout shock in swing state', price: 31, move: 5, volume: 860, event: 'Election result' },
    { id: 'ai-policy', title: 'Federal AI policy announced', price: 27, move: 13, volume: 430, event: 'Policy announcement' },
  ];
}
