import { editorState } from '../core/state.js';

export const addMenuGroup = (name) => {
  const id = crypto.randomUUID();
  editorState.setState((state) => ({
    snapshot: {
      ...state.snapshot,
      groups: [...state.snapshot.groups, { id, name, slides: [] }],
      activeGroupId: id,
    },
  }));
};
