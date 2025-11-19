import { configureRemote, getRemoteConfig, saveToRemote } from '../../features/remote-sync.js';

export const mountRemotePanel = (container) => {
  if (!container) return;
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
  const setStatus = (message) => {
    statusEl.textContent = message;
  };
  const populate = () => {
    const config = getRemoteConfig();
    urlInput.value = config.url ?? '';
    tokenInput.value = config.token ?? '';
    setStatus(config.url ? 'Ready to publish' : 'Not configured');
  };
  populate();
  publishButton.addEventListener('click', async () => {
    publishButton.disabled = true;
    setStatus('Saving...');
    configureRemote({ url: urlInput.value.trim(), token: tokenInput.value.trim() });
    try {
      await saveToRemote();
      setStatus('Published to Live Remote');
    } catch (error) {
      console.error('Failed to publish remote config', error);
      setStatus('Failed to publish');
    } finally {
      publishButton.disabled = false;
    }
  });
};
