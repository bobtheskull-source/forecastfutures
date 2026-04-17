import test from 'node:test';
import assert from 'node:assert/strict';

import { loadConfig } from '../config.js';
import { loadKalshiCredentials, assertCredentialsPresent } from '../kalshi-auth.js';
import { loadServerSecrets, serverReadinessReport } from '../infrastructure.js';

const SECRET_PATH = '/home/adminhermes/.config/kalshi/private-api-key';

function withUnsetKalshiEnv(fn) {
  const snapshot = {
    KALSHI_API_KEY: process.env.KALSHI_API_KEY,
    KALSHI_PRIVATE_KEY_PATH: process.env.KALSHI_PRIVATE_KEY_PATH,
    KALSHI_BASE_URL: process.env.KALSHI_BASE_URL,
  };
  delete process.env.KALSHI_API_KEY;
  delete process.env.KALSHI_PRIVATE_KEY_PATH;
  delete process.env.KALSHI_BASE_URL;
  try {
    return fn();
  } finally {
    for (const [key, value] of Object.entries(snapshot)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('kalshi config auto-detects the provided private key path when env is unset', () => {
  withUnsetKalshiEnv(() => {
    const creds = loadKalshiCredentials();
    const config = loadConfig();
    const secrets = loadServerSecrets();
    const readiness = serverReadinessReport();
    const missing = assertCredentialsPresent().missing;

    assert.equal(creds.privateKeyPath, SECRET_PATH);
    assert.equal(creds.hasPrivateKey, true);
    assert.equal(config.privateKeyPath, SECRET_PATH);
    assert.equal(config.privateKeyPresent, true);
    assert.equal(secrets.privateKeyPath, SECRET_PATH);
    assert.equal(secrets.hasPrivateKey, true);
    assert.equal(readiness.ready, false);
    assert.ok(missing.includes('KALSHI_API_KEY'));
    assert.ok(!missing.includes('KALSHI_PRIVATE_KEY_PATH/private key file'));
  });
});
