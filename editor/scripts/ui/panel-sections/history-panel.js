import { on } from '../../core/events.js';
import { editorState } from '../../core/state.js';

const container = document.createElement('div');
container.className = 'panel-section history-panel';
container.innerHTML = `
  <h3>History</h3>
  <ul id="history-list"></ul>
  <div class="actions">
    <button id="undo">Undo</button>
    <button id="redo">Redo</button>
  </div>
`;

document.addEventListener('DOMContentLoaded', () => {
  const panel = document.getElementById('panel');
  panel?.appendChild(container);

  container.querySelector('#undo').addEventListener('click', () =>
    editorState.getState().undo()
  );
  container.querySelector('#redo').addEventListener('click', () =>
    editorState.getState().redo()
  );
});

on('history:update', ({ entries }) => {
  const list = container.querySelector('#history-list');
  list.innerHTML = entries
    .map((entry) => `<li data-id="${entry.id}">${entry.label}</li>`)
    .join('');
});
