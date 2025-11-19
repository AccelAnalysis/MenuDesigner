import { configureRemote, getRemoteConfig, saveToRemote } from '../../features/remote-sync.js';

const REMOTE_KEY = 'digital-menu-remote';

const formatTimestamp = (value) => {
  if (!value) return '';
  try {
    const date = new Date(value);
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (err) {
    return value;
  }
};

export const mountRemotePanel = (container, store) => {
  if (!container || !store) return;
  const section = document.createElement('section');
  section.className = 'panel-section remote-panel';
  section.innerHTML = `
    <h3>Live Remote</h3>
    <p class="panel-description">Publish this menu to the pre-signed upload URL for tablets and players.</p>
    <label>Signed URL<input type="url" data-field="remote-url" placeholder="https://example.com/upload" /></label>
    <label>Token<input type="text" data-field="remote-token" placeholder="Optional bearer token" /></label>
    <div class="panel-actions">
      <button type="button" data-action="save-remote">Save & Publish</button>
      <span class="status" data-field="remote-status"></span>
    </div>
  `;
  container.appendChild(section);
  const urlInput = section.querySelector('[data-field="remote-url"]');
  const tokenInput = section.querySelector('[data-field="remote-token"]');
  const statusEl = section.querySelector('[data-field="remote-status"]');
  const publishButton = section.querySelector('[data-action="save-remote"]');
  let transientStatus = null;
  let transientTimer;

  const showTransientStatus = (message) => {
    transientStatus = message;
    if (transientTimer) clearTimeout(transientTimer);
    transientTimer = setTimeout(() => {
      transientStatus = null;
      render();
    }, 4000);
    render();
  };

  const populate = () => {
    const config = getRemoteConfig();
    urlInput.value = config.url ?? '';
    tokenInput.value = config.token ?? '';
    render();
  };

  const persistFields = () => {
    configureRemote({ url: urlInput.value, token: tokenInput.value });
    render();
  };

  const render = () => {
    if (transientStatus) {
      statusEl.textContent = transientStatus;
      return;
    }
    const config = getRemoteConfig();
    const state = store.getState();
    const remoteStatus = state.remoteStatus ?? 'idle';
    const dirty = Boolean(state.snapshot?.dirtySince);
    publishButton.disabled = !config.url || remoteStatus === 'saving';
    const messages = {
      idle: config.url ? (dirty ? 'Changes not published' : 'Ready to publish') : 'Not configured',
      saving: 'Publishing…',
      synced: config.lastPublishedAt
        ? `Published ${formatTimestamp(config.lastPublishedAt)}`
        : 'Published',
      offline: 'Offline – connect to publish',
      conflict: 'Resolve conflict to publish',
    };
    statusEl.textContent = messages[remoteStatus] ?? 'Ready';
  };

  populate();
  store.subscribe(render);

  urlInput.addEventListener('change', persistFields);
  tokenInput.addEventListener('change', persistFields);

  publishButton.addEventListener('click', async () => {
    persistFields();
    const config = getRemoteConfig();
    if (!config.url) {
      showTransientStatus('Paste a signed URL first');
      return;
    }
    publishButton.disabled = true;
    try {
      await saveToRemote();
      showTransientStatus('Published to Live Remote');
    } catch (error) {
      console.error('Failed to publish remote config', error);
      showTransientStatus(error?.message ?? 'Failed to publish');
    } finally {
      publishButton.disabled = false;
    }
  });

  window.addEventListener('storage', (event) => {
    if (event.key !== REMOTE_KEY) return;
    populate();
  });
};
