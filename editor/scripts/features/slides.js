import { editorState } from '../core/state.js';
import { createSlide } from '../core/models.js';

export const addSlide = () => {
  const slide = createSlide();
  editorState.setState((state) => {
    const groups = state.snapshot.groups.map((group) =>
      group.id === state.snapshot.activeGroupId
        ? { ...group, slides: [...group.slides, slide] }
        : group
    );
    return { snapshot: { ...state.snapshot, groups, activeSlideId: slide.id } };
  });
};
