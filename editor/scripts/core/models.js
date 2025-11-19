import { DEFAULT_CANVAS } from './config.js';

const clone = (value) => ({ ...value });

const defaultTilePosition = () => ({
  x: 0,
  y: 0,
  width: 6,
  height: 2,
  rotation: 0,
});

const defaultTileStyle = () => ({
  backgroundColor: 'transparent',
  textColor: '#111111',
  accentColor: '#c0392b',
  fontSize: 42,
  fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif',
  textAlign: 'left',
});

const defaultTileContent = () => ({
  heading: 'New Item',
  subheading: '',
  body: '',
  price: '',
  badges: [],
  qrUrl: '',
  videoUrl: '',
});

export const createTile = ({
  id,
  type = 'item',
  position = {},
  content = {},
  style = {},
  media = null,
} = {}) => ({
  id: id ?? crypto.randomUUID(),
  type,
  position: { ...defaultTilePosition(), ...position },
  content: { ...defaultTileContent(), ...content },
  style: { ...defaultTileStyle(), ...style },
  media,
});

export const createSlide = ({
  id,
  title = 'New Slide',
  duration = 10,
  layout = 'freeform',
  background = '#ffffff',
  tiles = [],
} = {}) => ({
  id: id ?? crypto.randomUUID(),
  title,
  duration,
  layout,
  background,
  tiles: tiles.map((tile) => createTile(tile)),
});

export const createMenuGroup = ({
  id,
  name = 'Main Menu',
  description = '',
  slides,
  schedule = { days: ['mon', 'tue', 'wed', 'thu', 'fri'], start: '06:00', end: '22:00' },
} = {}) => ({
  id: id ?? crypto.randomUUID(),
  name,
  description,
  schedule,
  slides: (slides && slides.length ? slides : [createSlide({ title: 'Welcome' })]).map((slide) =>
    createSlide(slide)
  ),
});

export const createMenuConfig = ({
  id,
  name = 'Untitled Menu',
  theme = 'default',
  canvas = DEFAULT_CANVAS,
  version = 1,
  updatedAt,
  groups,
  branding = {
    logoUrl: '',
    primaryColor: '#c0392b',
    secondaryColor: '#0f1a2b',
    accentColor: '#ffd166',
  },
} = {}) => {
  const normalizedCanvas = { ...DEFAULT_CANVAS, ...canvas };
  const normalizedGroups = (groups && groups.length ? groups : [createMenuGroup({ name: 'Main Menu' })]).map(
    (group) => createMenuGroup(group)
  );

  return {
    id: id ?? crypto.randomUUID(),
    name,
    theme,
    canvas: clone(normalizedCanvas),
    branding: clone(branding),
    version,
    updatedAt: updatedAt ?? new Date().toISOString(),
    groups: normalizedGroups,
  };
};
