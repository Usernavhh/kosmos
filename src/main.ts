import './style.css';
import { Renderer } from './engine/core/Renderer';
import { QualityManager } from './engine/core/QualityManager';
import { MemoryTracker } from './engine/core/MemoryTracker';
import { detectGPUFeatures, getGPUFeatures, canRunExtreme } from './engine/core/GPUFeatures';
import { DevPanel } from './engine/core/DevPanel';
import { createScene } from './engine/scene/Scene';
import { PlanetInfo } from './ui/PlanetInfo';
import { StarInfo } from './ui/StarInfo';
import { SatInfo } from './ui/SatInfo';
import { TurboSelector } from './ui/TurboSelector';
import { TourUI } from './ui/TourUI';
import { AIChat } from './ui/AIChat';
import { ControlPanel } from './ui/ControlPanel';
import { Search, type SearchItem } from './ui/Search';
import { GamesUI } from './ui/GamesUI';
import { TOURS } from './data/tours';
import { AIGuide } from './engine/ai/AIGuide';
import { AIVoice } from './engine/ai/AIVoice';
import { AudioManager } from './engine/audio/AudioManager';
import { PhotoMode } from './engine/effects/PhotoMode';
import { GravitySandbox } from './engine/games/GravitySandbox';
import { PLANETS_META } from './engine/scene/Planets';

const params = new URLSearchParams(location.search);
const container = document.getElementById('app');
if (!container) throw new Error('#app topilmadi');

const voice = new AIVoice();
const guide = new AIGuide(voice);
const audio = new AudioManager();

const planetInfo = new PlanetInfo();
const starInfo = new StarInfo();
const satInfo = new SatInfo();
const turboSelector = new TurboSelector();
const tourUI = new TourUI();

// ═══ GPU detection ═══
(async () => {
  const gpu = await detectGPUFeatures();

  if (params.get('quality') === 'extreme' && !gpu.webgpu) {
    console.log(
      '[kosmos] ℹ️ Extreme preset WebGL2 da ishlaydi. ' +
      'WebGPU-specific effektlar (compute) o\'chirilgan, qolgan hammasi aktiv.',
    );
  }

  // Console uchun global
  (window as unknown as { __kosmos_gpu: () => void }).__kosmos_gpu = () => {
    const g = getGPUFeatures();
    if (!g) {
      console.log('GPU aniqlanmagan. Sahifani yangilang.');
      return;
    }
    console.log('═══ GPU Features ═══');
    console.log('WebGPU:', g.webgpu ? '✅' : '❌');
    console.log('WebGPU Adapter:', g.webgpuAdapter ?? '—');
    console.log('WebGPU Features:', g.webgpuFeatures.join(', ') || '—');
    console.log('WebGPU Limits:', g.webgpuLimits);
    console.log('WebGL2:', g.webgl2 ? '✅' : '❌');
    console.log('WebGL Renderer:', g.webglRenderer);
    console.log('WebGL Vendor:', g.webglVendor);
    console.log('Max Texture Size:', g.webglMaxTextureSize);
    console.log('Detection time:', g.detectTimeMs.toFixed(0) + 'ms');
    console.log('Can run Extreme:', canRunExtreme() ? '✅' : '❌');
    return g;
  };
})();

const quality = new QualityManager(params);
const memory = new MemoryTracker();
const renderer = new Renderer(container, quality.getConfig());
// PostFX ulanish
const sceneHandle = createScene(
  renderer.canvas,
  planetInfo,
  starInfo,
  satInfo,
  quality.getConfig(),
  memory,
  {
    onTurboShow: (i) => turboSelector.show(i),
    onTurboSelect: (i) => turboSelector.update(i),
    onTurboHide: () => turboSelector.hide(),
  },
  {
    onStart: (tour) => tourUI.show(tour),
    onKeyframe: (kf) => tourUI.setText(kf.text, kf.title),
    onEnd: () => tourUI.hide(),
  },
);

// PostFX ni ulash
renderer.attach(sceneHandle.scene, sceneHandle.camera);

// ═══════════ FOTO REJIM ═══════════
const photoMode = new PhotoMode(renderer.canvas, {
  onEnter: () => showPhotoHint(),
  onExit: () => hidePhotoHint(),
});

// ═══════════ SANDBOX ═══════════
const sandbox = new GravitySandbox();
sceneHandle.scene.add(sandbox.group);

function openSandbox() {
  sandbox.loadDemo();
  console.log('[sandbox] Demo yuklandi');
}

// ═══════════ GAMES UI ═══════════
const gamesUI = new GamesUI({
  onOpenGravitySandbox: () => openSandbox(),
});

const aiChat = new AIChat(guide, voice, (open) => controlPanel.setAIActive(open));
const search = new Search();

// ═══════════ QIDIRUV ═══════════
const PLANET_ICONS: Record<string, string> = {
  Merkuriy: '☿', Venera: '♀', Yer: '🌍', Mars: '♂',
  Yupiter: '♃', Saturn: '♄', Uran: '⛢', Neptun: '♆',
};

const searchItems: SearchItem[] = [
  ...PLANETS_META.map((p, i) => ({
    id: `planet-${i}`,
    name: p.name,
    nameEn: p.nameEn,
    type: 'Sayyora',
    icon: PLANET_ICONS[p.name] ?? '🪐',
    action: () => sceneHandle.__flyToPlanet(i),
  })),
  { id: 'sun', name: 'Quyosh', nameEn: 'Sun', type: 'Yulduz', icon: '☀️', action: () => sceneHandle.__goHome() },
  { id: 'sgr-a', name: 'Sagittarius A*', nameEn: 'Sgr A*', type: 'Qora tuynuk', icon: '⚫', action: () => sceneHandle.__flyToSgrA() },
  { id: 'milky-way', name: "Somon Yo'li", nameEn: 'Milky Way', type: 'Galaktika', icon: '🌌', action: () => sceneHandle.__flyToMilkyWay() },
  { id: 'andromeda', name: 'Andromeda', nameEn: 'M31', type: 'Galaktika', icon: '🌌', action: () => sceneHandle.__flyToAndromeda() },
  { id: 'proxima', name: 'Proksima Sentavr', nameEn: 'Proxima Centauri', type: 'Yulduz', icon: '⭐', action: () => sceneHandle.__flyToProxima() },
  { id: 'eclipse', name: 'Quyosh tutilishi', nameEn: 'Solar Eclipse', type: 'Hodisa', icon: '🌑', action: () => sceneHandle.__triggerEclipse() },
  { id: 'pulsar', name: 'Pulsar', nameEn: 'Pulsar', type: 'Hodisa', icon: '💫', action: () => sceneHandle.__flyToPulsar() },
  { id: 'supernova', name: 'Supernova qoldig\'i', nameEn: 'Supernova Remnant', type: 'Hodisa', icon: '💥', action: () => sceneHandle.__flyToSupernova() },
];

search.setItems(searchItems);

// ═══════════ CONTROL PANEL ═══════════
const controlPanel = new ControlPanel({
  onAudioToggle: async () => {
    const next = !audio.isEnabled();
    await audio.setEnabled(next);
    controlPanel.setAudioState(next);
  },
  onAIToggle: () => aiChat.toggle(),
  onTourStart: (i) => sceneHandle.tours.start(TOURS[i], sceneHandle.camera),
  onHelpToggle: () => showHelp(),
  onSearchOpen: () => search.openSearch(),
  onGamesOpen: () => gamesUI.openMenu(),
  onPhotoToggle: () => photoMode.toggle(),
});

setTimeout(() => guide.warmup(), 3000);

// ═══════════ KLAVIATURA ═══════════
window.addEventListener('keydown', (e) => {
  const target = e.target as HTMLElement;
  const isInput =
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable;

  // Foto rejim
  if (e.code === 'KeyP' && !isInput && !e.ctrlKey && !e.metaKey) {
    photoMode.toggle();
    return;
  }

  // Foto rejim ichida
  if (photoMode.isActive()) {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      photoMode.capture();
      return;
    }
    if (e.code === 'KeyF') {
      photoMode.nextFilter();
      return;
    }
  }

  if (aiChat.isOpen() || search.isOpen() || gamesUI.isOpen()) return;

  if (e.code === 'Digit7') sceneHandle.tours.start(TOURS[0], sceneHandle.camera);
  if (e.code === 'Digit8') sceneHandle.tours.start(TOURS[1], sceneHandle.camera);
  if (e.code === 'Digit9') sceneHandle.tours.start(TOURS[2], sceneHandle.camera);
  if (e.code === 'Digit0') sceneHandle.__triggerEclipse();

  if (e.code === 'KeyM' && !e.ctrlKey && !e.metaKey) {
    const next = !audio.isEnabled();
    audio.setEnabled(next).then(() => controlPanel.setAudioState(next));
  }
  if (e.code === 'KeyS' && e.shiftKey) {
    voice.setTTSEnabled(!voice.isTTSEnabled());
  }
  if (e.code === 'KeyQ' && !e.ctrlKey && !e.metaKey) {
    gamesUI.openMenu();
  }
});

// ═══════════ FOTO REJIM YORDAM ═══════════
function showPhotoHint() {
  const hint = document.createElement('div');
  hint.className = 'photo-hint';
  hint.id = 'photo-hint';
  hint.innerHTML = `
    <div>📸 FOTO REJIM</div>
    <div class="photo-hint-row">SPACE — skrinshot · F — filter · P — yopish</div>
  `;
  document.body.appendChild(hint);
}

function hidePhotoHint() {
  document.getElementById('photo-hint')?.remove();
}

// ═══════════ HELP ═══════════
function showHelp() {
  const existing = document.querySelector('.help-overlay');
  if (existing) existing.remove();

  const help = document.createElement('div');
  help.className = 'help-overlay';
  help.innerHTML = `
    <div class="help-panel">
      <h2>KOSMOS — Boshqaruv</h2>
      <table>
        <tr><td>F yoki /</td><td>Qidirish</td></tr>
        <tr><td>Q</td><td>O'yinlar</td></tr>
        <tr><td>P</td><td>Foto rejim</td></tr>
        <tr><td>Space (foto)</td><td>Skrinshot</td></tr>
        <tr><td>F (foto)</td><td>Filter almashtirish</td></tr>
        <tr><td>W A S D</td><td>Harakat</td></tr>
        <tr><td>Space / Shift</td><td>Yuqoriga / pastga</td></tr>
        <tr><td>← → ↑ ↓</td><td>Kamera burish</td></tr>
        <tr><td>Z (bosib tur)</td><td>Turbo tanlash</td></tr>
        <tr><td>H</td><td>Uyga qaytish</td></tr>
        <tr><td>Tab / K</td><td>Sayyora</td></tr>
        <tr><td>G</td><td>AI gid</td></tr>
        <tr><td>M</td><td>Audio</td></tr>
        <tr><td>1-6</td><td>Vaqt tezligi</td></tr>
        <tr><td>7 / 8 / 9</td><td>Turlar</td></tr>
        <tr><td>0</td><td>Quyosh tutilishi</td></tr>
      </table>
      <button class="help-close">Yopish</button>
    </div>
  `;
  document.body.appendChild(help);

  const close = () => help.remove();
  help.querySelector('.help-close')!.addEventListener('click', close);
  help.addEventListener('click', (e) => {
    if (e.target === help) close();
  });
}

const devPanel = new DevPanel(quality, sceneHandle.time, sceneHandle.controls, memory, params);

function applySize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(Math.floor(w * quality.renderScale), Math.floor(h * quality.renderScale));
  renderer.canvas.style.width = w + 'px';
  renderer.canvas.style.height = h + 'px';
  sceneHandle.resize(w, h);
}

window.addEventListener('resize', applySize);
applySize();

let lastTime = performance.now();

function loop(now: number) {
  requestAnimationFrame(loop);
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  sceneHandle.update(dt);
  sandbox.update(dt);

  guide.setContext({
    distanceFromCenter: sceneHandle.getDistance(),
    currentTime: sceneHandle.time.format(),
  });

  const dist = sceneHandle.getDistance();
  const proximity = Math.min(1, Math.max(0, 1 - Math.log10(Math.max(dist, 100)) / 8));
  audio.setProximity(proximity);

  const prevScale = quality.renderScale;
  quality.update(dt);
  if (prevScale !== quality.renderScale) applySize();

  renderer.render(sceneHandle.scene, sceneHandle.camera, dt);
  devPanel.update(dt, sceneHandle.getDistance(), sceneHandle.getSpeed());
}

requestAnimationFrame(loop);