import { archiveSummary } from './archive-view.js';
import { filterMarkets, sortMarkets } from './filters.js';

export function renderApp({ markets, outliers, review, archive, infra, rules = [], edgeCases = [], snapshotSource = 'using bundled sample markets' }) {
  const topQuery = outliers[0]?.title ?? '';
  const summary = archiveSummary(archive);
  const sortedSignals = sortMarkets(outliers, 'score');
  const renderSignalItems = (items) => items.map((m) => `
    <article class="card signal-card" data-title="${escapeHtml(m.title)}" data-event="${escapeHtml(m.event)}" data-rank="${escapeHtml(m.rank)}" data-confidence="${escapeHtml(m.confidence)}">
      <div class="row"><strong>${escapeHtml(m.title)}</strong><span class="pill">${m.direction.toUpperCase()}</span></div>
      <p>${escapeHtml(m.event)}</p>
      <p class="muted">Move ${m.move > 0 ? '+' : ''}${m.move} · score ${m.score.toFixed(2)} · rank ${m.rank}</p>
      <p class="muted">Why it matters: ${escapeHtml(m.reason)}</p>
    </article>`).join('');

  const renderForecastItems = () => review.forecasts.map((f, i) => `
    <article class="card forecast-card">
      <div class="row"><strong>#${i + 1} ${escapeHtml(f.market)}</strong><span class="pill">${escapeHtml(f.direction)}</span></div>
      <p>${escapeHtml(f.thesis)}</p>
      <p class="muted">Outcome note: ${escapeHtml(f.postMortem)}</p>
    </article>`).join('');

  const archiveCards = (items = archive) => items.map((item) => `
    <article class="card archive-card">
      <div class="row"><strong>${escapeHtml(item.market)}</strong><span class="pill">${item.correct ? 'win' : 'miss'}</span></div>
      <p>${escapeHtml(item.outcome.label)}</p>
      <p class="muted">Forecast direction: ${escapeHtml(item.direction)} · Outcome: ${escapeHtml(item.outcome.direction)}</p>
      <p class="muted">Accuracy label: ${escapeHtml(item.accuracyLabel)} · Forecast stays readable after the result lands.</p>
    </article>`).join('');

  const heroSearch = `
      <div class="card" style="margin-top:12px">
        <strong>Search</strong>
        <input id="marketSearch" aria-label="Search markets" value="" placeholder="Search markets, events, ranks..." style="width:100%;margin-top:8px;padding:12px;border-radius:12px;border:1px solid rgba(148,163,184,.2);background:#0f172a;color:#eef2ff" />
        <div class="row" style="margin-top:10px;flex-wrap:wrap;gap:8px">
          <button class="chip" data-direction="all">All</button>
          <button class="chip" data-direction="up">Up</button>
          <button class="chip" data-direction="down">Down</button>
          <button class="chip" data-rank="A">Rank A</button>
          <button class="chip" data-rank="B">Rank B</button>
          <button class="chip" data-sort="score">Top score</button>
          <button class="chip" data-sort="move">Largest move</button>
          <button class="chip" data-sort="volume">Most volume</button>
        </div>
        <p class="muted" id="searchCount">Start here with the hottest mover, then drill into the wall and archive below.</p>
      </div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
<title>Forecast Futures</title>
<style>
  :root { color-scheme: dark; --bg:#08111f; --panel:#111a2e; --text:#eef2ff; --muted:#94a3b8; --accent:#60a5fa; }
  * { box-sizing:border-box; }
  body { margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:linear-gradient(180deg,#08111f,#050814); color:var(--text); }
  .app { max-width: 980px; margin:0 auto; padding:16px; padding-bottom:92px; }
  .hero, .card, .nav { background:rgba(17,26,46,.92); border:1px solid rgba(96,165,250,.16); border-radius:18px; }
  .hero { padding:18px; margin-bottom:14px; }
  .grid { display:grid; gap:12px; }
  .section { margin:14px 0; }
  .section h2 { margin:0 0 10px; font-size:1rem; color:#c7d2fe; }
  .card { padding:14px; }
  .row { display:flex; justify-content:space-between; gap:10px; align-items:center; }
  .pill, .chip { display:inline-flex; padding:4px 8px; border-radius:999px; background:#172554; color:#bfdbfe; font-size:.72rem; text-transform:uppercase; letter-spacing:.04em; border:1px solid rgba(148,163,184,.14); }
  .chip { cursor:pointer; }
  .muted { color:var(--muted); font-size:.88rem; }
  .stats { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:12px; }
  .stat { padding:12px; border-radius:14px; background:#0f172a; border:1px solid rgba(148,163,184,.15); }
  .nav { position:fixed; left:50%; transform:translateX(-50%); bottom:12px; width:min(980px,calc(100% - 24px)); display:grid; grid-template-columns:repeat(3,1fr); gap:8px; padding:8px; z-index:20; }
  .nav button { background:#0f172a; color:var(--text); border:1px solid rgba(148,163,184,.12); border-radius:14px; padding:12px 10px; }
  .nav button.active { border-color:#60a5fa; box-shadow:0 0 0 1px rgba(96,165,250,.2) inset; }
  .view[hidden] { display:none; }
  @media (max-width: 640px) { .stats { grid-template-columns:1fr; } }
</style>
</head>
<body>
  <main class="app">
    <section class="hero">
      <div class="row"><div><div class="pill">Kalshi market radar</div><h1>Forecast Futures</h1></div><div class="pill">mobile-ready</div></div>
      <p class="muted">Search unusual market moves, spotlight trend spikes, and track whether the forecast aged like wisdom or milk.</p>
      <p class="muted">Snapshot: ${escapeHtml(snapshotSource)}</p>
      ${heroSearch}
      <div class="stats">
        <div class="stat"><strong>${markets.length}</strong><div class="muted">markets loaded</div></div>
        <div class="stat"><strong>${outliers.length}</strong><div class="muted">unusual movers</div></div>
        <div class="stat"><strong>${review.forecasts.length}</strong><div class="muted">forecast cards</div></div>
      </div>
    </section>

    <section class="view section" data-view="search">
      <h2>Search</h2>
      <div id="searchResults" class="grid">${renderSignalItems(sortedSignals)}</div>
    </section>

    <section class="view section" data-view="trends" hidden>
      <h2>Trend Wall</h2>
      <div id="trendResults" class="grid">${renderSignalItems(sortedSignals)}</div>
    </section>

    <section class="view section" data-view="archive" hidden>
      <h2>Archive</h2>
      <div id="archiveResults" class="grid">${archiveCards()}</div>
      <div class="card" style="margin-top:12px">
        <p class="muted">Correct: ${summary.wins} · Missed: ${summary.misses}</p>
        <p class="muted">Biggest win: ${summary.topWin ? escapeHtml(summary.topWin.market) : 'n/a'} · Biggest miss: ${summary.topMiss ? escapeHtml(summary.topMiss.market) : 'n/a'}</p>
        <p class="muted">Past forecasts stay readable, and the outcome label sits beside the forecast so scanning is quick.</p>
      </div>
    </section>

    <section class="section">
      <h2>Source ranking</h2>
      <div class="grid">${sortedSignals.map((item) => `
        <article class="card">
          <div class="row"><strong>${escapeHtml(item.title)}</strong><span class="pill">${escapeHtml(item.rank)}</span></div>
          <p class="muted">Why: ${escapeHtml(item.reason)}</p>
          <p class="muted">Signal tier: ${escapeHtml(item.confidence)} · score ${item.score.toFixed(2)}</p>
        </article>`).join('')}</div>
    </section>

    <section class="section">
      <h2>Move rules</h2>
      <div class="grid">${rules.map((rule) => `
        <article class="card">
          <div class="row"><strong>${escapeHtml(rule.label)}</strong><span class="pill">${rule.confidence ?? 'rule'}</span></div>
          <p class="muted">min move ${rule.minMove} · min volume ${rule.minVolume} · score floor ${rule.scoreFloor}</p>
        </article>`).join('')}</div>
      <div class="card" style="margin-top:12px">
        <strong>Edge cases</strong>
        <ul class="muted">${edgeCases.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </div>
    </section>

    <section class="section">
      <h2>Accuracy archive</h2>
      <div class="grid">${archiveCards()}</div>
    </section>
  </main>

  <nav class="nav" aria-label="Primary">
    <button class="active" data-tab="search">Search</button>
    <button data-tab="trends">Trend Wall</button>
    <button data-tab="archive">Archive</button>
  </nav>

  <script>
    (() => {
      const buttons = Array.from(document.querySelectorAll('.nav button'));
      const views = Array.from(document.querySelectorAll('.view'));
      const input = document.getElementById('marketSearch');
      const searchResults = document.getElementById('searchResults');
      const trendResults = document.getElementById('trendResults');
      const archiveResults = document.getElementById('archiveResults');
      const searchCount = document.getElementById('searchCount');
      const buttonsChip = Array.from(document.querySelectorAll('.chip'));
      const baseSignals = ${JSON.stringify(sortedSignals)};
      const archive = ${JSON.stringify(archive)};
      let state = { query: '', direction: 'all', rank: '', sort: 'score' };

      const signalCard = (item) => {
        const article = document.createElement('article');
        article.className = 'card signal-card';
        article.dataset.title = item.title;
        article.dataset.event = item.event;
        article.dataset.rank = item.rank;
        article.dataset.confidence = item.confidence;
        article.innerHTML = '<div class="row"><strong>' + escapeHtml(item.title) + '</strong><span class="pill">' + escapeHtml(item.direction.toUpperCase()) + '</span></div>' +
          '<p class="muted">' + escapeHtml(item.event) + '</p>' +
          '<p>' + escapeHtml(item.reason) + '</p>' +
          '<p class="muted">Confidence ' + escapeHtml(item.confidence) + ' · move ' + (item.move > 0 ? '+' : '') + item.move + ' · volume ' + item.volume + '</p>';
        return article;
      };

      const archiveCard = (item) => {
        const article = document.createElement('article');
        article.className = 'card archive-card';
        article.innerHTML = '<div class="row"><strong>' + escapeHtml(item.market) + '</strong><span class="pill">' + (item.correct ? 'win' : 'miss') + '</span></div>' +
          '<p>' + escapeHtml(item.outcome.label) + '</p>' +
          '<p class="muted">Forecast direction: ' + escapeHtml(item.direction) + ' · Outcome: ' + escapeHtml(item.outcome.direction) + '</p>' +
          '<p class="muted">Accuracy label: ' + escapeHtml(item.accuracyLabel) + ' · Forecast stays readable after the result lands.</p>';
        return article;
      };

      const renderSignals = () => {
        const items = baseSignals.filter((item) => {
          const q = state.query.toLowerCase();
          const matchesQuery = !q || [item.title, item.event, item.reason, item.rank, item.confidence].join(' ').toLowerCase().includes(q);
          const directionOk = state.direction === 'all' || item.direction === state.direction;
          const rankOk = !state.rank || item.rank === state.rank;
          return matchesQuery && directionOk && rankOk;
        }).sort((a,b) => {
          if (state.sort === 'move') return Math.abs(b.move) - Math.abs(a.move);
          if (state.sort === 'volume') return b.volume - a.volume;
          return b.score - a.score;
        });
        const cards = items.map(signalCard);
        searchResults.replaceChildren(...cards.map((node) => node.cloneNode(true)));
        trendResults.replaceChildren(...cards.map((node) => node.cloneNode(true)));
        searchCount.textContent = items.length ? items.length + ' matching signals, sorted by ' + state.sort + '.' : 'No matches, try a broader query or reset filters.';
      };
      archiveResults.replaceChildren(...archive.map(archiveCard));
      const show = (tab) => {
        views.forEach((view) => { view.hidden = view.dataset.view !== tab; });
        buttons.forEach((button) => button.classList.toggle('active', button.dataset.tab === tab));
        history.replaceState(null, '', '#' + tab);
      };
      buttons.forEach((button) => button.addEventListener('click', () => { show(button.dataset.tab); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
      input.addEventListener('input', (e) => { state.query = e.target.value || ''; renderSignals(); });
      buttonsChip.forEach((chip) => chip.addEventListener('click', () => {
        if (chip.dataset.direction) state.direction = chip.dataset.direction;
        if (chip.dataset.rank) state.rank = chip.dataset.rank;
        if (chip.dataset.sort) state.sort = chip.dataset.sort;
        renderSignals();
      }));
      show(['search','trends','archive'].includes(location.hash.replace('#', '')) ? location.hash.replace('#', '') : 'search');
      renderSignals();
    })();
  </script>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
