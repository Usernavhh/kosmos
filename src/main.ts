import './style.css';
import { Renderer } from './engine/core/Renderer';
import { QualityManager } from './engine/core/QualityManager';
import { DevPanel } from './engine/core/DevPanel';
import { createScene } from './engine/scene/Scene';
import { PlanetInfo } from './ui/PlanetInfo';
import { StarInfo } from './ui/StarInfo';
import { TurboSelector } from './ui/TurboSelector';

const params = new URLSearchParams(location.search);

const container = document.getElementById('app');
if (!container) throw new Error('#app topilmadi');

const planetInfo = new PlanetInfo();
const starInfo = new StarInfo();
const turboSelector = new TurboSelector();

const renderer = new Renderer(container);

const sceneHandle = createScene(
  renderer.canvas,
  planetInfo,
  starInfo,
  {
    onTurboShow: (i) => turboSelector.show(i),
    onTurboSelect: (i) => turboSelector.update(i),
    onTurboHide: () => turboSelector.hide(),
  },
);

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

  const prevScale = quality.renderScale;
  quality.update(dt);
  if (prevScale !== quality.renderScale) applySize();

  renderer.render(sceneHandle.scene, sceneHandle.camera);
  devPanel.update(dt, sceneHandle.getDistance(), sceneHandle.getSpeed());
}

requestAnimationFrame(loop);