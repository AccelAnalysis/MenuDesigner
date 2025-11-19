import './panel-sections/remote-panel.js';
import './panel-sections/history-panel.js';
import './panel-sections/conflict-modal.js';

export const registerPanel = (store) => {
  const panel = document.getElementById('panel');
  panel.innerHTML = `
    <nav class="panel-tabs">
      <button data-tab="remote">Live Remote</button>
      <button data-tab="history">History</button>
    </nav>
    <section id="panel-content"></section>
  `;

  const content = panel.querySelector('#panel-content');
  content.dataset.panel = 'remote';

  store.subscribe(() => {
    content.textContent = `Active group: ${store.getState().snapshot.activeGroupId}`;
  });
};
