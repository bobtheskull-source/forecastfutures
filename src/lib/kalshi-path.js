import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_KALSHI_PRIVATE_KEY_PATH = '/home/adminhermes/.config/kalshi/private-api-key';
export const FALLBACK_KALSHI_PRIVATE_KEY_PATH = './secrets/kalshi_private_key.pem';

export function resolveKalshiPrivateKeyPath() {
  const configured = process.env.KALSHI_PRIVATE_KEY_PATH?.trim();
  if (configured) {
    return path.resolve(process.cwd(), configured);
  }

  const preferred = path.resolve(DEFAULT_KALSHI_PRIVATE_KEY_PATH);
  if (fs.existsSync(preferred)) {
    return preferred;
  }

  return path.resolve(process.cwd(), FALLBACK_KALSHI_PRIVATE_KEY_PATH);
}

export function readKalshiPrivateKey() {
  const resolvedPath = resolveKalshiPrivateKeyPath();
  return {
    resolvedPath,
    privateKey: fs.existsSync(resolvedPath) ? fs.readFileSync(resolvedPath, 'utf8').trim() : '',
  };
}