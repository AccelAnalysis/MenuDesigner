import { mountRemotePanel } from './panel-sections/remote-panel.js';
import { mountHistoryPanel } from './panel-sections/history-panel.js';
import { mountTileContentPanel } from './panel-sections/tile-content-panel.js';
import { mountTileStylesPanel } from './panel-sections/tile-styles-panel.js';
import { mountExportPanel } from './panel-sections/export-panel.js';

export const registerPanel = (store) => {
  const panel = document.getElementById('panel');
  if (!panel) return;
  panel.innerHTML = `
    <nav class="panel-tabs">
      <button data-tab="design" class="is-active">Design</button>
      <button data-tab="export">Export</button>
      <button data-tab="remote">Live Remote</button>
      <button data-tab="history">History</button>
    </nav>
    <section id="panel-content">
      <div class="panel-view" data-view="design"></div>
      <div class="panel-view" data-view="export" hidden></div>
      <div class="panel-view" data-view="remote" hidden></div>
      <div class="panel-view" data-view="history" hidden></div>
    </section>
  `;
  const buttons = Array.from(panel.querySelectorAll('.panel-tabs button'));
  const views = new Map();
  panel.querySelectorAll('.panel-view').forEach((view) => {
    views.set(view.dataset.view, view);
  });
  const switchTab = (tab) => {
    buttons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.tab === tab);
    });
    views.forEach((view, key) => {
      view.hidden = key !== tab;
    });
  };
  buttons.forEach((button) => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
  });
  switchTab('design');
  const designView = views.get('design');
  mountTileContentPanel(designView, store);
  mountTileStylesPanel(designView, store);
  mountExportPanel(views.get('export'), store);
  mountRemotePanel(views.get('remote'), store);
  mountHistoryPanel(views.get('history'), store);
};
