import { editorState } from '../core/state.js';
import { createMenuGroup } from '../core/models.js';

export const addMenuGroup = (name = 'New Group') => {
  const group = createMenuGroup({ name });
  editorState.getState().mutateSnapshot((snapshot) => {
    snapshot.config.groups.push(group);
    snapshot.activeGroupId = group.id;
    snapshot.activeSlideId = group.slides[0]?.id ?? null;
  });
};
