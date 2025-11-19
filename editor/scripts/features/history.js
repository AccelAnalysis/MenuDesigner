import { editorState } from '../core/state.js';
import { emit } from '../core/events.js';

editorState.subscribe((state) => {
  emit('history:update', {
    entries: state.__history.slice(-20).map((snapshot, index) => ({
      id: index,
      label: snapshot.groups?.[0]?.name ?? 'Snapshot',
    })),
  });
});
