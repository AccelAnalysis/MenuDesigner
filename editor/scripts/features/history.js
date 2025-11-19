import { editorState } from '../core/state.js';
import { emit } from '../core/events.js';

const describeSnapshot = (snapshot) => {
  const name = snapshot?.config?.name ?? 'Snapshot';
  const updated = snapshot?.config?.updatedAt;
  if (!updated) return name;
  try {
    const date = new Date(updated);
    return `${name} · ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch (err) {
    return name;
  }
};

editorState.subscribe((state) => {
  emit('history:update', {
    entries: state.__history.slice(-20).map((snapshot, index) => ({
      id: index,
      label: describeSnapshot(snapshot),
    })),
  });
});
