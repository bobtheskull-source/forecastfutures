import fs from 'node:fs';
import path from 'node:path';

export function loadConfig() {
  const baseUrl = process.env.KALSHI_BASE_URL || 'https://api.kalshi.com';
  const apiKey = process.env.KALSHI_API_KEY || '';
  const privateKeyPath = process.env.KALSHI_PRIVATE_KEY_PATH || './secrets/kalshi_private_key.pem';
  const resolvedKeyPath = path.resolve(process.cwd(), privateKeyPath);
  const privateKey = fs.existsSync(resolvedKeyPath) ? fs.readFileSync(resolvedKeyPath, 'utf8').trim() : '';

  return {
    baseUrl,
    apiKey,
    privateKeyPath: resolvedKeyPath,
    privateKeyPresent: Boolean(privateKey),
  };
}
