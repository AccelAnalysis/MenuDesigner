import { on } from '../../core/events.js';
import { version } from '../../../shared/version.js';

const modal = document.createElement('dialog');
modal.className = 'conflict-modal';
modal.innerHTML = `
  <h3>Conflict Detected</h3>
  <p class="message"></p>
  <p class="version">Studio version ${version}</p>
  <form method="dialog">
    <button value="reload">Reload</button>
    <button value="force">Force Save</button>
  </form>
`;

document.addEventListener('DOMContentLoaded', () => {
  document.body.appendChild(modal);
});

on('conflict:show', ({ message }) => {
  modal.querySelector('.message').textContent = message;
  modal.showModal();
});
