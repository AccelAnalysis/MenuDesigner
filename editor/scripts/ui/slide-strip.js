import { getActiveGroup } from '../core/state.js';

export const registerSlideStrip = (store) => {
  const strip = document.getElementById('slide-strip');
  const render = () => {
    const { snapshot } = store.getState();
    const group = getActiveGroup(snapshot);
    if (!group) {
      strip.innerHTML = '<p>No slides</p>';
      return;
    }
    strip.innerHTML = group.slides
      .map(
        (slide) =>
          `<div class="slide-thumb${slide.id === snapshot.activeSlideId ? ' is-active' : ''}">${slide.title}</div>`
      )
      .join('');
  };
  render();
  store.subscribe(render);
};
