import { archiveSummary } from './archive-view.js';

export function renderApp({ markets, outliers, archive, rules = [], edgeCases = [], snapshotSource = 'using bundled sample markets', guardrails }) {
  const summary = archiveSummary(archive);
  const signalData = outliers.map((s) => ({
    ...s,
    marketProb: Number((s.marketProb ?? (s.price / 100)).toFixed(4)),
    modelProb: Number((s.modelProb ?? (s.price / 100)).toFixed(4)),
    edge: Number((s.edge ?? 0).toFixed(4)),
    confidenceInterval: [
      Number(Math.max(0, (s.modelProb ?? s.price / 100) - 0.12).toFixed(4)),
      Number(Math.min(1, (s.modelProb ?? s.price / 100) + 0.12).toFixed(4)),
    ],
    lastUpdated: s.updatedAt,
  }));

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
<title>Forecast Futures</title>
<style>
:root{color-scheme:dark;--bg:#08111f;--panel:#111a2e;--text:#eef2ff;--muted:#94a3b8;--accent:#60a5fa}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:linear-gradient(180deg,#08111f,#050814);color:var(--text)}
.app{max-width:980px;margin:0 auto;padding:16px;padding-bottom:92px}.hero,.card,.nav{background:rgba(17,26,46,.92);border:1px solid rgba(96,165,250,.16);border-radius:18px}
.hero{padding:18px;margin-bottom:14px}.grid{display:grid;gap:12px}.section{margin:14px 0}.section h2{margin:0 0 10px;font-size:1rem;color:#c7d2fe}
.card{padding:14px}.row{display:flex;justify-content:space-between;gap:10px;align-items:center}.pill,.chip{display:inline-flex;padding:4px 8px;border-radius:999px;background:#172554;color:#bfdbfe;font-size:.72rem;text-transform:uppercase;letter-spacing:.04em;border:1px solid rgba(148,163,184,.14)}
.chip{cursor:pointer}.muted{color:var(--muted);font-size:.88rem}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}.stat{padding:12px;border-radius:14px;background:#0f172a;border:1px solid rgba(148,163,184,.15)}
.nav{position:fixed;left:50%;transform:translateX(-50%);bottom:12px;width:min(980px,calc(100% - 24px));display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:8px;z-index:20}
.nav button{background:#0f172a;color:var(--text);border:1px solid rgba(148,163,184,.12);border-radius:14px;padding:12px 10px}.nav button.active{border-color:#60a5fa;box-shadow:0 0 0 1px rgba(96,165,250,.2) inset}
.view[hidden]{display:none}.state{padding:12px;border-radius:12px;border:1px dashed rgba(148,163,184,.35)}.drivers{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.driver{background:#0b2447;border:1px solid rgba(148,163,184,.2);border-radius:999px;padding:4px 8px;font-size:.75rem;color:#bfdbfe}.chart{width:100%;height:72px}
.actions{display:flex;gap:8px;margin-top:10px}.btn{border:1px solid rgba(148,163,184,.22);border-radius:10px;padding:10px 12px;background:#0f172a;color:#e2e8f0;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}
.btn.primary{border-color:rgba(34,197,94,.45);background:#052e1f;color:#bbf7d0}
@media (max-width:760px){.stats{grid-template-columns:repeat(2,1fr)}.nav{grid-template-columns:repeat(2,1fr)}}
</style>
</head>
<body>
<main class="app">
  <section class="hero">
    <div class="row"><div><div class="pill">Kalshi market radar</div><h1>Forecast Futures</h1></div><div class="pill">mobile-ready</div></div>
    <p class="muted">Flag big market moves, rank by edge and tradeability, inspect forecast confidence, and jump into trades fast.</p>
    <p class="muted">Snapshot: ${escapeHtml(snapshotSource)}</p>
    <div class="stats">
      <div class="stat"><strong>${markets.length}</strong><div class="muted">markets loaded</div></div>
      <div class="stat"><strong>${outliers.length}</strong><div class="muted">ranked opportunities</div></div>
      <div class="stat"><strong>${guardrails?.metrics?.staleDropCount ?? 0}</strong><div class="muted">stale suppressed</div></div>
      <div class="stat"><strong>${guardrails?.metrics?.p95LatencyMs ?? 0}ms</strong><div class="muted">signal p95 latency</div></div>
    </div>
  </section>

  <section class="view section" data-view="list">
    <h2>Forecast Futures list</h2>
    <div class="card">
      <div class="row" style="flex-wrap:wrap;gap:8px">
        <input id="marketSearch" aria-label="Search markets" placeholder="Search markets/events" style="flex:1;min-width:220px;padding:10px;border-radius:12px;border:1px solid rgba(148,163,184,.2);background:#0f172a;color:#eef2ff" />
        <button class="chip" data-sort="score">Sort: score</button>
        <button class="chip" data-sort="recency">Sort: recency</button>
        <button class="chip" data-sort="mostClicked">Sort: most clicked</button>
      </div>
    </div>
    <div id="listState" class="state" hidden></div>
    <div id="listResults" class="grid" style="margin-top:10px"></div>
    <div class="card" style="margin-top:12px"><strong>Most clicked (time-decay)</strong><div id="mostClicked" class="grid" style="margin-top:8px"></div></div>
  </section>

  <section class="view section" data-view="detail" hidden>
    <h2>Forecast detail</h2>
    <div id="detailState" class="state" hidden></div>
    <div id="detailPanel" class="card"></div>
  </section>

  <section class="view section" data-view="trends" hidden>
    <h2>Trend & latency guardrails</h2>
    <div class="grid">
      <article class="card"><strong>Latency metrics</strong><p class="muted">p50: ${guardrails?.metrics?.p50LatencyMs ?? 0}ms · p95: ${guardrails?.metrics?.p95LatencyMs ?? 0}ms</p></article>
      <article class="card"><strong>Stale suppression</strong><p class="muted">Dropped stale signals: ${guardrails?.metrics?.staleDropCount ?? 0}</p></article>
    </div>
    <div class="card" style="margin-top:12px"><strong>Move rules</strong><ul class="muted">${rules.map((r) => `<li>${escapeHtml(r.label)}: move >= ${r.minMove}, volume >= ${r.minVolume}, score floor ${r.scoreFloor}</li>`).join('')}</ul></div>
    <div class="card" style="margin-top:12px"><strong>Edge cases</strong><ul class="muted">${edgeCases.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul></div>
  </section>

  <section class="view section" data-view="archive" hidden>
    <h2>Archive</h2>
    <div class="grid">${archive.map((item) => `<article class="card"><div class="row"><strong>${escapeHtml(item.market)}</strong><span class="pill">${item.correct ? 'win' : 'miss'}</span></div><p>${escapeHtml(item.outcome.label)}</p><p class="muted">Forecast direction: ${escapeHtml(item.direction)} · Outcome: ${escapeHtml(item.outcome.direction)}</p></article>`).join('')}</div>
    <div class="card" style="margin-top:12px"><p class="muted">Correct: ${summary.wins} · Missed: ${summary.misses}</p></div>
  </section>
</main>

<nav class="nav" aria-label="Primary">
  <button class="active" data-tab="list">List</button>
  <button data-tab="detail">Detail</button>
  <button data-tab="trends">Trends</button>
  <button data-tab="archive">Archive</button>
</nav>

<script>
(function(){
  var data = ${JSON.stringify(signalData)};
  var telemetryKey = 'ff_clicks_v1';
  var visitorKey = 'ff_visitor_id';
  var halfLifeMs = 6 * 60 * 60 * 1000;
  var state = { query: '', sort: 'score', selectedId: data[0] ? data[0].id : null };

  var buttons = Array.from(document.querySelectorAll('.nav button'));
  var views = Array.from(document.querySelectorAll('.view'));
  var searchInput = document.getElementById('marketSearch');
  var listResults = document.getElementById('listResults');
  var listState = document.getElementById('listState');
  var detailPanel = document.getElementById('detailPanel');
  var detailState = document.getElementById('detailState');
  var mostClickedEl = document.getElementById('mostClicked');
  var sortChips = Array.from(document.querySelectorAll('[data-sort]'));

  function esc(v){return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');}

  function visitorId(){
    var id = localStorage.getItem(visitorKey);
    if(!id){id = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem(visitorKey,id);} 
    return id;
  }
  function loadTelemetry(){try{return JSON.parse(localStorage.getItem(telemetryKey)||'{}');}catch{return {};}}
  function saveTelemetry(x){localStorage.setItem(telemetryKey, JSON.stringify(x));}
  function recordClick(marketId){
    var payload = loadTelemetry();
    var id = visitorId();
    var now = Date.now();
    payload[marketId] = payload[marketId] || [];
    var hasRecent = payload[marketId].some(function(e){return e.visitor===id && (now-e.ts)<30*60*1000;});
    if(!hasRecent){ payload[marketId].push({ts:now, visitor:id}); }
    Object.keys(payload).forEach(function(k){payload[k]=payload[k].filter(function(e){return (now-e.ts)<7*24*60*60*1000;});});
    saveTelemetry(payload);
  }
  function decayScore(marketId){
    var payload = loadTelemetry();
    var now = Date.now();
    var entries = payload[marketId] || [];
    return entries.reduce(function(acc,e){return acc + Math.exp(-(now-e.ts)/halfLifeMs);},0);
  }

  function sortSignals(items){
    var list = items.slice();
    if(state.sort==='recency'){ return list.sort(function(a,b){return (a.freshnessSeconds||0)-(b.freshnessSeconds||0);}); }
    if(state.sort==='mostClicked'){ return list.sort(function(a,b){return decayScore(b.id)-decayScore(a.id);}); }
    return list.sort(function(a,b){return (b.rankScore||0)-(a.rankScore||0);});
  }

  function sparkline(points){
    if(!points || !points.length){ return '<div class="muted">No probability history.</div>'; }
    var min = Math.min.apply(null, points);
    var max = Math.max.apply(null, points);
    var span = Math.max(0.0001, max-min);
    var coords = points.map(function(p,i){
      var x = (i / ((points.length - 1) || 1)) * 100;
      var y = 100 - (((p-min)/span) * 100);
      return x.toFixed(2) + ',' + y.toFixed(2);
    }).join(' ');
    return '<svg class="chart" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline fill="none" stroke="#60a5fa" stroke-width="2" points="'+coords+'" /></svg>';
  }

  function signalCard(item){
    var edgePct = (item.edge * 100).toFixed(2);
    return '<article class="card" data-id="'+esc(item.id)+'">'
      + '<div class="row"><strong>'+esc(item.title)+'</strong><span class="pill">'+esc(item.confidence)+'</span></div>'
      + '<p class="muted">'+esc(item.event)+'</p>'
      + '<p class="muted">Move '+(item.move>0?'+':'')+item.move+' · Edge '+edgePct+'% · Freshness '+item.freshnessSeconds+'s</p>'
      + '<p class="muted">Score '+Number(item.rankScore||0).toFixed(2)+' · tradeable '+(item.isTradeable?'yes':'no')+'</p>'
      + '<p class="muted">Breakdown: edge '+item.scoreBreakdown.edge+', conf '+item.scoreBreakdown.confidence+', liq '+item.scoreBreakdown.liquidity+', spread '+item.scoreBreakdown.spreadQuality+', recency '+item.scoreBreakdown.recency+', penalty '+item.scoreBreakdown.tradeabilityPenalty+'</p>'
      + '<div class="actions">'
      + '<button class="btn" data-action="view" data-id="'+esc(item.id)+'">View detail</button>'
      + '<a class="btn primary" href="'+esc(item.tradeUrl||'#')+'" target="_blank" rel="noopener" data-action="trade" data-id="'+esc(item.id)+'">Open in Kalshi</a>'
      + '</div></article>';
  }

  function renderMostClicked(){
    var ranked = data.map(function(d){return Object.assign({}, d, {clickScore: decayScore(d.id)});})
      .sort(function(a,b){return b.clickScore-a.clickScore;}).slice(0,5);
    if(!ranked.some(function(r){return r.clickScore>0;})){
      mostClickedEl.innerHTML = '<div class="muted">No clicks yet. Open a few trades and this will populate.</div>';
      return;
    }
    mostClickedEl.innerHTML = ranked.map(function(item){
      return '<article class="card"><div class="row"><strong>'+esc(item.title)+'</strong><span class="pill">'+item.clickScore.toFixed(2)+'</span></div><p class="muted">Decay score (6h half-life): '+item.clickScore.toFixed(2)+'</p></article>';
    }).join('');
  }

  function renderList(){
    var q = String(state.query||'').toLowerCase();
    var filtered = data.filter(function(item){return !q || (item.title+' '+item.event).toLowerCase().includes(q);});
    var sorted = sortSignals(filtered);

    if(!data.length){ listState.hidden=false; listState.textContent='Loading opportunities...'; listResults.innerHTML=''; return; }
    if(!sorted.length){ listState.hidden=false; listState.textContent='No results match this search/filter.'; listResults.innerHTML=''; return; }

    listState.hidden = true;
    listResults.innerHTML = sorted.map(signalCard).join('');
  }

  function renderDetail(){
    var item = data.find(function(x){return x.id===state.selectedId;});
    if(!item){ detailState.hidden=false; detailState.textContent='Error: selected market not found.'; detailPanel.innerHTML=''; return; }
    detailState.hidden=true;
    var lo = item.confidenceInterval ? item.confidenceInterval[0] : 0;
    var hi = item.confidenceInterval ? item.confidenceInterval[1] : 0;
    var drivers = (item.scenarioDrivers||[]).map(function(d){return '<span class="driver">'+esc(d)+'</span>';}).join('');
    detailPanel.innerHTML = '<div class="row"><strong>'+esc(item.title)+'</strong><span class="pill">'+esc(item.confidence)+'</span></div>'
      + '<p class="muted">'+esc(item.event)+' · last updated '+esc(item.lastUpdated)+'</p>'
      + '<div class="row" style="margin-top:8px"><div>Market prob: <strong>'+(item.marketProb*100).toFixed(2)+'%</strong></div><div>Model prob: <strong>'+(item.modelProb*100).toFixed(2)+'%</strong></div></div>'
      + '<p class="muted">Confidence interval: '+(lo*100).toFixed(2)+'% to '+(hi*100).toFixed(2)+'%</p>'
      + sparkline(item.probabilityHistory || [])
      + '<div class="drivers">'+drivers+'</div>'
      + '<div class="actions"><a class="btn primary" href="'+esc(item.tradeUrl||'#')+'" target="_blank" rel="noopener" data-action="trade" data-id="'+esc(item.id)+'">Open in Kalshi</a></div>';
  }

  function show(tab){
    views.forEach(function(v){v.hidden = v.dataset.view !== tab;});
    buttons.forEach(function(b){b.classList.toggle('active', b.dataset.tab===tab);});
    history.replaceState(null,'','#'+tab);
  }

  buttons.forEach(function(button){button.addEventListener('click', function(){show(button.dataset.tab); if(button.dataset.tab==='detail') renderDetail();});});
  searchInput.addEventListener('input', function(e){state.query=e.target.value||''; renderList();});
  sortChips.forEach(function(chip){chip.addEventListener('click', function(){state.sort = chip.dataset.sort || 'score'; renderList();});});

  document.body.addEventListener('click', function(e){
    var target = e.target.closest('[data-action]');
    if(!target) return;
    var action = target.getAttribute('data-action');
    var id = target.getAttribute('data-id');
    if(action==='view'){ state.selectedId = id; show('detail'); renderDetail(); }
    if(action==='trade'){ recordClick(id); renderMostClicked(); }
  });

  renderList();
  renderMostClicked();
  renderDetail();
  var tab = location.hash.replace('#','');
  show(['list','detail','trends','archive'].includes(tab) ? tab : 'list');
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
