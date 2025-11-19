export const createSlide = ({ id, title = 'New Slide' } = {}) => ({
  id: id ?? crypto.randomUUID(),
  title,
  tiles: [],
  duration: 10,
});

export const createMenuGroup = ({ id, name = 'Main Menu' } = {}) => ({
  id: id ?? crypto.randomUUID(),
  name,
  slides: [createSlide({ title: 'Welcome' })],
});

export const createTile = ({ id, type = 'item', data = {} } = {}) => ({
  id: id ?? crypto.randomUUID(),
  type,
  data,
});
