'use strict';

// ── State ────────────────────────────────────────────────────────
const state = {
  currentStation: null,
  isPlaying: false,
  volume: 80,
  favorites: new Set(),
  favoritesData: {},
  topStations: [],
  eqBands: [0,0,0,0,0,0,0,0,0,0],
  sleepTimer: null,
  sleepRemaining: 0,
  searchDebounce: null,
  currentView: 'home',
};

// ── Audio ─────────────────────────────────────────────────────────
const audio = new Audio();
audio.volume = state.volume / 100;
audio.preload = 'none';

audio.addEventListener('playing', () => { state.isPlaying = true;  updatePlayBtn(); updateNPBar(); refreshCards(); });
audio.addEventListener('pause',   () => { state.isPlaying = false; updatePlayBtn(); });
audio.addEventListener('ended',   () => { state.isPlaying = false; updatePlayBtn(); });
audio.addEventListener('waiting', () => { document.getElementById('play-btn').classList.add('loading'); });
audio.addEventListener('canplay', () => { document.getElementById('play-btn').classList.remove('loading'); });
audio.addEventListener('error',   () => {
  state.isPlaying = false;
  updatePlayBtn();
  showStatus('Stream error — try another station');
});

// ── Helpers ───────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

// ── API ───────────────────────────────────────────────────────────
async function apiFetch(url) {
  setLoading(true);
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.statusText);
    return await r.json();
  } catch(e) {
    showStatus('Network error: ' + e.message);
    return [];
  } finally {
    setLoading(false);
  }
}

function setLoading(on) {
  $('loading-indicator').innerHTML = on
    ? '<span class="spinner"></span>'
    : '';
}

// ── Card builder ──────────────────────────────────────────────────
function makeCard(st, size = 'normal') {
  const uuid     = st.stationuuid;
  const isPlay   = state.currentStation?.stationuuid === uuid;
  const isFav    = state.favorites.has(uuid);
  const name     = (st.name || 'Unknown').trim();
  const country  = st.country || '';
  const genre    = (st.tags || '').split(',')[0].trim();
  const meta     = [country, genre].filter(Boolean).join(' · ');
  const favicon  = st.favicon || '';
  const bitrate  = st.bitrate ? st.bitrate + 'kbps' : '';
  const codec    = st.codec || '';
  const detail   = [codec, bitrate].filter(Boolean).join(' · ');

  const playIcon = isPlay && state.isPlaying ? '⏸' : '▶';

  return `
  <div class="card${isPlay ? ' playing' : ''}" data-uuid="${esc(uuid)}" ondblclick="App.playByUuid('${esc(uuid)}')">
    <button class="card-fav${isFav ? ' active' : ''}" data-uuid="${esc(uuid)}" title="${isFav ? 'Remove' : 'Save'}" onclick="event.stopPropagation(); App.toggleFav('${esc(uuid)}')">
      ${isFav ? '♥' : '♡'}
    </button>
    <div class="card-img-wrap">
      <div class="card-img" id="cimg-${esc(uuid)}">
        ${favicon
          ? `<img src="${esc(favicon)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='📻'">`
          : '📻'}
      </div>
      <button class="card-play-btn" onclick="event.stopPropagation(); App.playByUuid('${esc(uuid)}')" title="Play">${playIcon}</button>
    </div>
    <div class="card-name" title="${esc(name)}">${esc(name)}${isPlay ? '<span class="playing-bars"><span></span><span></span><span></span></span>' : ''}</div>
    <div class="card-meta">${esc(meta || detail || 'Radio Station')}</div>
  </div>`;
}

function makeQuickCard(st) {
  const uuid    = st.stationuuid;
  const isPlay  = state.currentStation?.stationuuid === uuid;
  const name    = (st.name || 'Unknown').trim();
  const favicon = st.favicon || '';
  const playIcon = isPlay && state.isPlaying ? '⏸' : '▶';

  return `
  <div class="quick-card${isPlay ? ' playing' : ''}" data-uuid="${esc(uuid)}" ondblclick="App.playByUuid('${esc(uuid)}')">
    <div class="quick-img" id="qimg-${esc(uuid)}">
      ${favicon
        ? `<img src="${esc(favicon)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='📻'">`
        : '📻'}
    </div>
    <span class="quick-name">${esc(name)}</span>
    <button class="quick-play-btn" onclick="event.stopPropagation(); App.playByUuid('${esc(uuid)}')">${playIcon}</button>
  </div>`;
}

// ── Station lookup ────────────────────────────────────────────────
function findStation(uuid) {
  return state.topStations.find(s => s.stationuuid === uuid)
      || state.favoritesData[uuid]
      || null;
}

// ── App namespace (called from HTML onclick) ──────────────────────
const App = {
  playByUuid(uuid) {
    const st = findStation(uuid);
    if (st) playStation(st);
  },

  toggleFav(uuid) {
    const st = findStation(uuid);
    if (st) toggleFavorite(st);
  },

  toggleCurrentFav() {
    if (state.currentStation) toggleFavorite(state.currentStation);
  },

  goHome() {
    showView('home');
    setNavActive('nav-home');
  },

  focusSearch() {
    $('search-input').focus();
    setNavActive('nav-search');
  },

  showFavorites() {
    showView('favs');
    setNavActive('nav-favs');
    renderFavGrid();
  },

  showAllTop() {
    $('section-title').textContent = 'Top Stations';
    $('station-count').textContent = state.topStations.length + ' stations';
    $('station-grid').innerHTML = state.topStations.map(s => makeCard(s)).join('');
    showView('all');
    setNavActive('nav-home');
  },
};

// ── Views ─────────────────────────────────────────────────────────
function showView(name) {
  ['home','all','search','favs'].forEach(v => {
    $(`view-${v}`).style.display = v === name ? '' : 'none';
  });
  state.currentView = name;
}

function setNavActive(id) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  $(id)?.classList.add('active');
}

// ── Home view ─────────────────────────────────────────────────────
async function loadHome() {
  $('greeting').textContent = greeting();
  const stations = await apiFetch('/api/top?limit=100');
  state.topStations = stations;

  // Quick picks: first 6
  $('quick-grid').innerHTML = stations.slice(0, 6).map(makeQuickCard).join('');
  // Featured grid: next 20
  $('featured-grid').innerHTML = stations.slice(0, 20).map(makeCard).join('');
}

// ── Search ────────────────────────────────────────────────────────
async function doSearch(q) {
  showView('search');
  setNavActive('nav-search');
  $('search-title').textContent = `Results for "${q}"`;
  const data = await apiFetch('/api/search?q=' + encodeURIComponent(q));
  state.topStations = [...state.topStations, ...data]; // merge for lookup
  $('search-count').textContent = data.length + ' stations';
  $('search-grid').innerHTML = data.length
    ? data.map(makeCard).join('')
    : '<div class="empty-state"><div class="icon">🔍</div><p>No results</p><span>Try a different search</span></div>';
}

// ── Favorites ─────────────────────────────────────────────────────
async function loadFavorites() {
  const data = await apiFetch('/api/favorites');
  state.favorites    = new Set(data.map(s => s.stationuuid));
  state.favoritesData = Object.fromEntries(data.map(s => [s.stationuuid, s]));
}

function renderFavGrid() {
  const data = Object.values(state.favoritesData);
  $('fav-count').textContent = data.length + ' saved';
  $('fav-grid').innerHTML = data.length
    ? data.map(makeCard).join('')
    : '<div class="empty-state"><div class="icon">💚</div><p>No saved stations yet</p><span>Click ♡ on any station to save it</span></div>';
}

async function toggleFavorite(station) {
  const uuid = station.stationuuid;
  if (state.favorites.has(uuid)) {
    await fetch('/api/favorites/' + uuid, { method: 'DELETE' });
    state.favorites.delete(uuid);
    delete state.favoritesData[uuid];
    showStatus('Removed from library');
  } else {
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(station),
    });
    state.favorites.add(uuid);
    state.favoritesData[uuid] = station;
    showStatus('Saved to Your Library ♥');
  }
  refreshCards();
  updateNPFavBtn();
  if (state.currentView === 'favs') renderFavGrid();
}

// ── Playback ──────────────────────────────────────────────────────
function playStation(station) {
  const url = station.url_resolved || station.url || '';
  if (!url) { showStatus('No stream URL'); return; }
  state.currentStation = station;
  audio.src = url;
  audio.load();
  audio.play().catch(() => showStatus('Click Play to start'));
  updateNPBar();
  document.title = (station.name || 'Radio Player') + ' — Radio Player';
  setHeroGradient(station);
}

function updateNPBar() {
  if (!state.currentStation) return;
  const st = state.currentStation;
  const name    = (st.name || 'Unknown').trim();
  const country = st.country || '';
  const genre   = (st.tags || '').split(',')[0].trim();

  $('np-name').textContent = name;
  $('np-meta').textContent = [country, genre].filter(Boolean).join('  ·  ');

  const favicon = st.favicon;
  $('np-favicon').innerHTML = favicon
    ? `<img src="${esc(favicon)}" alt="" onerror="this.parentElement.textContent='📻'">`
    : '📻';

  updateNPFavBtn();
}

function updateNPFavBtn() {
  const btn = $('np-fav-btn');
  const isFav = state.currentStation && state.favorites.has(state.currentStation.stationuuid);
  btn.textContent = isFav ? '♥' : '♡';
  btn.classList.toggle('active', !!isFav);
}

function updatePlayBtn() {
  $('play-btn').classList.remove('loading');
  $('play-btn').textContent = state.isPlaying ? '⏸' : '▶';
}

function refreshCards() {
  const uuid = state.currentStation?.stationuuid;
  // Update all card states without full re-render
  document.querySelectorAll('.card').forEach(card => {
    const isPlay = card.dataset.uuid === uuid;
    card.classList.toggle('playing', isPlay);
    const nameEl = card.querySelector('.card-name');
    if (!nameEl) return;
    // Remove old playing bars
    nameEl.querySelectorAll('.playing-bars').forEach(e => e.remove());
    if (isPlay && state.isPlaying) {
      nameEl.insertAdjacentHTML('beforeend', '<span class="playing-bars"><span></span><span></span><span></span></span>');
    }
    const playBtn = card.querySelector('.card-play-btn');
    if (playBtn) playBtn.textContent = (isPlay && state.isPlaying) ? '⏸' : '▶';
    const favBtn = card.querySelector('.card-fav');
    if (favBtn) {
      const fav = state.favorites.has(card.dataset.uuid);
      favBtn.classList.toggle('active', fav);
      favBtn.textContent = fav ? '♥' : '♡';
    }
  });
  document.querySelectorAll('.quick-card').forEach(card => {
    const isPlay = card.dataset.uuid === uuid;
    card.classList.toggle('playing', isPlay);
    const btn = card.querySelector('.quick-play-btn');
    if (btn) btn.textContent = (isPlay && state.isPlaying) ? '⏸' : '▶';
  });
}

// ── Hero gradient tint ────────────────────────────────────────────
function setHeroGradient(station) {
  // Rotate through a few accent colours based on station name hash
  const palettes = [
    '#3a1020','#0d2e3a','#1a2e0d','#2a1a3a','#3a2a0d','#0d1a3a','#3a0d2a'
  ];
  let hash = 0;
  for (const c of (station.name || '')) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  const colour = palettes[hash % palettes.length];
  $('main').style.setProperty('--hero-colour', colour);
  $('main').style.cssText += `--hero: ${colour}`;
  const before = document.querySelector('#main::before');
  $('main').style.background = `linear-gradient(180deg, ${colour}88 0%, var(--bg-base) 300px)`;
  setTimeout(() => { $('main').style.background = ''; }, 3000);
}

// ── Sidebar data ──────────────────────────────────────────────────
async function loadSidebarData() {
  const [countries, tags] = await Promise.all([
    apiFetch('/api/countries'),
    apiFetch('/api/tags'),
  ]);

  $('country-list').innerHTML = countries.map(c => `
    <div class="sidebar-item" data-country="${esc(c.name)}">
      <div class="sidebar-item-img">🌍</div>
      <div class="sidebar-item-info">
        <div class="sidebar-item-name">${esc(c.name)}</div>
        <div class="sidebar-item-sub">${c.stationcount} stations</div>
      </div>
    </div>`).join('');

  $('genre-list').innerHTML = tags.map(t => `
    <div class="sidebar-item" data-tag="${esc(t.name)}">
      <div class="sidebar-item-img">🎵</div>
      <div class="sidebar-item-info">
        <div class="sidebar-item-name">${esc(cap(t.name))}</div>
        <div class="sidebar-item-sub">${t.stationcount} stations</div>
      </div>
    </div>`).join('');

  $('country-list').querySelectorAll('.sidebar-item').forEach(el => {
    el.addEventListener('click', async () => {
      setSidebarActive(el);
      const country = el.dataset.country;
      $('section-title').textContent = '🌍 ' + country;
      const data = await apiFetch('/api/country/' + encodeURIComponent(country));
      state.topStations = [...state.topStations, ...data];
      $('station-count').textContent = data.length + ' stations';
      $('station-grid').innerHTML = data.map(makeCard).join('');
      showView('all');
    });
  });

  $('genre-list').querySelectorAll('.sidebar-item').forEach(el => {
    el.addEventListener('click', async () => {
      setSidebarActive(el);
      const tag = el.dataset.tag;
      $('section-title').textContent = '🎵 ' + cap(tag);
      const data = await apiFetch('/api/tag/' + encodeURIComponent(tag));
      state.topStations = [...state.topStations, ...data];
      $('station-count').textContent = data.length + ' stations';
      $('station-grid').innerHTML = data.map(makeCard).join('');
      showView('all');
    });
  });
}

function setSidebarActive(el) {
  document.querySelectorAll('.sidebar-item').forEach(e => e.classList.remove('active'));
  el.classList.add('active');
}

// ── EQ ────────────────────────────────────────────────────────────
const EQ_PRESETS = {
  'Flat':         [0,0,0,0,0,0,0,0,0,0],
  'Bass Boost':   [8,6,4,2,0,0,0,0,0,0],
  'Treble Boost': [0,0,0,0,0,2,4,6,8,8],
  'Rock':         [5,4,2,0,-1,-1,2,4,5,5],
  'Pop':          [-1,0,2,3,4,3,2,0,-1,-1],
  'Classical':    [4,3,2,1,0,0,-1,-2,-3,-3],
  'Jazz':         [3,2,0,2,4,4,3,2,1,0],
  'Electronic':   [6,5,0,-2,-2,2,4,5,6,6],
};
const EQ_LABELS = ['32','64','125','250','500','1k','2k','4k','8k','16k'];

function openEQModal() {
  buildEQ();
  $('eq-modal').classList.add('open');
}

function buildEQ() {
  const presetsHtml = Object.keys(EQ_PRESETS).map(n =>
    `<button class="preset-btn${n==='Flat'?' active':''}" onclick="applyPreset('${n}')">${n}</button>`
  ).join('');
  const bandsHtml = EQ_LABELS.map((lbl, i) => `
    <div class="eq-band">
      <div class="band-val" id="ev${i}">${state.eqBands[i]>0?'+':''}${state.eqBands[i]}</div>
      <input type="range" id="eb${i}" min="-12" max="12" step="1" value="${state.eqBands[i]}"
             oninput="onBand(${i},this.value)">
      <div class="band-label">${lbl}</div>
    </div>`).join('');
  $('eq-content').innerHTML = `<div class="eq-presets">${presetsHtml}</div><div class="eq-bands">${bandsHtml}</div>`;
}

function onBand(i, v) {
  state.eqBands[i] = +v;
  $(`ev${i}`).textContent = (+v>0?'+':'')+v;
}

function applyPreset(name) {
  const b = EQ_PRESETS[name] || EQ_PRESETS['Flat'];
  state.eqBands = [...b];
  b.forEach((v,i) => {
    const el = $(`eb${i}`); if (el) el.value = v;
    const ve = $(`ev${i}`); if (ve) ve.textContent = (v>0?'+':'')+v;
  });
  document.querySelectorAll('.preset-btn').forEach(btn =>
    btn.classList.toggle('active', btn.textContent === name));
}

// ── Sleep timer ───────────────────────────────────────────────────
function openTimerModal() { $('timer-modal').classList.add('open'); }

function startTimer() {
  const m = +($('custom-timer-input').value) || 0;
  clearTimer();
  if (!m) return;
  state.sleepRemaining = m * 60;
  state.sleepTimer = setInterval(() => {
    state.sleepRemaining--;
    const mm = Math.floor(state.sleepRemaining/60);
    const ss = state.sleepRemaining % 60;
    $('timer-display').textContent = `⏰ ${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
    $('timer-btn').classList.add('active');
    if (state.sleepRemaining <= 0) {
      clearTimer();
      audio.pause();
      state.isPlaying = false;
      updatePlayBtn();
      showStatus('Sleep timer: stopped');
    }
  }, 1000);
  $('timer-modal').classList.remove('open');
  showStatus(`Sleep timer: ${m} min`);
}

function clearTimer() {
  clearInterval(state.sleepTimer);
  state.sleepTimer = null;
  state.sleepRemaining = 0;
  $('timer-display').textContent = '';
  $('timer-btn').classList.remove('active');
}

// ── Volume ────────────────────────────────────────────────────────
function updateVolume(v) {
  state.volume = v;
  audio.volume = v / 100;
  $('vol-label').textContent = v + '%';
  $('vol-icon').textContent = v === 0 ? '🔇' : v < 40 ? '🔈' : v < 70 ? '🔉' : '🔊';
  $('vol-slider').style.setProperty('--vol-pct', v + '%');
}

// ── Status ────────────────────────────────────────────────────────
let _st;
function showStatus(msg) {
  const el = $('status-msg');
  el.textContent = msg; el.style.opacity = '1';
  clearTimeout(_st);
  _st = setTimeout(() => el.style.opacity = '0', 4000);
}

// ── Event bindings ────────────────────────────────────────────────
function bindEvents() {
  // Search
  $('search-input').addEventListener('input', () => {
    clearTimeout(state.searchDebounce);
    const q = $('search-input').value.trim();
    if (!q) { App.goHome(); return; }
    state.searchDebounce = setTimeout(() => doSearch(q), 450);
  });
  $('search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      clearTimeout(state.searchDebounce);
      const q = $('search-input').value.trim();
      if (q) doSearch(q); else App.goHome();
    }
  });

  // Play/Stop
  $('play-btn').addEventListener('click', () => {
    if (!state.currentStation) return;
    if (audio.paused) audio.play().catch(()=>{});
    else              audio.pause();
  });
  $('stop-btn').addEventListener('click', () => {
    audio.pause(); audio.src = '';
    state.isPlaying = false; state.currentStation = null;
    updatePlayBtn();
    $('np-name').textContent = 'Select a station to play';
    $('np-meta').textContent = '';
    $('np-stream-title').textContent = '';
    $('np-favicon').textContent = '📻';
    $('np-fav-btn').textContent = '♡';
    $('np-fav-btn').classList.remove('active');
    document.title = 'Radio Player';
    refreshCards();
  });

  // Volume
  $('vol-slider').addEventListener('input', e => updateVolume(+e.target.value));

  // EQ
  $('eq-apply').addEventListener('click', () => {
    $('eq-modal').classList.remove('open');
    showStatus('Equalizer applied');
  });
  $('eq-reset').addEventListener('click', () => applyPreset('Flat'));

  // Sleep timer
  $('timer-set').addEventListener('click', startTimer);
  $('timer-cancel').addEventListener('click', () => { clearTimer(); $('timer-modal').classList.remove('open'); });
  document.querySelectorAll('.timer-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.timer-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $('custom-timer-input').value = btn.dataset.min;
    });
  });

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
  });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { e.preventDefault(); $('play-btn').click(); }
    if (e.code === 'KeyS')  { $('stop-btn').click(); }
    if (e.code === 'KeyF' && state.currentStation) App.toggleCurrentFav();
  });
}

// ── Init ──────────────────────────────────────────────────────────
async function init() {
  updateVolume(state.volume);
  await loadFavorites();
  bindEvents();
  loadHome();
  loadSidebarData();
}

document.addEventListener('DOMContentLoaded', init);
