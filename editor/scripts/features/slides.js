import { editorState } from '../core/state.js';
import { createSlide } from '../core/models.js';

const findActiveGroup = (snapshot) =>
  snapshot.config.groups.find((group) => group.id === snapshot.activeGroupId) ??
  snapshot.config.groups[0];

export const addSlide = () => {
  const slide = createSlide();
  editorState.getState().mutateSnapshot((snapshot) => {
    const group = findActiveGroup(snapshot);
    if (!group) return;
    group.slides.push(slide);
    snapshot.activeSlideId = slide.id;
  });
};
