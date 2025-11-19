import { createStore } from 'zustand/vanilla';
import { HISTORY_LIMIT } from './config.js';
import { createMenuConfig } from './models.js';

const clone = (value) =>
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

const initialConfig = createMenuConfig();

const getInitialIds = (config) => {
  const firstGroup = config.groups[0];
  const firstSlide = firstGroup?.slides[0];
  const firstTile = firstSlide?.tiles[0];
  return {
    groupId: firstGroup?.id ?? null,
    slideId: firstSlide?.id ?? null,
    tileId: firstTile?.id ?? null,
  };
};

export const buildInitialSnapshot = (config) => {
  const ids = getInitialIds(config);
  return {
    config,
    activeGroupId: ids.groupId,
    activeSlideId: ids.slideId,
    activeTileId: ids.tileId,
    dirtySince: null,
  };
};

const pushHistory = (state, nextSnapshot) => ({
  snapshot: nextSnapshot,
  __history: [...state.__history, state.snapshot].slice(-HISTORY_LIMIT),
  __future: [],
});

const applySnapshot = (state, nextSnapshot, { recordHistory = true, stamp = true } = {}) => {
  const prepared = stamp ? stampSnapshot(nextSnapshot) : nextSnapshot;
  if (!recordHistory) {
    return { ...state, snapshot: prepared };
  }
  return pushHistory(state, prepared);
};

const stampSnapshot = (snapshot) => {
  const timestamp = new Date().toISOString();
  snapshot.config.version = (snapshot.config.version ?? 1) + 1;
  snapshot.config.updatedAt = timestamp;
  snapshot.dirtySince = snapshot.dirtySince ?? timestamp;
  return snapshot;
};

export const editorState = createStore((set) => ({
  snapshot: buildInitialSnapshot(initialConfig),
  __history: [],
  __future: [],
  remoteStatus: 'idle',
  mutateSnapshot(mutator, options) {
    set((state) => {
      const draft = clone(state.snapshot);
      const result = mutator(draft) ?? draft;
      return applySnapshot(state, result, options);
    });
  },
  replaceSnapshot(nextSnapshot, options) {
    set((state) => applySnapshot(state, clone(nextSnapshot), options));
  },
  undo() {
    set((state) => {
      if (!state.__history.length) return state;
      const previous = state.__history[state.__history.length - 1];
      const history = state.__history.slice(0, -1);
      return {
        snapshot: previous,
        __history: history,
        __future: [state.snapshot, ...state.__future],
      };
    });
  },
  redo() {
    set((state) => {
      if (!state.__future.length) return state;
      const [next, ...rest] = state.__future;
      return {
        snapshot: next,
        __history: [...state.__history, state.snapshot].slice(-HISTORY_LIMIT),
        __future: rest,
      };
    });
  },
  setRemoteStatus(status) {
    set((state) => ({ ...state, remoteStatus: status }));
  },
}));

export const getActiveGroup = (snapshot) =>
  snapshot.config.groups.find((group) => group.id === snapshot.activeGroupId) ??
  snapshot.config.groups[0];

export const getActiveSlide = (snapshot) => {
  const group = getActiveGroup(snapshot);
  return group?.slides.find((slide) => slide.id === snapshot.activeSlideId) ?? group?.slides[0];
};

export const getActiveTile = (snapshot) => {
  const slide = getActiveSlide(snapshot);
  return slide?.tiles.find((tile) => tile.id === snapshot.activeTileId) ?? slide?.tiles[0];
};
