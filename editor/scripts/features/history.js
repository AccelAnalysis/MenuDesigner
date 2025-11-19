import { editorState } from '../core/state.js';
import { emit, on } from '../core/events.js';

const MAX_HISTORY_ENTRIES = 20;
let entryMap = new Map();

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

const buildEntryId = (snapshot, offset) =>
  `${snapshot.config?.updatedAt ?? snapshot.config?.version ?? 'snapshot'}-${offset}`;

const publishHistory = (state = editorState.getState()) => {
  const recentHistory = state.__history.slice(-MAX_HISTORY_ENTRIES);
  entryMap = new Map();
  const entries = recentHistory.map((snapshot, index) => {
    const offset = state.__history.length - recentHistory.length + index;
    const id = buildEntryId(snapshot, offset);
    entryMap.set(id, snapshot);
    return {
      id,
      label: describeSnapshot(snapshot),
    };
  });

  emit('history:update', {
    entries: entries.reverse(),
  });
};

editorState.subscribe((state) => publishHistory(state));
publishHistory();

on('history:restore', ({ id }) => {
  if (!id) return;
  const snapshot = entryMap.get(id);
  if (!snapshot) return;
  editorState.getState().replaceSnapshot(snapshot, { stamp: false });
});
