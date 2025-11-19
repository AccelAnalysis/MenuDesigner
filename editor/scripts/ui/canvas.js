export const registerCanvas = (store) => {
  const canvas = document.getElementById('canvas');
  const render = () => {
    const { snapshot } = store.getState();
    canvas.textContent = `Slides: ${snapshot.groups[0].slides.length}`;
  };
  render();
  store.subscribe(render);
};
