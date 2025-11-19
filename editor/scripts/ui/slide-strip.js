export const registerSlideStrip = (store) => {
  const strip = document.getElementById('slide-strip');
  const render = () => {
    const { snapshot } = store.getState();
    strip.innerHTML = snapshot.groups[0].slides
      .map((slide) => `<div class="slide-thumb">${slide.title}</div>`)
      .join('');
  };
  render();
  store.subscribe(render);
};
