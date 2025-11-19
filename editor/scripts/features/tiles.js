import { editorState } from '../core/state.js';
import { createTile } from '../core/models.js';

export const addTile = (tile) => {
  const nextTile = createTile(tile);
  editorState.setState((state) => {
    const groups = state.snapshot.groups.map((group) => {
      if (group.id !== state.snapshot.activeGroupId) return group;
      const slides = group.slides.map((slide) =>
        slide.id === state.snapshot.activeSlideId
          ? { ...slide, tiles: [...slide.tiles, nextTile] }
          : slide
      );
      return { ...group, slides };
    });
    return { snapshot: { ...state.snapshot, groups } };
  });
};
