import { createStore } from 'zustand/vanilla';
import { createMenuGroup } from './models.js';

const initialGroup = createMenuGroup({ name: 'Main Menu' });

export const editorState = createStore((set) => ({
  snapshot: {
    groups: [initialGroup],
    activeGroupId: initialGroup.id,
    activeSlideId: initialGroup.slides[0].id,
  },
  __history: [],
  __future: [],
  updateSnapshot(partial) {
    set((state) => ({
      __history: [...state.__history, state.snapshot],
      __future: [],
      snapshot: { ...state.snapshot, ...partial },
    }));
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
        __history: [...state.__history, state.snapshot],
        __future: rest,
      };
    });
  },
}));
