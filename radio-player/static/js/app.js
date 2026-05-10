'use strict';

// ── State ────────────────────────────────────────────────────────
const state = {
  stations: [],
  currentStation: null,
  favorites: new Set(),     // stationuuids
  favoritesData: {},        // uuid -> station object
  isPlaying: false,
  volume: 80,
  eqBands: [0,0,0,0,0,0,0,0,0,0],
  sleepTimer: null,
  sleepRemaining: 0,
  searchDebounce: null,
  activeSection: 'top',
  activeSideItem: null,
};

// ── Audio ────────────────────────────────────────────────────────
const audio = new Audio();
audio.volume = state.volume / 100;
audio.preload = 'none';

// ICY metadata via fetch (best-effort)
let metadataInterval = null;

audio.addEventListener('playing', () => {
  state.isPlaying = true;
  updatePlayBtn();
  updateNowPlayingBar();
});
audio.addEventListener('pause',  () => { state.isPlaying = false; updatePlayBtn(); });
audio.addEventListener('ended',  () => { state.isPlaying = false; updatePlayBtn(); });
audio.addEventListener('error',  () => {
  state.isPlaying = false;
  updatePlayBtn();
  showStatus('Stream error — try another station');
});
audio.addEventListener('waiting', () => {
  document.getElementById('play-btn').classList.add('loading');
});
audio.addEventListener('canplay', () => {
  document.getElementById('play-btn').classList.remove('loading');
});

// ── DOM refs ─────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const stationList   = $('station-list');
const sectionTitle  = $('section-title');
const stationCount  = $('station-count');
const loadingEl     = $('loading-indicator');
const searchInput   = $('search-input');
const npFavicon     = $('np-favicon');
const npName        = $('np-name');
const npMeta        = $('np-meta');
const npStreamTitle = $('np-stream-title');
const playBtn       = $('play-btn');
const volSlider     = $('vol-slider');
const volLabel      = $('vol-label');
const timerDisplay  = $('timer-display');

// ── Init ─────────────────────────────────────────────────────────
async function init() {
  volSlider.value = state.volume;
  volLabel.textContent = state.volume + '%';
  await loadFavorites();
  loadTop();
  loadSidebarData();
  bindEvents();
}

// ── API helpers ───────────────────────────────────────────────────
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
  loadingEl.innerHTML = on
    ? '<span class="spinner"></span> Loading…'
    : '';
}

// ── Load stations ─────────────────────────────────────────────────
async function loadTop() {
  sectionTitle.textContent = 'Top Stations';
  state.activeSection = 'top';
  const data = await apiFetch('/api/top?limit=100');
  renderStations(data);
}

async function loadSearch(q) {
  sectionTitle.textContent = `Search: "${q}"`;
  state.activeSection = 'search';
  const data = await apiFetch('/api/search?q=' + encodeURIComponent(q));
  renderStations(data);
}

async function loadCountry(country) {
  sectionTitle.textContent = 'Country: ' + country;
  state.activeSection = 'country:' + country;
  const data = await apiFetch('/api/country/' + encodeURIComponent(country));
  renderStations(data);
}

async function loadTag(tag) {
  sectionTitle.textContent = 'Genre: ' + capitalize(tag);
  state.activeSection = 'tag:' + tag;
  const data = await apiFetch('/api/tag/' + encodeURIComponent(tag));
  renderStations(data);
}

function loadFavoritesTab() {
  sectionTitle.textContent = 'Favorites';
  state.activeSection = 'favorites';
  const data = Object.values(state.favoritesData);
  renderStations(data);
  stationCount.textContent = data.length + ' stations';
}

// ── Render stations ───────────────────────────────────────────────
function renderStations(stations) {
  state.stations = stations;
  stationCount.textContent = stations.length + ' stations';

  if (!stations.length) {
    stationList.innerHTML = `
      <div class="empty-state">
        <div class="icon">📻</div>
        <p>No stations found</p>
      </div>`;
    return;
  }

  stationList.innerHTML = stations.map((st, i) => {
    const isPlaying = state.currentStation?.stationuuid === st.stationuuid;
    const isFav = state.favorites.has(st.stationuuid);
    const name = (st.name || 'Unknown').trim();
    const country = st.country || '';
    const tags = st.tags || '';
    const genre = tags.split(',')[0].trim();
    const metaParts = [country, genre].filter(Boolean);
    const bitrate = st.bitrate ? st.bitrate + 'k' : '';
    const favicon = st.favicon || '';

    return `<div class="station-item${isPlaying ? ' playing' : ''}" data-idx="${i}" data-uuid="${st.stationuuid}">
      <div class="station-favicon" id="fav-img-${st.stationuuid}">
        ${favicon ? `<img src="${escHtml(favicon)}" alt="" loading="lazy" onerror="this.parentElement.textContent='📻'">` : '📻'}
      </div>
      <div class="station-info">
        <div class="station-name">${escHtml(name)}</div>
        <div class="station-meta">${escHtml(metaParts.join('  ·  '))}</div>
      </div>
      <div class="station-right">
        ${isPlaying ? '<div class="playing-bars"><span></span><span></span><span></span></div>' : ''}
        ${bitrate ? `<span class="bitrate-badge">${bitrate}</span>` : ''}
        <button class="fav-star${isFav ? ' active' : ''}" data-uuid="${st.stationuuid}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
          ${isFav ? '★' : '☆'}
        </button>
      </div>
    </div>`;
  }).join('');

  // Bind row clicks
  stationList.querySelectorAll('.station-item').forEach(el => {
    el.addEventListener('dblclick', () => {
      const idx = +el.dataset.idx;
      playStation(state.stations[idx]);
    });
    el.addEventListener('click', e => {
      if (e.target.closest('.fav-star')) return;
      // single click selects; dblclick plays (on desktop)
      // on mobile single click plays
      if (window.matchMedia('(pointer: coarse)').matches) {
        const idx = +el.dataset.idx;
        playStation(state.stations[idx]);
      }
    });
  });

  stationList.querySelectorAll('.fav-star').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      toggleFavorite(btn.dataset.uuid);
    });
  });
}

// ── Playback ──────────────────────────────────────────────────────
function playStation(station) {
  const url = station.url_resolved || station.url;
  if (!url) { showStatus('No stream URL for this station'); return; }

  state.currentStation = station;
  state.isPlaying = false;

  audio.src = url;
  audio.load();
  audio.play().catch(() => showStatus('Playback blocked — click Play to start'));

  updateNowPlayingBar();
  refreshStationHighlight();
  document.title = station.name + ' — Radio Player';
  clearInterval(metadataInterval);
}

function updateNowPlayingBar() {
  if (!state.currentStation) return;
  const st = state.currentStation;
  npName.textContent = (st.name || 'Unknown').trim();
  const country = st.country || '';
  const tags = (st.tags || '').split(',')[0].trim();
  npMeta.textContent = [country, tags].filter(Boolean).join('  ·  ');

  // favicon
  const fav = st.favicon;
  if (fav) {
    npFavicon.innerHTML = `<img src="${escHtml(fav)}" alt="" onerror="this.parentElement.textContent='📻'">`;
  } else {
    npFavicon.textContent = '📻';
  }
}

function updatePlayBtn() {
  playBtn.classList.remove('loading');
  playBtn.textContent = state.isPlaying ? '⏸' : '▶';
}

function refreshStationHighlight() {
  stationList.querySelectorAll('.station-item').forEach(el => {
    const isPlaying = el.dataset.uuid === state.currentStation?.stationuuid;
    el.classList.toggle('playing', isPlaying);
    const right = el.querySelector('.station-right');
    // update playing bars
    const existing = right.querySelector('.playing-bars');
    if (isPlaying && !existing) {
      right.insertAdjacentHTML('afterbegin', '<div class="playing-bars"><span></span><span></span><span></span></div>');
    } else if (!isPlaying && existing) {
      existing.remove();
    }
  });
}

// ── Favorites ─────────────────────────────────────────────────────
async function loadFavorites() {
  const data = await apiFetch('/api/favorites');
  state.favorites = new Set(data.map(s => s.stationuuid));
  state.favoritesData = Object.fromEntries(data.map(s => [s.stationuuid, s]));
}

async function toggleFavorite(uuid) {
  const station = state.stations.find(s => s.stationuuid === uuid)
                || state.favoritesData[uuid];
  if (!station) return;

  if (state.favorites.has(uuid)) {
    await fetch('/api/favorites/' + uuid, { method: 'DELETE' });
    state.favorites.delete(uuid);
    delete state.favoritesData[uuid];
    showStatus('Removed from favorites');
  } else {
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(station),
    });
    state.favorites.add(uuid);
    state.favoritesData[uuid] = station;
    showStatus('Added to favorites ★');
  }

  // Update star button
  document.querySelectorAll(`.fav-star[data-uuid="${uuid}"]`).forEach(btn => {
    btn.classList.toggle('active', state.favorites.has(uuid));
    btn.textContent = state.favorites.has(uuid) ? '★' : '☆';
    btn.title = state.favorites.has(uuid) ? 'Remove from favorites' : 'Add to favorites';
  });

  if (state.activeSection === 'favorites') loadFavoritesTab();
}

// ── Sidebar ───────────────────────────────────────────────────────
async function loadSidebarData() {
  const [countries, tags] = await Promise.all([
    apiFetch('/api/countries'),
    apiFetch('/api/tags'),
  ]);

  const countryList = $('country-list');
  countryList.innerHTML = countries.map(c =>
    `<div class="side-item" data-country="${escHtml(c.name)}">${escHtml(c.name)} <span style="color:var(--text-mute);font-size:10px">(${c.stationcount})</span></div>`
  ).join('');
  countryList.querySelectorAll('.side-item').forEach(el => {
    el.addEventListener('click', () => {
      setSideActive(el);
      loadCountry(el.dataset.country);
    });
  });

  const genreList = $('genre-list');
  genreList.innerHTML = tags.map(t =>
    `<div class="side-item" data-tag="${escHtml(t.name)}">${escHtml(capitalize(t.name))} <span style="color:var(--text-mute);font-size:10px">(${t.stationcount})</span></div>`
  ).join('');
  genreList.querySelectorAll('.side-item').forEach(el => {
    el.addEventListener('click', () => {
      setSideActive(el);
      loadTag(el.dataset.tag);
    });
  });
}

function setSideActive(el) {
  document.querySelectorAll('.side-item').forEach(e => e.classList.remove('active'));
  el.classList.add('active');
}

// ── Equalizer ─────────────────────────────────────────────────────
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

function openEQ() {
  const modal = $('eq-modal');
  modal.classList.add('open');
}

function buildEQModal() {
  const bandsHtml = EQ_LABELS.map((label, i) => `
    <div class="eq-band">
      <div class="band-val" id="eq-val-${i}">${state.eqBands[i] > 0 ? '+' : ''}${state.eqBands[i]}</div>
      <input type="range" id="eq-band-${i}" min="-12" max="12" step="1" value="${state.eqBands[i]}"
             oninput="onEQSlider(${i}, this.value)">
      <div class="band-label">${label}</div>
    </div>`).join('');

  const presetsHtml = Object.keys(EQ_PRESETS).map(name =>
    `<button class="preset-btn" onclick="applyEQPreset('${name}')">${name}</button>`
  ).join('');

  $('eq-content').innerHTML = `
    <div class="eq-presets">${presetsHtml}</div>
    <div class="eq-bands">${bandsHtml}</div>`;
}

function onEQSlider(i, val) {
  state.eqBands[i] = +val;
  const v = $(`eq-val-${i}`);
  if (v) v.textContent = (+val > 0 ? '+' : '') + val;
  // Web Audio EQ would go here; for now update display
}

function applyEQPreset(name) {
  const bands = EQ_PRESETS[name] || EQ_PRESETS['Flat'];
  state.eqBands = [...bands];
  bands.forEach((v, i) => {
    const el = $(`eq-band-${i}`);
    if (el) el.value = v;
    const ve = $(`eq-val-${i}`);
    if (ve) ve.textContent = (v > 0 ? '+' : '') + v;
  });
  document.querySelectorAll('.preset-btn').forEach(b =>
    b.classList.toggle('active', b.textContent === name));
}

// ── Sleep Timer ───────────────────────────────────────────────────
function openSleepTimer() { $('timer-modal').classList.add('open'); }

function setSleepTimer(minutes) {
  document.querySelectorAll('.timer-pill').forEach(b => b.classList.remove('active'));
  document.querySelectorAll(`.timer-pill[data-min="${minutes}"]`).forEach(b => b.classList.add('active'));
  $('custom-timer-input').value = minutes;
}

function startSleepTimer() {
  const minutes = +($('custom-timer-input').value) || 0;
  clearSleepTimer();
  if (!minutes) return;
  state.sleepRemaining = minutes * 60;
  state.sleepTimer = setInterval(() => {
    state.sleepRemaining--;
    const m = Math.floor(state.sleepRemaining / 60);
    const s = state.sleepRemaining % 60;
    timerDisplay.textContent = `⏰ ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    $('timer-btn').classList.add('active');
    if (state.sleepRemaining <= 0) {
      clearSleepTimer();
      audio.pause();
      state.isPlaying = false;
      updatePlayBtn();
      showStatus('Sleep timer: playback stopped');
    }
  }, 1000);
  closeSleepTimer();
  showStatus(`Sleep timer set for ${minutes} minute${minutes > 1 ? 's' : ''}`);
}

function clearSleepTimer() {
  if (state.sleepTimer) clearInterval(state.sleepTimer);
  state.sleepTimer = null;
  state.sleepRemaining = 0;
  timerDisplay.textContent = '';
  $('timer-btn').classList.remove('active');
}

function closeSleepTimer() { $('timer-modal').classList.remove('open'); }

// ── Status message ────────────────────────────────────────────────
let statusTimeout;
function showStatus(msg) {
  const el = $('status-msg');
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(statusTimeout);
  statusTimeout = setTimeout(() => { el.style.opacity = '0'; }, 4000);
}

// ── Utilities ─────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

// ── Event bindings ────────────────────────────────────────────────
function bindEvents() {
  // Search
  searchInput.addEventListener('input', () => {
    clearTimeout(state.searchDebounce);
    const q = searchInput.value.trim();
    if (!q) { loadTop(); return; }
    state.searchDebounce = setTimeout(() => loadSearch(q), 450);
  });
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      clearTimeout(state.searchDebounce);
      const q = searchInput.value.trim();
      q ? loadSearch(q) : loadTop();
    }
  });

  // Tabs (sidebar)
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      $(`tab-${btn.dataset.tab}`).classList.add('active');
      if (btn.dataset.tab === 'favorites') loadFavoritesTab();
    });
  });

  // Playback controls
  playBtn.addEventListener('click', () => {
    if (!state.currentStation) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });

  $('stop-btn').addEventListener('click', () => {
    audio.pause();
    audio.src = '';
    state.isPlaying = false;
    state.currentStation = null;
    updatePlayBtn();
    npName.textContent = 'Not playing';
    npMeta.textContent = '';
    npStreamTitle.textContent = '';
    npFavicon.textContent = '📻';
    document.title = 'Radio Player';
    refreshStationHighlight();
  });

  // Volume
  volSlider.addEventListener('input', () => {
    state.volume = +volSlider.value;
    audio.volume = state.volume / 100;
    volLabel.textContent = state.volume + '%';
    updateVolIcon();
  });

  // EQ modal
  $('eq-btn').addEventListener('click', () => { buildEQModal(); openEQ(); });
  $('eq-close').addEventListener('click', () => $('eq-modal').classList.remove('open'));
  $('eq-apply').addEventListener('click', () => {
    $('eq-modal').classList.remove('open');
    showStatus('Equalizer applied');
  });
  $('eq-reset').addEventListener('click', () => applyEQPreset('Flat'));

  // Sleep timer modal
  $('timer-btn').addEventListener('click', openSleepTimer);
  $('timer-close').addEventListener('click', closeSleepTimer);
  $('timer-set').addEventListener('click', startSleepTimer);
  $('timer-cancel').addEventListener('click', () => { clearSleepTimer(); closeSleepTimer(); });
  document.querySelectorAll('.timer-pill').forEach(btn => {
    btn.addEventListener('click', () => setSleepTimer(+btn.dataset.min));
  });

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { e.preventDefault(); playBtn.click(); }
    if (e.code === 'KeyS')  { $('stop-btn').click(); }
  });
}

function updateVolIcon() {
  const icon = $('vol-icon');
  if (!icon) return;
  if (state.volume === 0) icon.textContent = '🔇';
  else if (state.volume < 40) icon.textContent = '🔈';
  else if (state.volume < 70) icon.textContent = '🔉';
  else icon.textContent = '🔊';
}

// ── Boot ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
