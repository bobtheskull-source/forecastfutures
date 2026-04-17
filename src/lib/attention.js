export function attentionVsAlpha({ edge = 0, risingScore = 0 } = {}) {
  const edgePct = Math.abs(Number(edge || 0)) * 100;
  const attention = Number(risingScore || 0);

  if (attention >= 1.5 && edgePct < 4) {
    return { label: 'Attention > Alpha', severity: 'warn' };
  }
  if (attention >= 1.5 && edgePct >= 4) {
    return { label: 'Attention + Alpha', severity: 'ok' };
  }
  return { label: 'Low attention', severity: 'muted' };
}
