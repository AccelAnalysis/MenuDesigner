const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const toPixels = (value = 0, dimension = 0) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return value > 1 ? value : value * dimension;
};

export const snapToGrid = (value, gridSize = 8) => Math.round(value / gridSize) * gridSize;

export const createGridPattern = (gridSize = 8, color = 'rgba(16, 24, 40, 0.08)') =>
  `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`;

export const positionToPixels = (position = {}, canvasWidth = 0, canvasHeight = 0) => ({
  x: toPixels(position.x ?? 0, canvasWidth),
  y: toPixels(position.y ?? 0, canvasHeight),
  width: toPixels(position.width ?? 0, canvasWidth),
  height: toPixels(position.height ?? 0, canvasHeight),
});

export const normalizePosition = (rect, canvasWidth = 0, canvasHeight = 0) => ({
  x: canvasWidth ? rect.x / canvasWidth : 0,
  y: canvasHeight ? rect.y / canvasHeight : 0,
  width: canvasWidth ? rect.width / canvasWidth : 0,
  height: canvasHeight ? rect.height / canvasHeight : 0,
});

export const snapPointToGrid = (
  point,
  gridSize = 8,
  canvasWidth = 0,
  canvasHeight = 0,
  tileWidth = 0,
  tileHeight = 0
) => {
  const x = clamp(point.x, 0, Math.max(canvasWidth - tileWidth, 0));
  const y = clamp(point.y, 0, Math.max(canvasHeight - tileHeight, 0));
  return {
    x: snapToGrid(x, gridSize),
    y: snapToGrid(y, gridSize),
  };
};
