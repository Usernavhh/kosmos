import './style.css';
import { Renderer } from './engine/core/Renderer';
import { QualityManager } from './engine/core/QualityManager';
import { DevPanel } from './engine/core/DevPanel';
import { createScene } from './engine/scene/Scene';
import { PlanetInfo } from './ui/PlanetInfo';
import { StarInfo } from './ui/StarInfo';
import { SatInfo } from './ui/SatInfo';
import { TurboSelector } from './ui/TurboSelector';
import { TourUI } from './ui/TourUI';
import { AIChat } from './ui/AIChat';
import { ControlPanel } from './ui/ControlPanel';
import { TOURS } from './data/tours';
import { AIGuide } from './engine/ai/AIGuide';
import { AIVoice } from './engine/ai/AIVoice';
import { AudioManager } from './engine/audio/AudioManager';

const params = new URLSearchParams(location.search);
const container = document.getElementById('app');
if (!container) throw new Error('#app topilmadi');

// AI + Voice
const voice = new AIVoice();
const guide = new AIGuide(voice);

// Ambient audio
const audio = new AudioManager();

// UI panellari
const planetInfo = new PlanetInfo();
const starInfo = new StarInfo();
const satInfo = new SatInfo();
const turboSelector = new TurboSelector();
const tourUI = new TourUI();

const renderer = new Renderer(container);
const sceneHandle = createScene(
  renderer.canvas,
  planetInfo,
  starInfo,
  satInfo,
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

const aiChat = new AIChat(guide, voice, (open) => controlPanel.setAIActive(open));

const controlPanel = new ControlPanel({
  onAudioToggle: async () => {
    const next = !audio.isEnabled();
    await audio.setEnabled(next);
    controlPanel.setAudioState(next);
  },
  onAIToggle: () => aiChat.toggle(),
  onTourStart: (i) => sceneHandle.tours.start(TOURS[i], sceneHandle.camera),
  onHelpToggle: () => showHelp(),
});

// ═══ WARM-UP — AI modelni oldindan "uyg'otish ═══
setTimeout(() => {
  guide.warmup();
}, 3000);

// Klaviatura
window.addEventListener('keydown', (e) => {
  if (aiChat.isOpen()) return;

  if (e.code === 'Digit7')
    sceneHandle.tours.start(TOURS[0], sceneHandle.camera);
  if (e.code === 'Digit8')
    sceneHandle.tours.start(TOURS[1], sceneHandle.camera);
  if (e.code === 'Digit9')
    sceneHandle.tours.start(TOURS[2], sceneHandle.camera);

  if (e.code === 'KeyM' && !e.ctrlKey && !e.metaKey) {
    const next = !audio.isEnabled();
    audio.setEnabled(next).then(() => controlPanel.setAudioState(next));
  }

  // Shift+S — ovozli o'qish
  if (e.code === 'KeyS' && e.shiftKey) {
    voice.setTTSEnabled(!voice.isTTSEnabled());
  }
});

function showHelp() {
  const existing = document.querySelector('.help-overlay');
  if (existing) existing.remove();

  const help = document.createElement('div');
  help.className = 'help-overlay';
  help.innerHTML = `
    <div class="help-panel">
      <h2>KOSMOS — Boshqaruv</h2>
      <table>
        <tr><td>W A S D</td><td>Harakat</td></tr>
        <tr><td>Space / Shift</td><td>Yuqoriga / pastga</td></tr>
        <tr><td>Sichqoncha sudrash</td><td>Atrofga qarash</td></tr>
        <tr><td>← → ↑ ↓</td><td>Kamera burish</td></tr>
        <tr><td>Z (bosib tur)</td><td>Turbo tanlash</td></tr>
        <tr><td>H</td><td>Uyga qaytish</td></tr>
        <tr><td>Tab / K</td><td>Sayyora almashtirish</td></tr>
        <tr><td>Sichqoncha bosish</td><td>Ob'ekt ma'lumoti</td></tr>
        <tr><td>G</td><td>AI gid</td></tr>
        <tr><td>Shift + S</td><td>Ovozli o'qish (TTS)</td></tr>
        <tr><td>M</td><td>Ambient audio</td></tr>
        <tr><td>1-6</td><td>Vaqt tezligi</td></tr>
        <tr><td>Shift + Space</td><td>Pauza</td></tr>
        <tr><td>T</td><td>Hozirga qaytish</td></tr>
        <tr><td>7 / 8 / 9</td><td>Guided turlar</td></tr>
        <tr><td>ESC</td><td>Yopish</td></tr>
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

const quality = new QualityManager(params);
const devPanel = new DevPanel(
  quality,
  sceneHandle.time,
  sceneHandle.controls,
  params,
);

function applySize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(
    Math.floor(w * quality.renderScale),
    Math.floor(h * quality.renderScale),
  );
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

  guide.setContext({
    distanceFromCenter: sceneHandle.getDistance(),
    currentTime: sceneHandle.time.format(),
  });

  const dist = sceneHandle.getDistance();
  const proximity = Math.min(
    1,
    Math.max(0, 1 - Math.log10(Math.max(dist, 100)) / 8),
  );
  audio.setProximity(proximity);

  const prevScale = quality.renderScale;
  quality.update(dt);
  if (prevScale !== quality.renderScale) applySize();

  renderer.render(sceneHandle.scene, sceneHandle.camera);
  devPanel.update(dt, sceneHandle.getDistance(), sceneHandle.getSpeed());
}

requestAnimationFrame(loop);