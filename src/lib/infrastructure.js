import { readKalshiPrivateKey } from './kalshi-path.js';

export function loadServerSecrets() {
  const env = {
    apiKey: process.env.KALSHI_API_KEY || '',
    baseUrl: process.env.KALSHI_BASE_URL || 'https://api.elections.kalshi.com/trade-api/v2',
  };

  const { resolvedPath: resolvedKeyPath, privateKey } = readKalshiPrivateKey();

  return {
    ...env,
    privateKeyPath: resolvedKeyPath,
    hasPrivateKey: Boolean(privateKey),
    ready: Boolean(env.apiKey && privateKey),
  };
}

export function serverReadinessReport() {
  const secrets = loadServerSecrets();
  return {
    ready: secrets.ready,
    missing: [
      !secrets.apiKey ? 'KALSHI_API_KEY' : null,
      !secrets.hasPrivateKey ? 'private key file' : null,
    ].filter(Boolean),
    deploymentNotes: [
      'Keep Kalshi auth on the server side only.',
      'Rotate any exposed key before production use.',
      'Expose read-only market data to the mobile client.',
      'Use simple retry handling and rate limits on the server edge.',
      'Document the mobile/frontend Pages target separately from the API host.',
    ],
  };
}
