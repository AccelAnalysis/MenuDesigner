import { emit, on } from '../../core/events.js';
import { editorState } from '../../core/state.js';

export const mountHistoryPanel = (container) => {
  if (!container) return;
  const section = document.createElement('section');
  section.className = 'panel-section history-panel';
  section.innerHTML = `
    <h3>History</h3>
    <ul data-history-list></ul>
    <div class="panel-actions">
      <button type="button" data-action="undo">Undo</button>
      <button type="button" data-action="redo">Redo</button>
    </div>
  `;
  container.appendChild(section);
  const list = section.querySelector('[data-history-list]');
  const undoButton = section.querySelector('[data-action="undo"]');
  const redoButton = section.querySelector('[data-action="redo"]');
  undoButton.addEventListener('click', () => editorState.getState().undo());
  redoButton.addEventListener('click', () => editorState.getState().redo());
  const renderButtons = () => {
    const state = editorState.getState();
    undoButton.disabled = !state.__history.length;
    redoButton.disabled = !state.__future.length;
  };
  renderButtons();
  editorState.subscribe(renderButtons);
  list.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-entry]');
    if (!button) return;
    emit('history:restore', { id: button.dataset.entry });
  });

  const renderHistory = (entries = []) => {
    if (!entries.length) {
      list.innerHTML = '<li class="empty">No snapshots yet</li>';
      return;
    }
    list.innerHTML = entries
      .map(
        (entry) => `
          <li>
            <button type="button" data-entry="${entry.id}">${entry.label}</button>
          </li>
        `
      )
      .join('');
  };

  on('history:update', ({ entries }) => renderHistory(entries));
  renderHistory();
};
