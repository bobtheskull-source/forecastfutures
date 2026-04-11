# Forecast Futures

Prediction forecasting app for Kalshi market moves and post-facto accuracy review.

## Goals
- Detect sudden outlier market moves
- Group them into forecastable themes
- Track what was predicted and what happened after the fact
- Show accuracy over time

## Current scaffold
- Node-based starter with sample market data
- Outlier detector and forecast review generator
- Secret-safe Kalshi config loader
- Fast local intake helper for mixed docs: `scripts/intake_markdown.py`
- Snapshot import path for offline backtests: `node src/index.js --snapshot ./path/to/file.json`
- Search/trend/archive layout designed for mobile-first Pages smoke tests

## Safety
- Keep secrets out of git
- Use server-side auth only
- Load `KALSHI_API_KEY` from env or `./secrets/kalshi_private_key.pem`
- Treat API keys as sensitive and rotate if exposed

## Local secret setup
1. Create `secrets/kalshi_private_key.pem`
2. Paste the private key into that file
3. Export `KALSHI_API_KEY` in your shell, or add it to a local `.env`
4. Run with:

```bash
export KALSHI_API_KEY='...'
export KALSHI_PRIVATE_KEY_PATH='./secrets/kalshi_private_key.pem'
npm run demo
```

To backtest without live credentials:

```bash
node src/index.js --snapshot ./samples/markets.json
```
