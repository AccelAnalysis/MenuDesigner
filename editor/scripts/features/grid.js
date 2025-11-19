export const snapToGrid = (value, gridSize = 8) =>
  Math.round(value / gridSize) * gridSize;
