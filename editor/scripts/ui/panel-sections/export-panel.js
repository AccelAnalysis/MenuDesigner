import { buildInlineHtmlExport, buildJsonExport, buildZipBundleExport } from '../../features/export-player.js';
import { saveBlobAs } from '../../../../export-kits/save.js';

const EXPORT_ACTIONS = {
  json: {
    label: 'Menu JSON',
    description: 'Schema-validated config for remote players and APIs.',
    builder: buildJsonExport,
  },
  bundle: {
    label: 'Player bundle (.zip)',
    description: 'index.html + menu.json for USB sticks or kiosks.',
    builder: buildZipBundleExport,
  },
  inline: {
    label: 'Single file HTML',
    description: 'Self-contained player with inline assets.',
    builder: buildInlineHtmlExport,
  },
};

const createOption = (type, config) => {
  const card = document.createElement('article');
  card.className = 'export-card';
  card.innerHTML = `
    <header>
      <strong>${config.label}</strong>
    </header>
    <p>${config.description}</p>
    <button type="button" data-export-type="${type}">Download</button>
  `;
  return card;
};

export const mountExportPanel = (container) => {
  if (!container) return;
  const section = document.createElement('section');
  section.className = 'panel-section export-panel';
  section.innerHTML = `
    <h3>Export</h3>
    <p class="panel-description">Package this menu for offline players or hand-offs.</p>
    <div class="export-grid" data-export-grid></div>
    <div class="panel-status" data-export-status>Choose a format to begin.</div>
  `;
  container.appendChild(section);
  const grid = section.querySelector('[data-export-grid]');
  const statusEl = section.querySelector('[data-export-status]');

  Object.entries(EXPORT_ACTIONS).forEach(([type, config]) => {
    grid.appendChild(createOption(type, config));
  });

  const setStatus = (message) => {
    if (statusEl) statusEl.textContent = message;
  };

  grid.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-export-type]');
    if (!button) return;
    const { exportType } = button.dataset;
    const action = EXPORT_ACTIONS[exportType];
    if (!action) return;
    button.disabled = true;
    setStatus(`Preparing ${action.label}...`);
    try {
      const artifact = await action.builder();
      await saveBlobAs(artifact.blob, artifact.filename, { mimeType: artifact.blob.type });
      setStatus(`Saved ${artifact.filename}`);
    } catch (error) {
      console.error('Export failed', error);
      setStatus('Export failed. Check console for details.');
    } finally {
      button.disabled = false;
    }
  });
};
