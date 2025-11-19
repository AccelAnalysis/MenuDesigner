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
    snapshot.activeTileId = nextTile.id;
  });
};

export const setActiveTile = (tileId) => {
  editorState.getState().mutateSnapshot(
    (snapshot) => {
      const slide = findActiveSlide(snapshot);
      if (!slide) {
        snapshot.activeTileId = null;
        return;
      }
      const exists = slide.tiles.some((tile) => tile.id === tileId);
      if (exists && snapshot.activeTileId === tileId) return;
      snapshot.activeTileId = exists ? tileId : slide.tiles[0]?.id ?? null;
    },
    { recordHistory: false, stamp: false }
  );
};

export const updateTilePosition = (tileId, position) => {
  editorState.getState().mutateSnapshot((snapshot) => {
    const slide = findActiveSlide(snapshot);
    if (!slide) return;
    const tile = slide.tiles.find((item) => item.id === tileId);
    if (!tile) return;
    tile.position = {
      ...tile.position,
      ...position,
    };
  });
};
