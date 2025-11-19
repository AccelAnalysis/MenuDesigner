import { emit } from '../core/events.js';

export const showConflictModal = (payload = {}) =>
  new Promise((resolve) => {
    emit('conflict:show', { ...payload, resolve });
  });
