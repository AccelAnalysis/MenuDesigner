import { editorState } from './core/state.js';
import { initializeStorage } from './core/storage.js';
import { registerPanel } from './ui/panel.js';
import { registerCanvas } from './ui/canvas.js';
import { registerSlideStrip } from './ui/slide-strip.js';
import { attachLiveStatusBar } from './ui/live-status-bar.js';
import './ui/shortcuts.js';
import './features/history.js';
import './features/remote-sync.js';

const bootstrap = async () => {
  initializeStorage(editorState);
  registerCanvas(editorState);
  registerPanel(editorState);
  registerSlideStrip(editorState);
  attachLiveStatusBar(editorState);

  console.log('Digital Menu Studio editor booted', editorState.getState());
};

bootstrap();
