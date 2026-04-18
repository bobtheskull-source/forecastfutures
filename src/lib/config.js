import { readKalshiPrivateKey } from './kalshi-path.js';

function readEnv(...names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return '';
}

export function loadConfig() {
  const baseUrl = process.env.KALSHI_BASE_URL || 'https://api.elections.kalshi.com/trade-api/v2';
  const apiKey = readEnv('KALSHI_API_KEY', 'KALSHI_API_TOKEN');
  const { resolvedPath: privateKeyPath, privateKey } = readKalshiPrivateKey();

  return {
    baseUrl,
    apiKey,
    privateKeyPath,
    privateKeyPresent: Boolean(privateKey),
  };
}
