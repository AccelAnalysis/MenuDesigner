import { on } from '../../core/events.js';
import { version } from '../../../shared/version.js';

const modal = document.createElement('dialog');
modal.className = 'conflict-modal';
modal.innerHTML = `
  <h3>Conflict Detected</h3>
  <p class="message"></p>
  <p class="details" hidden data-field="details"></p>
  <p class="version">Studio version ${version}</p>
  <form method="dialog">
    <button value="reload">Reload</button>
    <button value="force" class="danger">Force Save</button>
  </form>
`;

document.addEventListener('DOMContentLoaded', () => {
  document.body.appendChild(modal);
});

const detailsEl = modal.querySelector('[data-field="details"]');
const messageEl = modal.querySelector('.message');
let pendingResolver;

const formatDetails = ({ updatedBy, updatedAt, remoteVersion, localVersion }) => {
  const parts = [];
  if (remoteVersion || localVersion) {
    const versions = [remoteVersion ? `Live v${remoteVersion}` : null, localVersion ? `Yours v${localVersion}` : null]
      .filter(Boolean)
      .join(' · ');
    if (versions) parts.push(versions);
  }
  if (updatedBy) parts.push(`Published by ${updatedBy}`);
  if (updatedAt) {
    try {
      const date = new Date(updatedAt);
      parts.push(`Updated ${date.toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}`);
    } catch (err) {
      parts.push(`Updated ${updatedAt}`);
    }
  }
  return parts.join(' · ');
};

modal.addEventListener('close', () => {
  if (typeof pendingResolver === 'function') {
    pendingResolver(modal.returnValue || 'dismiss');
    pendingResolver = null;
  }
});

on('conflict:show', ({ message, resolve, ...details }) => {
  if (modal.open) {
    modal.close('dismiss');
  }
  messageEl.textContent = message ?? 'Someone else already published a newer version.';
  const info = formatDetails(details);
  if (info) {
    detailsEl.textContent = info;
    detailsEl.hidden = false;
  } else {
    detailsEl.hidden = true;
    detailsEl.textContent = '';
  }
  pendingResolver = resolve;
  modal.showModal();
});
