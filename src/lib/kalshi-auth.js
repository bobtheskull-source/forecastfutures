import { readKalshiPrivateKey } from './kalshi-path.js';

export function loadKalshiCredentials() {
  const apiKey = process.env.KALSHI_API_KEY || '';
  const { resolvedPath, privateKey } = readKalshiPrivateKey();

  return {
    apiKey,
    privateKeyPath: resolvedPath,
    privateKeySource: privateKey ? 'file' : 'missing',
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
