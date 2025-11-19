import { loadSchedule } from './schedule.js';
import { normalizeMenu, render } from './render.js';
import { registerServiceWorker } from './cache-first.js';
import './auto-refresh.js';

const params = new URLSearchParams(window.location.search);

const readInlineConfig = () => {
  const node = document.querySelector('script[type="application/json"][data-menu-config]');
  if (!node) return null;
  try {
    return JSON.parse(node.textContent || '{}');
  } catch (error) {
    console.warn('Failed to parse inline menu config', error);
    return null;
  }
};

const loadFromCandidates = async (urls = []) => {
  for (const url of urls) {
    if (!url) continue;
    try {
      const schedule = await loadSchedule(url);
      return schedule;
    } catch (error) {
      console.warn('Unable to load menu from', url, error);
    }
  }
  return null;
};

const renderMenu = (menu) => {
  render(normalizeMenu(menu));
};

const bootstrap = async () => {
  const inlineConfig = readInlineConfig();
  if (inlineConfig) {
    renderMenu(inlineConfig);
    registerServiceWorker();
    return;
  }

  const candidates = [];
  if (params.get('config')) {
    candidates.push(params.get('config'));
  }
  candidates.push('./menu.json');
  candidates.push('/export-kits/sample/menu.json');

  const schedule = await loadFromCandidates(candidates);
  if (!schedule) {
    const root = document.getElementById('player-root');
    if (root) {
      root.innerHTML = '<p class="player-error">Failed to load menu configuration.</p>';
    }
    return;
  }

  renderMenu(schedule);
  registerServiceWorker();
};

bootstrap();
