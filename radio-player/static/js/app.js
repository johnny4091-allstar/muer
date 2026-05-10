'use strict';

// ── State ─────────────────────────────────────────────────────────
const S = {
  currentStation: null,   // radio station or podcast episode
  currentType: 'radio',   // 'radio' | 'podcast'
  isPlaying: false,
  volume: +(localStorage.getItem('vol') || 80),
  muted: false,
  prevVol: 80,
  favorites: new Set(),
  favData: {},
  topStations: [],
  trendingStations: [],
  recentItems: [],
  eqBands: [0,0,0,0,0,0,0,0,0,0],
  sleepTimer: null,
  sleepSecs: 0,
  alarms: [],
  alarmCheckerInterval: null,
  searchDeb: null,
  pwaPrompt: null,
  currentView: 'home',
  fullscreenOpen: false,
  podcastDetail: null,
  user: null,                           // logged-in username or null
  currentListStations: [],              // unfiltered list for filter bar
  currentListGrid: 'station-grid',      // grid element id to render into
  filter: { sort: 'default', minBitrate: 0, hasLogo: false },
};

// ── Audio + Web Audio API ─────────────────────────────────────────
const audio = new Audio();
audio.volume = S.volume / 100;
audio.crossOrigin = 'anonymous';
let audioCtx = null, analyser = null, sourceNode = null;

function initAudioCtx() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    sourceNode = audioCtx.createMediaElementSource(audio);
    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);
  } catch(e) { audioCtx = null; }
}

audio.addEventListener('playing', () => {
  S.isPlaying = true;
  initAudioCtx();
  if (audioCtx?.state === 'suspended') audioCtx.resume();
  // Clear the "Finding song…" loading indicator
  if ($('np-stream-title').textContent.startsWith('⏳'))
    $('np-stream-title').textContent = S.currentType === 'radio' ? '● LIVE' : '▶ Playing';
  updatePlayBtn(); updateNPBar(); refreshCards(); startViz();
  addToRecent(S.currentStation, S.currentType);
  updateMediaSession();
});
audio.addEventListener('pause',   () => { S.isPlaying = false; updatePlayBtn(); stopViz(); });
audio.addEventListener('ended',   () => { S.isPlaying = false; updatePlayBtn(); stopViz(); });
audio.addEventListener('waiting', () => { $('play-btn').classList.add('loading'); });
audio.addEventListener('canplay', () => { $('play-btn').classList.remove('loading'); });
audio.addEventListener('error', () => {
  // If full-song stream failed, try falling back to 30s iTunes preview
  if (S.currentType === 'music' && S.currentStation?._previewUrl && audio.src !== S.currentStation._previewUrl) {
    audio.src = S.currentStation._previewUrl;
    audio.load();
    audio.play().catch(() => toast('Tap Play to start'));
    toast('Playing 30s preview (install yt-dlp for full songs)', 5000);
    return;
  }
  S.isPlaying = false; updatePlayBtn(); stopViz();
  toast('Stream error — try another station');
});

// ── Utilities ─────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const greeting = () => { const h = new Date().getHours(); return h<12?'Good morning':h<18?'Good afternoon':'Good evening'; };

// ── Toast notification ────────────────────────────────────────────
let _toastTimer;
function toast(msg, dur = 3000) {
  const el = $('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), dur);
}
// status-msg in topbar
let _stTimer;
function showStatus(msg) {
  const el = $('status-msg');
  el.textContent = msg; el.style.opacity = '1';
  clearTimeout(_stTimer);
  _stTimer = setTimeout(() => el.style.opacity = '0', 4000);
}

// ── Modal helpers ─────────────────────────────────────────────────
function openModal(id)  { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }

// ── API ───────────────────────────────────────────────────────────
async function apiFetch(url) {
  $('loading-indicator').innerHTML = '<span class="spinner"></span>';
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(r.statusText);
    return await r.json();
  } catch(e) {
    showStatus('Error: ' + e.message);
    return [];
  } finally {
    $('loading-indicator').innerHTML = '';
  }
}

// ── Card builders ─────────────────────────────────────────────────
function makeCard(st, type = 'radio') {
  const id     = type === 'radio' ? st.stationuuid : String(st.collectionId);
  const isPlay = S.currentStation?.['_id'] === id && S.isPlaying;
  const isFav  = S.favorites.has(id);
  const name   = (st.name || st.collectionName || 'Unknown').trim();
  const img    = st.favicon || st.artworkUrl600 || st.artworkUrl100 || '';
  const sub    = type === 'podcast'
    ? (st.artistName || '')
    : [st.country, (st.tags||'').split(',')[0].trim()].filter(Boolean).join(' · ');

  return `<div class="card${isPlay?' playing':''}" data-id="${esc(id)}" data-type="${type}"
      ondblclick="playById('${esc(id)}','${type}')"
      onclick="handleCardClick(event,'${esc(id)}','${type}')">
    <button class="card-fav${isFav?' active':''}" onclick="event.stopPropagation();toggleFavById('${esc(id)}')"
      title="${isFav?'Remove':'Save'}">${isFav?'♥':'♡'}</button>
    <div class="card-img-wrap">
      <div class="card-img" id="ci-${esc(id)}">
        ${img?`<img src="${esc(img)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='${type==='podcast'?'🎙':'📻'}'">`:type==='podcast'?'🎙':'📻'}
      </div>
      <button class="card-play-btn" onclick="event.stopPropagation();playById('${esc(id)}','${type}')">${isPlay?'⏸':'▶'}</button>
    </div>
    <div class="card-name">${esc(name)}${isPlay?'<span class="playing-bars"><span></span><span></span><span></span></span>':''}</div>
    <div class="card-meta">${esc(sub||'')}</div>
  </div>`;
}

function makeQuickCard(item, type = 'radio') {
  const id     = type === 'radio' ? item.stationuuid : String(item._id || item.stationuuid || item.collectionId);
  const isPlay = S.currentStation?.['_id'] === id && S.isPlaying;
  const name   = (item.name || item.collectionName || 'Unknown').trim();
  const img    = item.favicon || item.artworkUrl100 || '';
  return `<div class="quick-card${isPlay?' playing':''}" data-id="${esc(id)}" data-type="${type}"
      onclick="handleCardClick(event,'${esc(id)}','${type}')">
    <div class="quick-img">${img?`<img src="${esc(img)}" alt="" onerror="this.parentElement.innerHTML='📻'">`:type==='podcast'?'🎙':'📻'}</div>
    <span class="quick-name">${esc(name)}</span>
    <button class="quick-play" onclick="event.stopPropagation();playById('${esc(id)}','${type}')">${isPlay?'⏸':'▶'}</button>
  </div>`;
}

// ── Station registry (lookup by _id) ─────────────────────────────
const registry = new Map(); // id → {station, type}

function register(st, type) {
  const id = type === 'radio' ? st.stationuuid : String(st.collectionId || st.trackId);
  st._id = id;
  registry.set(id, { station: st, type });
}

function registerTrack(track) {
  const id = String(track.trackId);
  track._id = id;
  registry.set(id, { station: track, type: 'track' });
}

function lookup(id) { return registry.get(id) || null; }

// ── Play by ID ────────────────────────────────────────────────────
function playById(id, type) {
  const entry = lookup(id);
  if (!entry) return;
  if (type === 'podcast') openPodcastDetail(entry.station);
  else if (type === 'track') playTrack(entry.station);
  else playStation(entry.station);
}

function handleCardClick(e, id, type) {
  if (e.target.closest('.card-play-btn') || e.target.closest('.card-fav')) return;
  if (window.matchMedia('(pointer: coarse)').matches) {
    playById(id, type);
  } else if (type === 'podcast') {
    openPodcastDetail(lookup(id)?.station);
  } else if (type === 'track') {
    playTrack(lookup(id)?.station);
  }
}

// ── Track card ────────────────────────────────────────────────────
function makeTrackCard(track) {
  const id     = String(track.trackId);
  const isPlay = S.currentStation?._id === id && S.isPlaying;
  const name   = track.trackName  || 'Unknown';
  const artist = track.artistName || '';
  const img    = (track.artworkUrl100 || '').replace('100x100bb', '600x600bb');
  // Duration from iTunes (milliseconds → m:ss)
  const ms  = track.trackTimeMillis || 0;
  const dur = ms ? `${Math.floor(ms/60000)}:${String(Math.floor((ms%60000)/1000)).padStart(2,'0')}` : '';

  return `<div class="card track-card${isPlay?' playing':''}" data-id="${esc(id)}" data-type="track"
      ondblclick="playTrackById('${esc(id)}')"
      onclick="handleCardClick(event,'${esc(id)}','track')">
    <div class="card-img-wrap">
      <div class="card-img">
        ${img ? `<img src="${esc(img)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='🎵'">` : '🎵'}
      </div>
      <button class="card-play-btn" onclick="event.stopPropagation();playTrackById('${esc(id)}')">${isPlay?'⏸':'▶'}</button>
    </div>
    <div class="card-name">${esc(name)}${isPlay?'<span class="playing-bars"><span></span><span></span><span></span></span>':''}</div>
    <div class="card-artist">${esc(artist)}${dur ? `<span class="track-dur"> · ${esc(dur)}</span>` : ''}</div>
  </div>`;
}

// ── Play track ────────────────────────────────────────────────────
function playTrack(track) {
  if (!track) return;
  const streamUrl = `/api/music/stream?name=${encodeURIComponent(track.trackName||'')}&artist=${encodeURIComponent(track.artistName||'')}`;
  const art = (track.artworkUrl100 || '').replace('100x100bb', '600x600bb');

  S.currentStation = {
    _id:          String(track.trackId),
    name:         track.trackName         || 'Unknown Track',
    favicon:      art,
    country:      track.artistName        || '',
    tags:         track.primaryGenreName  || 'Music',
    url_resolved: streamUrl,
    stationuuid:  String(track.trackId),
    _previewUrl:  track.previewUrl || '',  // fallback if yt-dlp unavailable
  };
  S.currentType = 'music';

  $('np-stream-title').textContent = '⏳ Finding song…';
  audio.src = streamUrl;
  audio.load();
  audio.play().catch(() => toast('Tap Play to start'));
  updateNPBar();
  refreshCards();
  document.title = (track.trackName || 'Music') + ' — Radio Player';
  setHeroGradient(art);
}

function playTrackById(id) {
  const entry = lookup(id);
  if (entry) playTrack(entry.station);
}

// ── Music section (homepage + view) ──────────────────────────────
let _musicGenres = [];
let _musicViewTracks = [];

async function loadMusicGenres() {
  _musicGenres = await apiFetch('/api/music/genres');
  // Homepage chips
  $('music-home-chips').innerHTML =
    '<span class="chip active" onclick="loadMusicHome(null,this)">Featured</span>' +
    _musicGenres.map(g => `<span class="chip" onclick="loadMusicHome('${esc(g.term)}',this)">${esc(g.name)}</span>`).join('');
  // Music view chips
  $('music-view-chips').innerHTML =
    _musicGenres.map(g => `<span class="chip" onclick="selectMusicGenre('${esc(g.term)}',this)">${esc(g.name)}</span>`).join('');
}

async function loadMusicHome(term, chipEl) {
  // Update chip active state
  $('music-home-chips').querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  if (chipEl) chipEl.classList.add('active');

  $('music-home-grid').innerHTML = '<div class="empty-state" style="min-height:80px"><span class="spinner"></span></div>';
  const url = term ? `/api/music/charts?genre=${encodeURIComponent(term)}` : '/api/music/featured';
  const tracks = await apiFetch(url);
  tracks.forEach(registerTrack);
  $('music-home-grid').innerHTML = tracks.length
    ? tracks.map(makeTrackCard).join('')
    : '<div class="empty-state"><div class="icon">🎵</div><p>No tracks found</p></div>';
}

async function selectMusicGenre(term, chipEl) {
  $('music-view-chips').querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  if (chipEl) chipEl.classList.add('active');
  $('music-view-grid').innerHTML = '<div class="empty-state" style="min-height:100px"><span class="spinner"></span></div>';
  const tracks = await apiFetch(`/api/music/charts?genre=${encodeURIComponent(term)}`);
  _musicViewTracks = tracks;
  tracks.forEach(registerTrack);
  renderMusicView();
}

function renderMusicView() {
  let tracks = [..._musicViewTracks];
  const sort = $('music-sort')?.value || 'default';
  if (sort === 'name')     tracks.sort((a,b) => (a.trackName||'').localeCompare(b.trackName||''));
  if (sort === 'artist')   tracks.sort((a,b) => (a.artistName||'').localeCompare(b.artistName||''));
  if (sort === 'duration') tracks.sort((a,b) => (b.trackTimeMillis||0) - (a.trackTimeMillis||0));
  $('music-count').textContent = tracks.length + ' tracks';
  $('music-view-grid').innerHTML = tracks.length
    ? tracks.map(makeTrackCard).join('')
    : '<div class="empty-state"><div class="icon">🎵</div><p>Select a genre above</p></div>';
}

function musicSort(val) { renderMusicView(); }

// ── Play radio station ────────────────────────────────────────────
function playStation(st) {
  const url = st.url_resolved || st.url || '';
  if (!url) { toast('No stream URL for this station'); return; }
  S.currentStation = { ...st, _id: st.stationuuid };
  S.currentType = 'radio';
  audio.src = url;
  audio.load();
  audio.play().catch(() => toast('Tap Play to start'));
  updateNPBar();
  refreshCards();
  document.title = st.name + ' — Radio Player';
  setHeroGradient(st.favicon || '');
}

// ── Play podcast episode ──────────────────────────────────────────
function playEpisode(ep, podcast) {
  const url = ep.audio_url;
  if (!url) { toast('No audio for this episode'); return; }
  S.currentStation = {
    _id: ep.audio_url,
    name: ep.title,
    favicon: ep.image || podcast?.artworkUrl600 || podcast?.artworkUrl100 || '',
    country: podcast?.artistName || '',
    tags: 'Podcast',
    url_resolved: url,
    codec: 'MP3',
    bitrate: '',
    stationuuid: ep.audio_url,
  };
  S.currentType = 'podcast';
  audio.src = url;
  audio.load();
  audio.play().catch(() => toast('Tap Play to start'));
  updateNPBar();
  document.title = ep.title + ' — Radio Player';
  setHeroGradient(S.currentStation.favicon);
}

// ── Now playing bar ───────────────────────────────────────────────
function updateNPBar() {
  if (!S.currentStation) return;
  const st = S.currentStation;
  $('np-name').textContent = st.name;
  const genre = (st.tags || '').split(',')[0].trim();
  const meta  = [st.country, genre].filter(Boolean).join('  ·  ');
  $('np-meta').textContent = meta;

  const favicon = st.favicon || '';
  $('np-favicon').innerHTML = favicon
    ? `<img src="${esc(favicon)}" alt="" onerror="this.parentElement.textContent='📻'">`
    : '📻';

  // Full-screen panel
  $('fs-title').textContent    = st.name;
  $('fs-subtitle').textContent = meta;
  $('fs-type-label').textContent = S.currentType === 'podcast' ? 'Podcast' : '● LIVE';
  if (favicon) {
    $('fs-art').innerHTML = `<img src="${esc(favicon)}" alt="" onerror="this.parentElement.textContent='📻'">`;
    $('fs-bg').style.backgroundImage = `url('${esc(favicon)}')`;
  } else {
    $('fs-art').textContent = S.currentType === 'podcast' ? '🎙' : '📻';
    $('fs-bg').style.backgroundImage = '';
  }

  updateNPFavBtn();
}

function updateNPFavBtn() {
  const id    = S.currentStation?._id;
  const isFav = id && S.favorites.has(id);
  const btn   = $('np-fav-btn');
  const fsBtn = $('fs-fav-btn');
  btn.textContent  = isFav ? '♥' : '♡';
  btn.classList.toggle('active', !!isFav);
  if (fsBtn) { fsBtn.textContent = isFav ? '♥' : '♡'; fsBtn.classList.toggle('active', !!isFav); }
}

function updatePlayBtn() {
  const icon = S.isPlaying ? '⏸' : '▶';
  $('play-btn').classList.remove('loading');
  $('play-btn').textContent  = icon;
  $('fs-play-btn').textContent = icon;
  // Fullscreen playing class
  $('fullscreen-player').classList.toggle('playing', S.isPlaying);
  // Stream title in NP bar (updated from metadata)
  if (!S.isPlaying) $('np-stream-title').textContent = '';
}

function refreshCards() {
  const id = S.currentStation?._id;
  document.querySelectorAll('.card').forEach(card => {
    const isPlay = card.dataset.id === id;
    card.classList.toggle('playing', isPlay);
    const nameEl = card.querySelector('.card-name');
    if (nameEl) {
      nameEl.querySelectorAll('.playing-bars').forEach(e => e.remove());
      if (isPlay && S.isPlaying)
        nameEl.insertAdjacentHTML('beforeend','<span class="playing-bars"><span></span><span></span><span></span></span>');
    }
    const pb = card.querySelector('.card-play-btn');
    if (pb) pb.textContent = (isPlay && S.isPlaying) ? '⏸' : '▶';
    const fb = card.querySelector('.card-fav');
    if (fb) {
      const fav = S.favorites.has(card.dataset.id);
      fb.classList.toggle('active', fav);
      fb.textContent = fav ? '♥' : '♡';
    }
  });
  document.querySelectorAll('.quick-card').forEach(card => {
    const isPlay = card.dataset.id === id;
    card.classList.toggle('playing', isPlay);
    const pb = card.querySelector('.quick-play');
    if (pb) pb.textContent = (isPlay && S.isPlaying) ? '⏸' : '▶';
  });
}

// ── Controls ──────────────────────────────────────────────────────
function togglePlay() {
  if (!S.currentStation) return;
  if (audio.paused) audio.play().catch(()=>{});
  else              audio.pause();
}

function stopPlayback() {
  audio.pause(); audio.src = '';
  S.isPlaying = false; S.currentStation = null;
  updatePlayBtn();
  $('np-name').textContent = 'Select something to play';
  $('np-meta').textContent = '';
  $('np-stream-title').textContent = '';
  $('np-favicon').textContent = '📻';
  $('np-fav-btn').textContent = '♡';
  $('np-fav-btn').classList.remove('active');
  $('fs-title').textContent = 'Not playing';
  $('fs-subtitle').textContent = '';
  $('fs-art').textContent = '📻';
  document.title = 'Radio Player';
  stopViz(); refreshCards();
}

function setVolume(v) {
  S.volume = v; S.muted = v === 0;
  audio.volume = v / 100;
  $('vol-label').textContent = v + '%';
  $('vol-icon').textContent  = v===0?'🔇':v<40?'🔈':v<70?'🔉':'🔊';
  $('vol-slider').value       = v;
  $('fs-vol-slider').value    = v;
  localStorage.setItem('vol', v);
}

// ── Full-screen player ────────────────────────────────────────────
function openFullscreen() {
  S.fullscreenOpen = true;
  $('fullscreen-player').classList.add('open');
  updateNPBar(); updatePlayBtn();
}
function closeFullscreen() {
  S.fullscreenOpen = false;
  $('fullscreen-player').classList.remove('open');
}

function handlePlayerBarClick(e) {
  if (e.target.closest('#np-center') || e.target.closest('#np-right') || e.target.closest('.np-actions')) return;
  openFullscreen();
}

// Swipe down to close full screen
let fsStartY = 0;
$('fullscreen-player').addEventListener('touchstart', e => { fsStartY = e.touches[0].clientY; }, { passive: true });
$('fullscreen-player').addEventListener('touchmove', e => {
  const dy = e.touches[0].clientY - fsStartY;
  if (dy > 60) closeFullscreen();
}, { passive: true });

// ── Hero gradient ─────────────────────────────────────────────────
const HERO_COLORS = ['#3a1020','#0d2e3a','#1a2e0d','#2a1a3a','#3a2a0d','#0d1a3a','#3a0d2a','#2a1010','#0a2a2a'];
function setHeroGradient(imgUrl) {
  let h = 0;
  for (const c of imgUrl) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  const col = HERO_COLORS[h % HERO_COLORS.length];
  $('main').style.setProperty('--hero-top', col);
}

// ── MediaSession API ──────────────────────────────────────────────
function updateMediaSession() {
  if (!('mediaSession' in navigator) || !S.currentStation) return;
  const st = S.currentStation;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: st.name || 'Radio Player',
    artist: st.country || '',
    album: (st.tags||'').split(',')[0] || 'Radio',
    artwork: st.favicon ? [{ src: st.favicon, sizes: '512x512', type: 'image/png' }] : [],
  });
  navigator.mediaSession.setActionHandler('play',  () => audio.play());
  navigator.mediaSession.setActionHandler('pause', () => audio.pause());
  navigator.mediaSession.setActionHandler('stop',  () => stopPlayback());
}

// ── ICY metadata polling ──────────────────────────────────────────
let _metaInterval;
audio.addEventListener('playing', () => {
  clearInterval(_metaInterval);
  _metaInterval = setInterval(() => {
    // Try to read stream metadata via VLC (best-effort, usually blocked by CORS)
    // We just show a live indicator instead
    if (S.currentType === 'radio') {
      const np = $('np-stream-title');
      if (!np.textContent) np.textContent = '● LIVE';
      const fs = $('fs-now-playing');
      if (!fs.textContent) fs.textContent = '● LIVE';
    }
  }, 5000);
});
audio.addEventListener('pause', () => clearInterval(_metaInterval));

// ── Audio Visualizer ──────────────────────────────────────────────
let vizRaf = null;
function startViz() {
  if (!analyser) return;
  const canvases = [$('viz-canvas'), $('fs-viz-canvas')];
  function draw() {
    vizRaf = requestAnimationFrame(draw);
    const buf = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(buf);
    canvases.forEach(c => {
      if (!c) return;
      const ctx = c.getContext('2d');
      const W = c.width  = c.offsetWidth;
      const H = c.height = c.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      const barW = W / buf.length * 2.5;
      let x = 0;
      for (let i = 0; i < buf.length; i++) {
        const barH = (buf[i] / 255) * H;
        const r = 233, g = 20 + barH, b = 40;
        ctx.fillStyle = `rgba(${r},${g},${b},0.8)`;
        ctx.fillRect(x, H - barH, barW - 1, barH);
        x += barW + 1;
      }
    });
  }
  draw();
}
function stopViz() {
  if (vizRaf) { cancelAnimationFrame(vizRaf); vizRaf = null; }
}

// ── Favorites ─────────────────────────────────────────────────────
async function loadFavorites() {
  const data = await apiFetch('/api/favorites');
  S.favorites = new Set(data.map(s => s.stationuuid || s._id));
  S.favData   = Object.fromEntries(data.map(s => [s.stationuuid || s._id, s]));
  data.forEach(s => register(s, 'radio'));
}

async function toggleFavById(id) {
  const entry = lookup(id);
  const st    = entry?.station || S.favData[id];
  if (!st) return;
  if (S.favorites.has(id)) {
    await fetch('/api/favorites/' + id, { method: 'DELETE' });
    S.favorites.delete(id);
    delete S.favData[id];
    toast('Removed from library');
  } else {
    await fetch('/api/favorites', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(st),
    });
    S.favorites.add(id);
    S.favData[id] = st;
    toast('Saved to Your Library ♥');
  }
  refreshCards(); updateNPFavBtn();
  if (S.currentView === 'library') renderLibrary();
}

const App = {
  toggleCurrentFav() { if (S.currentStation) toggleFavById(S.currentStation._id); },
};

// ── Recently played ───────────────────────────────────────────────
function loadRecentFromStorage() {
  try { S.recentItems = JSON.parse(localStorage.getItem('recent') || '[]'); } catch(e) { S.recentItems = []; }
}

function addToRecent(st, type) {
  if (!st) return;
  const item = { ...st, _type: type, _played: Date.now() };
  S.recentItems = [item, ...S.recentItems.filter(r => r._id !== st._id)].slice(0, 30);
  localStorage.setItem('recent', JSON.stringify(S.recentItems));
  // Also persist to server
  fetch('/api/recent', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: st._id, name: st.name }) });
  renderRecentSection();
}

function renderRecentSection() {
  const grid = $('recent-grid');
  const sec  = $('recent-section');
  if (!S.recentItems.length) { sec.style.display = 'none'; return; }
  sec.style.display = '';
  grid.innerHTML = S.recentItems.slice(0,6).map(r => makeQuickCard(r, r._type || 'radio')).join('');
}

function clearRecent() {
  S.recentItems = [];
  localStorage.removeItem('recent');
  $('recent-all-grid').innerHTML = '<div class="empty-state"><div class="icon">🕐</div><p>Nothing yet</p></div>';
  renderRecentSection();
}

// ── Views / Navigation ────────────────────────────────────────────
const VIEWS = ['home','all','search','music','podcasts','library','recent'];
function showView(name) {
  VIEWS.forEach(v => $(`view-${v}`).style.display = v === name ? '' : 'none');
  S.currentView = name;
  // Show filter bar only for list views that have stations
  $('filter-bar').style.display = (name === 'all' || name === 'search') ? '' : 'none';
}

function setNavActive(id) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (id) $(id)?.classList.add('active');
}

const Nav = {
  home() {
    showView('home'); setNavActive('nav-home');
    $('search-input').value = '';
  },
  music() {
    showView('music'); setNavActive('nav-music');
    if (!_musicGenres.length) loadMusicGenres();
  },
  search() { $('search-input').focus(); setNavActive('nav-search'); },
  podcasts() {
    showView('podcasts'); setNavActive('nav-podcasts');
    loadPodcasts();
  },
  library() {
    showView('library'); setNavActive('nav-library');
    renderLibrary();
  },
  recent() {
    showView('recent'); setNavActive('nav-recent');
    $('recent-all-grid').innerHTML = S.recentItems.length
      ? S.recentItems.map(r => makeCard(r, r._type || 'radio')).join('')
      : '<div class="empty-state"><div class="icon">🕐</div><p>Nothing yet</p></div>';
  },
  trending() {
    $('section-title').textContent = '🔥 Trending';
    S.currentListStations = S.trendingStations;
    S.currentListGrid = 'station-grid';
    showView('all'); setNavActive('nav-home');
    renderFilteredList();
  },
  showAllTop() {
    $('section-title').textContent = 'Top Stations';
    S.currentListStations = S.topStations;
    S.currentListGrid = 'station-grid';
    showView('all'); setNavActive('nav-home');
    renderFilteredList();
  },
};

function setSidebarActive(el) {
  document.querySelectorAll('#sidebar .sidebar-item').forEach(e => e.classList.remove('active'));
  el.classList.add('active');
}

// ── Home ──────────────────────────────────────────────────────────
async function loadHome() {
  $('greeting').textContent = greeting();
  renderRecentSection();
  const [top, trending] = await Promise.all([
    apiFetch('/api/top?limit=100'),
    apiFetch('/api/trending'),
  ]);
  S.topStations      = top;
  S.trendingStations = trending;
  top.forEach(s => register(s, 'radio'));
  trending.forEach(s => register(s, 'radio'));

  $('quick-grid').innerHTML    = top.slice(0,6).map(s => makeQuickCard(s)).join('');
  $('featured-grid').innerHTML = top.slice(0,20).map(s => makeCard(s)).join('');
  $('trending-grid').innerHTML = trending.slice(0,10).map(s => makeCard(s)).join('');

  // Load music section (non-blocking, runs in parallel after station load)
  loadMusicGenres();
  loadMusicHome(null, $('music-home-chips')?.querySelector('.chip'));
}

// ── Search ────────────────────────────────────────────────────────
async function doSearch(q) {
  showView('search'); setNavActive('nav-search');
  $('search-title').textContent = `Results for "${q}"`;

  // Fetch stations, podcasts, and tracks in parallel
  const [data, tracksData] = await Promise.all([
    apiFetch('/api/search?q=' + encodeURIComponent(q)),
    apiFetch('/api/music/search?q=' + encodeURIComponent(q)),
  ]);
  let pods = [];
  try {
    const pr = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=podcast&limit=6&media=podcast`);
    pods = (await pr.json()).results || [];
  } catch(e) {}

  data.forEach(s => register(s, 'radio'));
  pods.forEach(p => { p._id = String(p.collectionId); register(p, 'podcast'); });
  tracksData.forEach(registerTrack);

  S.currentListStations = data;
  S.currentListGrid = 'search-grid';

  const tracksHtml = tracksData.length
    ? `<div class="section-header" style="margin-top:20px"><span class="section-label">🎵 MUSIC (${tracksData.length})</span></div>` + tracksData.slice(0,12).map(makeTrackCard).join('')
    : '';
  const podsHtml = pods.length
    ? `<div class="section-header" style="margin-top:20px"><span class="section-label">🎙 PODCASTS (${pods.length})</span></div>` + pods.map(p => makeCard(p,'podcast')).join('')
    : '';

  renderFilteredList(tracksHtml + podsHtml);
  $('search-count').textContent = (data.length + tracksData.length + pods.length) + ' results';
}

// ── Library ───────────────────────────────────────────────────────
function renderLibrary() {
  const data = Object.values(S.favData);
  $('fav-count').textContent = data.length + ' saved';
  $('fav-grid').innerHTML = data.length
    ? data.map(s => makeCard(s, 'radio')).join('')
    : '<div class="empty-state"><div class="icon">💚</div><p>Your library is empty</p><span>Click ♡ to save stations</span></div>';
}

// ── Sidebar data ──────────────────────────────────────────────────
async function loadSidebarData() {
  const [countries, tags] = await Promise.all([apiFetch('/api/countries'), apiFetch('/api/tags')]);

  $('country-list').innerHTML = countries.map(c => `
    <div class="sidebar-item" data-country="${esc(c.name)}">
      <div class="sidebar-item-img">🌍</div>
      <div class="sidebar-item-info">
        <div class="sidebar-item-name">${esc(c.name)}</div>
        <div class="sidebar-item-sub">${c.stationcount}</div>
      </div>
    </div>`).join('');

  $('genre-list').innerHTML = tags.map(t => `
    <div class="sidebar-item" data-tag="${esc(t.name)}">
      <div class="sidebar-item-img">🎵</div>
      <div class="sidebar-item-info">
        <div class="sidebar-item-name">${esc(cap(t.name))}</div>
        <div class="sidebar-item-sub">${t.stationcount}</div>
      </div>
    </div>`).join('');

  $('country-list').querySelectorAll('.sidebar-item').forEach(el =>
    el.addEventListener('click', async () => {
      setSidebarActive(el);
      const country = el.dataset.country;
      $('section-title').textContent = '🌍 ' + country;
      const data = await apiFetch('/api/country/' + encodeURIComponent(country));
      data.forEach(s => register(s, 'radio'));
      S.currentListStations = data;
      S.currentListGrid = 'station-grid';
      showView('all');
      renderFilteredList();
    }));

  $('genre-list').querySelectorAll('.sidebar-item').forEach(el =>
    el.addEventListener('click', async () => {
      setSidebarActive(el);
      const tag = el.dataset.tag;
      $('section-title').textContent = '🎵 ' + cap(tag);
      const data = await apiFetch('/api/tag/' + encodeURIComponent(tag));
      data.forEach(s => register(s, 'radio'));
      S.currentListStations = data;
      S.currentListGrid = 'station-grid';
      showView('all');
      renderFilteredList();
    }));
}

// ── Podcasts ──────────────────────────────────────────────────────
let podsLoaded = false;
async function loadPodcasts(term = null) {
  if (!term && podsLoaded) return;
  const url = term ? `/api/podcasts/category?term=${encodeURIComponent(term)}` : '/api/podcasts/featured';
  const data = await apiFetch(url);
  data.forEach(p => { p._id = String(p.collectionId); register(p, 'podcast'); });
  $('podcast-grid').innerHTML = data.length
    ? data.map(p => makeCard(p,'podcast')).join('')
    : '<div class="empty-state"><div class="icon">🎙</div><p>No podcasts found</p></div>';
  if (!term) {
    podsLoaded = true;
    loadPodcastCategories();
  }
}

async function loadPodcastCategories() {
  const cats = await apiFetch('/api/podcasts/categories');
  $('podcast-categories').innerHTML = cats.map(c =>
    `<button class="chip" data-term="${esc(c.term)}" onclick="selectPodcastCat(this,'${esc(c.term)}')">${esc(c.name)}</button>`
  ).join('');
}

function selectPodcastCat(el, term) {
  document.querySelectorAll('#podcast-categories .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  loadPodcasts(term);
}

async function openPodcastDetail(podcast) {
  if (!podcast) return;
  S.podcastDetail = podcast;
  const art = podcast.artworkUrl600 || podcast.artworkUrl100 || '';
  $('pd-title').textContent  = podcast.collectionName || podcast.name || 'Podcast';
  $('pd-author').textContent = podcast.artistName || '';
  if (art) $('pd-art').innerHTML = `<img src="${esc(art)}" alt="" onerror="this.parentElement.textContent='🎙'">`;
  else $('pd-art').textContent = '🎙';

  $('podcast-detail').classList.add('open');
  $('pd-episodes').innerHTML = '<div class="empty-state"><div class="icon"><span class="spinner"></span></div><p>Loading episodes…</p></div>';

  const feedUrl = podcast.feedUrl;
  if (!feedUrl) { $('pd-episodes').innerHTML = '<div class="empty-state"><div class="icon">⚠</div><p>No feed available</p></div>'; return; }

  const eps = await apiFetch('/api/podcasts/episodes?url=' + encodeURIComponent(feedUrl));
  if (!eps.length || eps.error) {
    $('pd-episodes').innerHTML = '<div class="empty-state"><div class="icon">⚠</div><p>Could not load episodes</p></div>';
    return;
  }
  $('pd-episodes').innerHTML = eps.map((ep, i) => {
    const img = ep.image || art || '';
    const dur = ep.duration || '';
    return `<div class="episode-item" onclick="playEpisode(${JSON.stringify(ep).replace(/'/g,"&#39;")}, window.S?.podcastDetail)">
      <span class="episode-num">${i+1}</span>
      <div class="episode-img">${img?`<img src="${esc(img)}" alt="" onerror="this.parentElement.textContent='🎙'">`:''}</div>
      <div class="episode-info">
        <div class="episode-title">${esc(ep.title)}</div>
        <div class="episode-desc">${esc(ep.description||'')}</div>
      </div>
      <span class="episode-dur">${esc(dur)}</span>
      <button class="episode-play">▶</button>
    </div>`;
  }).join('');
}

function closePodcastDetail() {
  $('podcast-detail').classList.remove('open');
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
  'Podcast':      [2,2,3,3,2,0,0,-1,-1,-2],
};
const EQ_LABELS = ['32','64','125','250','500','1k','2k','4k','8k','16k'];

function openEQModal() {
  buildEQ(); openModal('eq-modal');
}
function buildEQ() {
  $('eq-content').innerHTML =
    `<div class="eq-presets">${Object.keys(EQ_PRESETS).map(n=>`<button class="preset-btn${n==='Flat'?' active':''}" onclick="applyPreset('${n}')">${n}</button>`).join('')}</div>
     <div class="eq-bands">${EQ_LABELS.map((l,i)=>`
       <div class="eq-band">
         <div class="band-val" id="ev${i}">${S.eqBands[i]>0?'+':''}${S.eqBands[i]}</div>
         <input type="range" id="eb${i}" min="-12" max="12" step="1" value="${S.eqBands[i]}" oninput="onBand(${i},this.value)">
         <div class="band-label">${l}</div>
       </div>`).join('')}</div>`;
}
function onBand(i, v) { S.eqBands[i]=+v; $(`ev${i}`).textContent=(+v>0?'+':'')+v; }
function applyPreset(name) {
  const b = EQ_PRESETS[name]||EQ_PRESETS['Flat'];
  S.eqBands=[...b];
  b.forEach((v,i)=>{ const e=$(`eb${i}`);if(e)e.value=v; const ve=$(`ev${i}`);if(ve)ve.textContent=(v>0?'+':'')+v; });
  document.querySelectorAll('.preset-btn').forEach(btn=>btn.classList.toggle('active',btn.textContent===name));
}

// ── Sleep Timer ───────────────────────────────────────────────────
function clearSleepTimer() {
  clearInterval(S.sleepTimer); S.sleepTimer=null; S.sleepSecs=0;
  $('timer-display').textContent=''; $('timer-btn').classList.remove('active');
}
function startSleepTimer(mins) {
  clearSleepTimer();
  if (!mins) return;
  S.sleepSecs = mins * 60;
  S.sleepTimer = setInterval(() => {
    S.sleepSecs--;
    const m = Math.floor(S.sleepSecs/60), s = S.sleepSecs%60;
    $('timer-display').textContent = `⏰ ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    $('timer-btn').classList.add('active');
    if (S.sleepSecs<=0) { clearSleepTimer(); audio.pause(); S.isPlaying=false; updatePlayBtn(); toast('Sleep timer: stopped'); }
  }, 1000);
  closeModal('timer-modal');
  toast(`Sleep timer: ${mins} min`);
}

// ── Alarm Clock ───────────────────────────────────────────────────
function loadAlarms() {
  try { S.alarms = JSON.parse(localStorage.getItem('alarms')||'[]'); } catch(e) { S.alarms=[]; }
  renderAlarms();
}

function saveAlarms() {
  localStorage.setItem('alarms', JSON.stringify(S.alarms));
  fetch('/api/alarms', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(S.alarms) });
}

function renderAlarms() {
  $('alarm-list').innerHTML = S.alarms.length
    ? S.alarms.map((a,i) => `
      <div class="alarm-item">
        <div class="alarm-time">${a.time}</div>
        <div class="alarm-station">${esc(a.station||'Current station')}</div>
        <button class="alarm-toggle${a.on?' on':''}" onclick="toggleAlarm(${i})" title="Toggle"></button>
        <button class="alarm-del" onclick="deleteAlarm(${i})" title="Delete">🗑</button>
      </div>`).join('')
    : '<p style="color:var(--text-3);font-size:12px">No alarms set.</p>';
  $('alarm-station-input').value = S.currentStation?.name || '';
}

function addAlarm() {
  const time = $('alarm-time-input').value;
  if (!time) { toast('Please set a time'); return; }
  S.alarms.push({ time, days: $('alarm-days-input').value||'Daily', station: S.currentStation?.name||'', stationData: S.currentStation, on: true });
  saveAlarms(); renderAlarms(); toast(`Alarm set for ${time}`);
}

function toggleAlarm(i) { S.alarms[i].on = !S.alarms[i].on; saveAlarms(); renderAlarms(); }
function deleteAlarm(i)  { S.alarms.splice(i,1); saveAlarms(); renderAlarms(); }

function checkAlarms() {
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  S.alarms.forEach(alarm => {
    if (!alarm.on || alarm.fired_min === now.getMinutes()) return;
    if (alarm.time === hhmm) {
      alarm.fired_min = now.getMinutes();
      toast(`⏰ Alarm! ${alarm.time}`);
      if (alarm.stationData) playStation(alarm.stationData);
      else if (S.currentStation) audio.play().catch(()=>{});
    }
  });
}

// ── Themes ────────────────────────────────────────────────────────
function setTheme(el, theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);
  document.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
}

// ── Share ─────────────────────────────────────────────────────────
function shareCurrentStation() {
  const st = S.currentStation;
  if (!st) return;
  const text = `Listening to ${st.name} on Radio Player`;
  if (navigator.share) {
    navigator.share({ title: st.name, text }).catch(()=>{});
  } else {
    navigator.clipboard?.writeText(text).then(() => toast('Copied to clipboard'));
  }
}

// ── PWA ───────────────────────────────────────────────────────────
function pwaInstall() {
  if (S.pwaPrompt) { S.pwaPrompt.prompt(); S.pwaPrompt.userChoice.then(() => { S.pwaPrompt=null; $('install-btn').style.display='none'; }); }
}
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); S.pwaPrompt = e;
  $('install-btn').style.display = '';
  toast('Tap 📲 to install Radio Player as an app!', 5000);
});

// ── Keyboard shortcuts ────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.target.tagName==='INPUT' || e.target.tagName==='TEXTAREA') return;
  const km = {
    'Space': () => { e.preventDefault(); togglePlay(); },
    'KeyS':  stopPlayback,
    'KeyF':  () => App.toggleCurrentFav(),
    'KeyM':  () => { S.muted=!S.muted; setVolume(S.muted?0:S.prevVol); if(!S.muted)S.prevVol=S.volume; },
    'KeyE':  () => openEQModal(),
    'KeyT':  () => openModal('timer-modal'),
    'KeyP':  () => Nav.podcasts(),
    'Slash': () => { e.preventDefault(); $('search-input').focus(); },
    'Escape':() => {
      if (S.fullscreenOpen) closeFullscreen();
      else document.querySelectorAll('.modal-overlay.open').forEach(m=>m.classList.remove('open'));
    },
    'ArrowUp':   () => { e.preventDefault(); setVolume(Math.min(100,S.volume+5)); },
    'ArrowDown': () => { e.preventDefault(); setVolume(Math.max(0,S.volume-5)); },
  };
  km[e.code]?.();
});

// ── Filter & Sort ─────────────────────────────────────────────────
function _applyFilter(stations) {
  let r = [...stations];
  if (S.filter.minBitrate > 0) r = r.filter(s => (s.bitrate || 0) >= S.filter.minBitrate);
  if (S.filter.hasLogo)        r = r.filter(s => !!s.favicon);
  switch (S.filter.sort) {
    case 'name':    r.sort((a,b) => (a.name||'').localeCompare(b.name||'')); break;
    case 'votes':   r.sort((a,b) => (b.votes||0) - (a.votes||0)); break;
    case 'bitrate': r.sort((a,b) => (b.bitrate||0) - (a.bitrate||0)); break;
    case 'country': r.sort((a,b) => (a.country||'').localeCompare(b.country||'')); break;
  }
  return r;
}

function renderFilteredList(appendHtml = '') {
  const filtered = _applyFilter(S.currentListStations);
  const grid = $(S.currentListGrid);
  if (!grid) return;
  grid.innerHTML = (filtered.length
    ? filtered.map(s => makeCard(s)).join('')
    : '<div class="empty-state"><div class="icon">🔍</div><p>No stations match the filter</p></div>'
  ) + appendHtml;
  // Update count label
  const countEl = S.currentListGrid === 'station-grid' ? $('station-count') : $('search-count');
  if (countEl) countEl.textContent = filtered.length + ' stations';
  $('filter-count').textContent = filtered.length + ' of ' + S.currentListStations.length;
  // Show/hide clear button
  const isActive = S.filter.sort !== 'default' || S.filter.minBitrate > 0 || S.filter.hasLogo;
  $('filter-clear').style.display = isActive ? '' : 'none';
}

function filterSort(val) {
  S.filter.sort = val;
  renderFilteredList();
}

function filterBitrate(el, val) {
  S.filter.minBitrate = val;
  document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  renderFilteredList();
}

function filterHasLogo(checked) {
  S.filter.hasLogo = checked;
  renderFilteredList();
}

function clearFilters() {
  S.filter = { sort: 'default', minBitrate: 0, hasLogo: false };
  $('sort-select').value = 'default';
  document.querySelectorAll('.filter-pill').forEach((p,i) => p.classList.toggle('active', i===0));
  $('logo-only').checked = false;
  $('filter-clear').style.display = 'none';
  renderFilteredList();
}

// ── Auth ──────────────────────────────────────────────────────────
const Auth = {
  async init() {
    try {
      const r = await fetch('/api/auth/me');
      const d = await r.json();
      S.user = d.username || null;
    } catch(e) { S.user = null; }
    this._updateUI();
  },

  _updateUI() {
    const btn = $('user-btn');
    if (S.user) {
      btn.textContent = S.user[0].toUpperCase();   // first letter avatar
      btn.title = S.user + ' (click to manage account)';
      btn.classList.add('signed-in');
    } else {
      btn.textContent = '👤';
      btn.title = 'Sign In / Create Account';
      btn.classList.remove('signed-in');
    }
  },

  async login() {
    const u = $('login-username').value.trim();
    const p = $('login-password').value;
    $('login-error').textContent = '';
    if (!u || !p) { $('login-error').textContent = 'Please fill in all fields.'; return; }
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ username: u, password: p }),
      });
      const d = await r.json();
      if (!r.ok) { $('login-error').textContent = d.error || 'Login failed.'; return; }
      S.user = d.username;
      this._updateUI();
      closeModal('auth-modal');
      toast('Welcome back, ' + d.username + '! ♥');
      // Reload favorites from user account
      await loadFavorites();
      if (S.currentView === 'library') renderLibrary();
    } catch(e) { $('login-error').textContent = 'Network error. Try again.'; }
  },

  async register() {
    const u = $('reg-username').value.trim();
    const p = $('reg-password').value;
    const c = $('reg-confirm').value;
    $('reg-error').textContent = '';
    if (!u || !p || !c) { $('reg-error').textContent = 'Please fill in all fields.'; return; }
    if (p !== c) { $('reg-error').textContent = 'Passwords do not match.'; return; }
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ username: u, password: p }),
      });
      const d = await r.json();
      if (!r.ok) { $('reg-error').textContent = d.error || 'Registration failed.'; return; }
      S.user = d.username;
      this._updateUI();
      closeModal('auth-modal');
      toast('Account created! Your favorites are now saved to ' + d.username + ' ♥');
      await loadFavorites();
    } catch(e) { $('reg-error').textContent = 'Network error. Try again.'; }
  },

  async logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    S.user = null;
    this._updateUI();
    closeModal('auth-modal');
    toast('Signed out');
    await loadFavorites();
    if (S.currentView === 'library') renderLibrary();
  },
};

function openAuthModal() {
  // Show correct panel based on login state
  const loggedIn = !!S.user;
  $('auth-login-panel').style.display    = loggedIn ? 'none' : '';
  $('auth-register-panel').style.display = 'none';
  $('auth-loggedin-panel').style.display = loggedIn ? '' : 'none';
  $('auth-tabs').style.display           = loggedIn ? 'none' : '';
  if (loggedIn) $('auth-username-display').textContent = S.user;
  // Reset forms
  if (!loggedIn) {
    ['login-username','login-password','reg-username','reg-password','reg-confirm'].forEach(id => $(id).value = '');
    $('login-error').textContent = ''; $('reg-error').textContent = '';
    switchAuthTab('login');
  }
  openModal('auth-modal');
}

function switchAuthTab(tab) {
  $('auth-login-panel').style.display    = tab === 'login'    ? '' : 'none';
  $('auth-register-panel').style.display = tab === 'register' ? '' : 'none';
  $('tab-login').classList.toggle('active',    tab === 'login');
  $('tab-register').classList.toggle('active', tab === 'register');
}

// ── Init ──────────────────────────────────────────────────────────
async function init() {
  // Restore theme
  const savedTheme = localStorage.getItem('theme') || '';
  document.documentElement.dataset.theme = savedTheme;
  document.querySelectorAll('.theme-swatch').forEach(s => {
    if ((s.dataset.theme||'') === savedTheme) s.classList.add('active');
    else s.classList.remove('active');
  });

  setVolume(S.volume);
  loadRecentFromStorage();
  loadAlarms();

  await Auth.init();
  await loadFavorites();

  // Bind events
  $('search-input').addEventListener('input', () => {
    clearTimeout(S.searchDeb);
    const q = $('search-input').value.trim();
    if (!q) { Nav.home(); return; }
    S.searchDeb = setTimeout(() => doSearch(q), 450);
  });
  $('search-input').addEventListener('keydown', e => {
    if (e.key==='Enter') { clearTimeout(S.searchDeb); const q=$('search-input').value.trim(); q?doSearch(q):Nav.home(); }
  });

  $('eq-apply').addEventListener('click',  () => { closeModal('eq-modal'); toast('EQ applied'); });
  $('eq-reset').addEventListener('click',  () => applyPreset('Flat'));
  $('timer-set').addEventListener('click', () => startSleepTimer(+($('custom-timer-input').value)||0));
  $('timer-cancel').addEventListener('click', () => { clearSleepTimer(); closeModal('timer-modal'); });
  document.querySelectorAll('.timer-pill').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.timer-pill').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    $('custom-timer-input').value = btn.dataset.min;
  }));

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(o =>
    o.addEventListener('click', e => { if(e.target===o) o.classList.remove('open'); }));

  // Alarm checker every 30s
  S.alarmCheckerInterval = setInterval(checkAlarms, 30000);

  // Load content
  loadHome();
  loadSidebarData();
}

document.addEventListener('DOMContentLoaded', init);
