import { getActiveSlide } from '../core/state.js';

export const registerCanvas = (store) => {
  const canvas = document.getElementById('canvas');
  const render = () => {
    const { snapshot } = store.getState();
    const slide = getActiveSlide(snapshot);
    if (!slide) {
      canvas.textContent = 'No slide selected';
      return;
    }
    canvas.textContent = `Slide: ${slide.title} (${slide.tiles.length} tiles)`;
  };
  render();
  store.subscribe(render);
};
