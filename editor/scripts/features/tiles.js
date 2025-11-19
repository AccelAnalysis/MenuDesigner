import { editorState } from '../core/state.js';
import { createTile } from '../core/models.js';

const findActiveSlide = (snapshot) => {
  const group = snapshot.config.groups.find((g) => g.id === snapshot.activeGroupId) ??
    snapshot.config.groups[0];
  return group?.slides.find((slide) => slide.id === snapshot.activeSlideId) ?? group?.slides[0];
};

export const addTile = (tile) => {
  const nextTile = createTile(tile);
  editorState.getState().mutateSnapshot((snapshot) => {
    const slide = findActiveSlide(snapshot);
    if (!slide) return;
    slide.tiles.push(nextTile);
  });
};
