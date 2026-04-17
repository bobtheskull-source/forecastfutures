import { readKalshiPrivateKey } from './kalshi-path.js';

export function loadConfig() {
  const baseUrl = process.env.KALSHI_BASE_URL || 'https://api.kalshi.com';
  const apiKey = process.env.KALSHI_API_KEY || '';
  const { resolvedPath: privateKeyPath, privateKey } = readKalshiPrivateKey();

  return {
    baseUrl,
    apiKey,
    privateKeyPath,
    privateKeyPresent: Boolean(privateKey),
  };
}
