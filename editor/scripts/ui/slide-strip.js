import { getActiveGroup } from '../core/state.js';
import { addSlide, deleteSlide, duplicateSlide, moveSlide, setActiveSlide } from '../features/slides.js';

const buildSlideThumb = (slide, isActive, index) => `
  <div class="slide-thumb${isActive ? ' is-active' : ''}" data-slide-id="${slide.id}" data-index="${index}" draggable="true">
    <div class="slide-thumb__body">
      <strong>${index + 1}. ${slide.title || 'Untitled slide'}</strong>
      <span>${slide.tiles.length} tile${slide.tiles.length === 1 ? '' : 's'}</span>
    </div>
    <div class="slide-thumb__buttons">
      <button type="button" data-action="duplicate-slide" title="Duplicate slide">⧉</button>
      <button type="button" data-action="delete-slide" title="Delete slide">✕</button>
    </div>
  </div>
`;

const buildStrip = (group, snapshot) => {
  const slides = group.slides
    .map((slide, index) => buildSlideThumb(slide, slide.id === snapshot.activeSlideId, index))
    .join('');
  return `
    <header class="slide-strip__header">
      <div>
        <strong>${group.name}</strong>
        <span>${group.slides.length} slide${group.slides.length === 1 ? '' : 's'}</span>
      </div>
      <button type="button" data-action="add-slide">+ Add slide</button>
    </header>
    <div class="slide-strip__list" data-group-id="${group.id}" role="list">
      ${slides}
      <button class="slide-thumb slide-thumb--add" data-action="add-slide" type="button">+ Add slide</button>
    </div>
  `;
};

export const registerSlideStrip = (store) => {
  const strip = document.getElementById('slide-strip');
  let dragState = null;

  const render = () => {
    const { snapshot } = store.getState();
    const group = getActiveGroup(snapshot);
    if (!group) {
      strip.innerHTML = '<p class="slide-strip__empty" style="padding:1rem; text-align:center; color:#475467;">No slides available</p>';
      return;
    }
    strip.innerHTML = buildStrip(group, snapshot);
  };

  const handleClick = (event) => {
    const actionButton = event.target.closest('[data-action]');
    if (actionButton) {
      event.stopPropagation();
      const action = actionButton.dataset.action;
      if (action === 'add-slide') {
        addSlide();
        return;
      }
      const slideEl = actionButton.closest('[data-slide-id]');
      if (!slideEl) return;
      const slideId = slideEl.dataset.slideId;
      if (action === 'duplicate-slide') {
        duplicateSlide(slideId);
      } else if (action === 'delete-slide') {
        deleteSlide(slideId);
      }
      return;
    }
    const slideThumb = event.target.closest('.slide-thumb[data-slide-id]');
    if (slideThumb) {
      setActiveSlide(slideThumb.dataset.slideId);
    }
  };

  const handleDragStart = (event) => {
    const slideThumb = event.target.closest('.slide-thumb[data-slide-id]');
    if (!slideThumb) return;
    dragState = {
      slideId: slideThumb.dataset.slideId,
      index: Number(slideThumb.dataset.index ?? 0),
    };
    slideThumb.classList.add('is-dragging');
    event.dataTransfer?.setData('text/plain', dragState.slideId);
    event.dataTransfer?.setDragImage(slideThumb, slideThumb.clientWidth / 2, slideThumb.clientHeight / 2);
    event.dataTransfer?.setData('application/x-slide-id', dragState.slideId);
    event.dataTransfer?.effectAllowed = 'move';
  };

  const handleDragOver = (event) => {
    if (!dragState) return;
    const target = event.target.closest('.slide-thumb[data-slide-id], .slide-thumb--add');
    if (!target) return;
    event.preventDefault();
  };

  const handleDrop = (event) => {
    if (!dragState) return;
    event.preventDefault();
    const target = event.target.closest('.slide-thumb[data-slide-id], .slide-thumb--add');
    const { snapshot } = store.getState();
    const group = getActiveGroup(snapshot);
    if (!group) return;
    let targetIndex = group.slides.length;
    if (target?.dataset.slideId) {
      targetIndex = Number(target.dataset.index ?? 0);
      if (targetIndex > dragState.index) {
        targetIndex -= 1;
      }
    }
    if (dragState.index === targetIndex) {
      dragState = null;
      render();
      return;
    }
    moveSlide(dragState.slideId, targetIndex);
    dragState = null;
  };

  const handleDragEnd = (event) => {
    const thumb = event.target.closest('.slide-thumb.is-dragging');
    if (thumb) {
      thumb.classList.remove('is-dragging');
    }
    dragState = null;
  };

  strip.addEventListener('click', handleClick);
  strip.addEventListener('dragstart', handleDragStart);
  strip.addEventListener('dragover', handleDragOver);
  strip.addEventListener('drop', handleDrop);
  strip.addEventListener('dragend', handleDragEnd);

  render();
  store.subscribe(render);
};
