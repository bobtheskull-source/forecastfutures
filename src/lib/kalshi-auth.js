import fs from 'node:fs';
import path from 'node:path';

export function loadKalshiCredentials() {
  const apiKey = process.env.KALSHI_API_KEY || '';
  const privateKeyPath = process.env.KALSHI_PRIVATE_KEY_PATH || './secrets/kalshi_private_key.pem';
  const resolvedPath = path.resolve(process.cwd(), privateKeyPath);
  const privateKey = fs.existsSync(resolvedPath) ? fs.readFileSync(resolvedPath, 'utf8').trim() : '';

  return {
    apiKey,
    privateKeyPath: resolvedPath,
    privateKeySource: fs.existsSync(resolvedPath) ? 'file' : 'missing',
    hasPrivateKey: Boolean(privateKey),
  };
}

export function assertCredentialsPresent() {
  const creds = loadKalshiCredentials();
  const missing = [];
  if (!creds.apiKey) missing.push('KALSHI_API_KEY');
  if (!creds.hasPrivateKey) missing.push('KALSHI_PRIVATE_KEY_PATH/private key file');
  return { creds, missing };
}

export function secretHandlingNotes() {
  return [
    'Read auth from environment or a local secret file.',
    'Do not check keys into git.',
    'Rotate anything exposed before production use.',
  ];
}
