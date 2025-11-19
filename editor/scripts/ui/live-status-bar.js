import { emit } from '../core/events.js';

const STATUS_LABELS = {
  synced: 'Synced',
  saving: 'Saving…',
  offline: 'Offline',
  conflict: 'Conflict',
  idle: 'Idle',
};

const formatDirtySince = (dirtySince) => {
  if (!dirtySince) return '';
  try {
    const date = new Date(dirtySince);
    return `Last change ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch (err) {
    return `Last change ${dirtySince}`;
  }
};

export const attachLiveStatusBar = (store) => {
  const status = document.querySelector('.live-status');
  if (!status) return;

  const render = (state) => {
    const currentStatus = state?.remoteStatus ?? 'idle';
    status.dataset.status = currentStatus;
    status.textContent = STATUS_LABELS[currentStatus] ?? STATUS_LABELS.idle;
    status.title = state?.snapshot?.dirtySince ? formatDirtySince(state.snapshot.dirtySince) : '';
  };

  render(store.getState());
  store.subscribe(render);

  emit('status:ready');
};
