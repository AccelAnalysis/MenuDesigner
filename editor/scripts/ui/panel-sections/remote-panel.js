import { configureRemote, saveToRemote } from '../../features/remote-sync.js';

const template = document.createElement('template');
template.innerHTML = `
  <div class="panel-section">
    <h3>Live Remote</h3>
    <label>Signed URL<input type="url" name="remote-url" /></label>
    <label>Token<input type="text" name="remote-token" /></label>
    <button id="save-remote">Save & Publish</button>
  </div>
`;

export const mountRemotePanel = (container) => {
  container.appendChild(template.content.cloneNode(true));
  container.querySelector('#save-remote').addEventListener('click', async () => {
    const url = container.querySelector('[name="remote-url"]').value;
    const token = container.querySelector('[name="remote-token"]').value;
    configureRemote({ url, token });
    await saveToRemote();
  });
};
