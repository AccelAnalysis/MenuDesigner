import schema from './schema.json' assert { type: 'json' };

const TILE_TYPES = new Set(schema.definitions.tile.properties.type.enum);
const LAYOUT_TYPES = new Set(schema.definitions.slide.properties.layout.enum);

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);

const ensure = (condition, message, errors) => {
  if (!condition) errors.push(message);
};

const ensureString = (value, path, errors) => {
  ensure(typeof value === 'string' && value.trim().length > 0, `${path} must be a non-empty string`, errors);
};

const ensureNumber = (value, path, errors) => {
  ensure(typeof value === 'number' && Number.isFinite(value), `${path} must be a number`, errors);
};

const ensureArray = (value, path, errors, minLength = 0) => {
  ensure(Array.isArray(value) && value.length >= minLength, `${path} must be an array${minLength ? ` (min ${minLength})` : ''}`, errors);
};

const validateTile = (tile, path, errors) => {
  if (!isObject(tile)) {
    errors.push(`${path} must be an object`);
    return;
  }
  ensureString(tile.id, `${path}.id`, errors);
  ensure(TILE_TYPES.has(tile.type ?? ''), `${path}.type must be one of ${[...TILE_TYPES].join(', ')}`, errors);
  if (!isObject(tile.position)) {
    errors.push(`${path}.position must be an object`);
  } else {
    ensureNumber(tile.position.x, `${path}.position.x`, errors);
    ensureNumber(tile.position.y, `${path}.position.y`, errors);
    ensureNumber(tile.position.width, `${path}.position.width`, errors);
    ensureNumber(tile.position.height, `${path}.position.height`, errors);
  }
  if (!isObject(tile.content)) {
    errors.push(`${path}.content must be an object`);
  } else if (tile.content.badges) {
    ensure(
      Array.isArray(tile.content.badges),
      `${path}.content.badges must be an array`,
      errors
    );
  }
};

const validateSlide = (slide, path, errors) => {
  if (!isObject(slide)) {
    errors.push(`${path} must be an object`);
    return;
  }
  ensureString(slide.id, `${path}.id`, errors);
  ensureString(slide.title, `${path}.title`, errors);
  ensure(typeof slide.duration === 'number' && slide.duration >= 3, `${path}.duration must be >= 3 seconds`, errors);
  if (slide.layout) ensure(LAYOUT_TYPES.has(slide.layout), `${path}.layout must be one of ${[...LAYOUT_TYPES].join(', ')}`, errors);
  ensureArray(slide.tiles ?? [], `${path}.tiles`, errors);
  (slide.tiles ?? []).forEach((tile, index) => validateTile(tile, `${path}.tiles[${index}]`, errors));
};

const validateGroup = (group, path, errors) => {
  if (!isObject(group)) {
    errors.push(`${path} must be an object`);
    return;
  }
  ensureString(group.id, `${path}.id`, errors);
  ensureString(group.name, `${path}.name`, errors);
  ensureArray(group.slides ?? [], `${path}.slides`, errors, 1);
  (group.slides ?? []).forEach((slide, index) => validateSlide(slide, `${path}.slides[${index}]`, errors));
};

export const validateMenu = (config) => {
  const errors = [];
  if (!isObject(config)) {
    errors.push('Menu config must be an object');
    return { valid: false, errors };
  }

  ensure(typeof config.version === 'number' && config.version >= 1, 'version must be a positive number', errors);
  ensureString(config.updatedAt ?? '', 'updatedAt', errors);
  ensureString(config.theme ?? '', 'theme', errors);
  ensure(isObject(config.canvas), 'canvas must be an object', errors);
  if (isObject(config.canvas)) {
    ensureNumber(config.canvas.width, 'canvas.width', errors);
    ensureNumber(config.canvas.height, 'canvas.height', errors);
    ensureString(config.canvas.background ?? '', 'canvas.background', errors);
    ensure(typeof config.canvas.gridSize === 'number' && config.canvas.gridSize >= 4, 'canvas.gridSize must be >= 4', errors);
  }

  ensureArray(config.groups ?? [], 'groups', errors, 1);
  (config.groups ?? []).forEach((group, index) => validateGroup(group, `groups[${index}]`, errors));

  return { valid: errors.length === 0, errors };
};

export const assertValidMenu = (config) => {
  const result = validateMenu(config);
  if (!result.valid) {
    throw new Error(`Invalid menu config: ${result.errors.join('; ')}`);
  }
  return config;
};

export { schema };
