import { editorState } from '../core/state.js';

document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.key === 'z') {
    event.preventDefault();
    editorState.getState().undo();
  }
  if (event.ctrlKey && (event.key === 'y' || (event.shiftKey && event.key === 'Z'))) {
    event.preventDefault();
    editorState.getState().redo();
  }
});
