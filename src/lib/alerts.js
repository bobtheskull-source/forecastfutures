export const DEFAULT_ALERT_PREFS = {
  minEdgePercent: 4,
  confidenceFloor: 'medium',
  quietHoursStart: 22,
  quietHoursEnd: 7,
  cooldownMinutes: 30,
};

const CONF_RANK = { low: 1, medium: 2, high: 3 };

function inQuietHours(hour, start, end) {
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

export function mergeAlertPrefs(raw = {}) {
  return {
    ...DEFAULT_ALERT_PREFS,
    ...raw,
  };
}

export function isAlertEligible(signal, prefsInput = DEFAULT_ALERT_PREFS, now = new Date()) {
  const prefs = mergeAlertPrefs(prefsInput);
  const hour = now.getHours();
  if (inQuietHours(hour, Number(prefs.quietHoursStart), Number(prefs.quietHoursEnd))) return false;

  const edgePct = Math.abs(Number(signal.edge || 0)) * 100;
  if (edgePct < Number(prefs.minEdgePercent)) return false;

  const requiredConf = CONF_RANK[prefs.confidenceFloor] || 2;
  const signalConf = CONF_RANK[signal.confidence] || 1;
  return signalConf >= requiredConf;
}

export function filterEligibleAlerts(signals = [], prefs = DEFAULT_ALERT_PREFS, now = new Date()) {
  return signals.filter((signal) => isAlertEligible(signal, prefs, now));
}
