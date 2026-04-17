import test from 'node:test';
import assert from 'node:assert/strict';

import { buildShareText } from '../share.js';

test('buildShareText returns title and trade url', () => {
  const text = buildShareText({ title: 'CPI surprise next print', tradeUrl: 'https://kalshi.com/x' });
  assert.match(text, /CPI surprise next print/);
  assert.match(text, /https:\/\/kalshi\.com\/x/);
});
