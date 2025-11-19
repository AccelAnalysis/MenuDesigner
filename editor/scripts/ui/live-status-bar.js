import { emit } from '../core/events.js';

export const attachLiveStatusBar = (store) => {
  const status = document.querySelector('.live-status');
  if (!status) return;

  const render = (state) => {
    status.dataset.status = state?.remoteStatus ?? 'idle';
    status.textContent =
      {
        synced: 'Synced',
        saving: 'Saving…',
        offline: 'Offline',
        conflict: 'Conflict',
        idle: 'Idle',
      }[status.dataset.status] ?? 'Idle';
  };

  render();
  store.subscribe(render);

  emit('status:ready');
};
