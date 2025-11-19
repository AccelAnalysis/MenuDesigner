import { loadSchedule } from './schedule.js';
import { render } from './render.js';
import { registerServiceWorker } from './cache-first.js';
import './auto-refresh.js';

const params = new URLSearchParams(window.location.search);
const configUrl = params.get('config') ?? '/export-kits/sample/menu.json';

const bootstrap = async () => {
  const schedule = await loadSchedule(configUrl);
  render(schedule);
  registerServiceWorker();
};

bootstrap();
