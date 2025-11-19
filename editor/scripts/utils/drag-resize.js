export const makeDraggable = (element) => {
  let startX = 0;
  let startY = 0;

  const onPointerDown = (event) => {
    startX = event.clientX - element.offsetLeft;
    startY = event.clientY - element.offsetTop;
    element.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!element.hasPointerCapture(event.pointerId)) return;
    element.style.left = `${event.clientX - startX}px`;
    element.style.top = `${event.clientY - startY}px`;
  };

  element.addEventListener('pointerdown', onPointerDown);
  element.addEventListener('pointermove', onPointerMove);
};
