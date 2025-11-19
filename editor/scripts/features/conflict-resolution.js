import { emit } from '../core/events.js';

export const showConflictModal = (payload) => {
  emit('conflict:show', payload);
};
