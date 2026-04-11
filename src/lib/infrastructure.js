import fs from 'node:fs';
import path from 'node:path';

export function loadServerSecrets() {
  const env = {
    apiKey: process.env.KALSHI_API_KEY || '',
    privateKeyPath: process.env.KALSHI_PRIVATE_KEY_PATH || './secrets/kalshi_private_key.pem',
    baseUrl: process.env.KALSHI_BASE_URL || 'https://api.kalshi.com',
  };

  const resolvedKeyPath = path.resolve(process.cwd(), env.privateKeyPath);
  const privateKey = fs.existsSync(resolvedKeyPath) ? fs.readFileSync(resolvedKeyPath, 'utf8').trim() : '';

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
