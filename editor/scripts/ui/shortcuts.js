import { editorState } from '../core/state.js';

const isEditableTarget = (target) => {
  if (!target) return false;
  const element = target instanceof Element ? target : target.parentElement;
  if (!element) return false;
  const editable = element.closest('input, textarea, select, [contenteditable="true"]');
  if (!editable) return false;
  const tag = editable.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  return editable.isContentEditable;
};

document.addEventListener('keydown', (event) => {
  if (!(event.ctrlKey || event.metaKey)) return;
  if (isEditableTarget(event.target)) return;
  const key = event.key.toLowerCase();
  if (key === 'z' && !event.shiftKey) {
    event.preventDefault();
    editorState.getState().undo();
    return;
  }
  if (key === 'y' || (key === 'z' && event.shiftKey)) {
    event.preventDefault();
    editorState.getState().redo();
  }
});
