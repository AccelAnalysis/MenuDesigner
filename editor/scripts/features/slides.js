import { editorState } from '../core/state.js';
import { createSlide } from '../core/models.js';

const clone = (value) =>
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

const findActiveGroup = (snapshot) =>
  snapshot.config.groups.find((group) => group.id === snapshot.activeGroupId) ??
  snapshot.config.groups[0];

const findSlideById = (group, slideId) => group?.slides.find((slide) => slide.id === slideId);

const selectSlide = (snapshot, slide, { preserveTile = false } = {}) => {
  const previousTileId = snapshot.activeTileId;
  snapshot.activeSlideId = slide?.id ?? null;
  if (!slide) {
    snapshot.activeTileId = null;
    return;
  }
  const canPreserve = preserveTile && slide.tiles.some((tile) => tile.id === previousTileId);
  snapshot.activeTileId = canPreserve ? previousTileId : slide.tiles[0]?.id ?? null;
};

const duplicateSlideData = (slide) => {
  const payload = clone(slide);
  delete payload.id;
  payload.tiles = (payload.tiles ?? []).map((tile) => {
    const copy = clone(tile);
    delete copy.id;
    return copy;
  });
  return createSlide(payload);
};

export const addSlide = () => {
  const slide = createSlide();
  editorState.getState().mutateSnapshot((snapshot) => {
    const group = findActiveGroup(snapshot);
    if (!group) return;
    group.slides.push(slide);
    selectSlide(snapshot, slide);
  });
};

export const setActiveSlide = (slideId) => {
  editorState.getState().mutateSnapshot(
    (snapshot) => {
      const group = findActiveGroup(snapshot);
      if (!group) {
        snapshot.activeSlideId = null;
        snapshot.activeTileId = null;
        return;
      }
      const nextSlide = findSlideById(group, slideId) ?? group.slides[0] ?? null;
      const preserve = nextSlide?.id === snapshot.activeSlideId;
      selectSlide(snapshot, nextSlide, { preserveTile: preserve });
    },
    { recordHistory: false, stamp: false }
  );
};

export const deleteSlide = (slideId) => {
  editorState.getState().mutateSnapshot((snapshot) => {
    const group = findActiveGroup(snapshot);
    if (!group) return;
    const targetId = slideId ?? snapshot.activeSlideId;
    const index = group.slides.findIndex((slide) => slide.id === targetId);
    if (index === -1) return;
    group.slides.splice(index, 1);
    if (!group.slides.length) {
      group.slides.push(createSlide());
    }
    const nextIndex = Math.min(index, group.slides.length - 1);
    selectSlide(snapshot, group.slides[nextIndex]);
  });
};

export const duplicateSlide = (slideId) => {
  editorState.getState().mutateSnapshot((snapshot) => {
    const group = findActiveGroup(snapshot);
    if (!group) return;
    const targetId = slideId ?? snapshot.activeSlideId;
    const index = group.slides.findIndex((slide) => slide.id === targetId);
    if (index === -1) return;
    const copy = duplicateSlideData(group.slides[index]);
    group.slides.splice(index + 1, 0, copy);
    selectSlide(snapshot, copy);
  });
};

export const moveSlide = (slideId, targetIndex) => {
  editorState.getState().mutateSnapshot((snapshot) => {
    const group = findActiveGroup(snapshot);
    if (!group) return;
    const slides = group.slides;
    if (!slides.length) return;
    const sourceIndex = slides.findIndex((slide) => slide.id === slideId);
    if (sourceIndex === -1) return;
    const [slide] = slides.splice(sourceIndex, 1);
    const bounded = Math.max(0, Math.min(targetIndex, slides.length));
    slides.splice(bounded, 0, slide);
    if (slide.id === snapshot.activeSlideId) {
      selectSlide(snapshot, slide, { preserveTile: true });
    }
  });
};
