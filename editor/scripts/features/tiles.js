import { editorState } from '../core/state.js';
import { createTile } from '../core/models.js';

const findActiveSlide = (snapshot) => {
  const group = snapshot.config.groups.find((g) => g.id === snapshot.activeGroupId) ??
    snapshot.config.groups[0];
  return group?.slides.find((slide) => slide.id === snapshot.activeSlideId) ?? group?.slides[0];
};

const normalizeTileType = (type) => {
  if (!type) return 'text';
  const normalized = String(type).toLowerCase();
  if (normalized === 'item') return 'text';
  return ['text', 'price', 'promo', 'qr', 'video'].includes(normalized) ? normalized : 'text';
};

export const TILE_VARIANTS = [
  { value: 'text', label: 'Text item' },
  { value: 'price', label: 'Price row' },
  { value: 'promo', label: 'Promo card' },
  { value: 'qr', label: 'QR call-to-action' },
  { value: 'video', label: 'Video highlight' },
];

export const addTile = (tile) => {
  const nextTile = createTile(tile);
  editorState.getState().mutateSnapshot((snapshot) => {
    const slide = findActiveSlide(snapshot);
    if (!slide) return;
    slide.tiles.push(nextTile);
    snapshot.activeTileId = nextTile.id;
  });
};

export const setActiveTile = (tileId) => {
  editorState.getState().mutateSnapshot(
    (snapshot) => {
      const slide = findActiveSlide(snapshot);
      if (!slide) {
        snapshot.activeTileId = null;
        return;
      }
      const exists = slide.tiles.some((tile) => tile.id === tileId);
      if (exists && snapshot.activeTileId === tileId) return;
      snapshot.activeTileId = exists ? tileId : slide.tiles[0]?.id ?? null;
    },
    { recordHistory: false, stamp: false }
  );
};

export const updateTilePosition = (tileId, position) => {
  editorState.getState().mutateSnapshot((snapshot) => {
    const slide = findActiveSlide(snapshot);
    if (!slide) return;
    const tile = slide.tiles.find((item) => item.id === tileId);
    if (!tile) return;
    tile.position = {
      ...tile.position,
      ...position,
    };
  });
};

const mutateTile = (tileId, mutator, options) => {
  const state = editorState.getState();
  const targetId = tileId ?? state.snapshot.activeTileId;
  if (!targetId) return;
  state.mutateSnapshot(
    (snapshot) => {
      const slide = findActiveSlide(snapshot);
      if (!slide) return;
      const tile = slide.tiles.find((item) => item.id === targetId);
      if (!tile) return;
      mutator(tile, snapshot);
    },
    options
  );
};

export const updateTileContent = (tileId, content, options) => {
  mutateTile(
    tileId,
    (tile) => {
      tile.content = {
        ...tile.content,
        ...content,
      };
    },
    options
  );
};

export const updateTileStyle = (tileId, style, options) => {
  mutateTile(
    tileId,
    (tile) => {
      tile.style = {
        ...tile.style,
        ...style,
      };
    },
    options
  );
};

export const updateTileType = (tileId, type, options) => {
  const normalized = normalizeTileType(type);
  mutateTile(
    tileId,
    (tile) => {
      tile.type = normalized;
    },
    options
  );
};

const readField = (formData, key) => (formData.get(key) ?? '').toString().trim();

const toBadgeList = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const buildFieldElement = (field, tile) => {
  const wrapper = document.createElement('label');
  wrapper.className = 'tile-editor-field';
  const heading = document.createElement('span');
  heading.className = 'field-label';
  heading.textContent = field.label;
  wrapper.appendChild(heading);
  let control;
  if (field.multiline) {
    control = document.createElement('textarea');
    control.rows = field.rows ?? 3;
  } else {
    control = document.createElement('input');
    control.type = field.inputType ?? 'text';
  }
  control.name = field.name;
  control.placeholder = field.placeholder ?? '';
  control.required = Boolean(field.required);
  const value = field.getValue ? field.getValue(tile) : tile?.content?.[field.name];
  control.value = value ?? '';
  if (field.maxLength) {
    control.maxLength = field.maxLength;
  }
  wrapper.appendChild(control);
  if (field.description) {
    const description = document.createElement('small');
    description.textContent = field.description;
    wrapper.appendChild(description);
  }
  return wrapper;
};

const TILE_EDITOR_CONFIG = {
  text: {
    title: 'Edit text tile',
    description: 'Update menu item titles, supporting copy, and pricing.',
    fields: [
      { name: 'heading', label: 'Heading', required: true, maxLength: 80 },
      { name: 'subheading', label: 'Subtitle', maxLength: 160 },
      { name: 'body', label: 'Body', multiline: true, rows: 3, description: 'Longer supporting copy for this tile.' },
      { name: 'price', label: 'Price', placeholder: '$12.00' },
    ],
    serialize: (formData) => ({
      type: 'text',
      content: {
        heading: readField(formData, 'heading'),
        subheading: readField(formData, 'subheading'),
        body: readField(formData, 'body'),
        price: readField(formData, 'price'),
      },
    }),
  },
  price: {
    title: 'Edit price tile',
    description: 'Highlight cost, modifiers, and badges.',
    fields: [
      { name: 'heading', label: 'Heading', required: true },
      { name: 'subheading', label: 'Details' },
      { name: 'price', label: 'Price', placeholder: '$8.50', required: true },
      {
        name: 'badges',
        label: 'Badges',
        description: 'Comma separated (e.g. "New, Chef favorite").',
        getValue: (tile) => (tile?.content?.badges ?? []).join(', '),
      },
    ],
    serialize: (formData) => ({
      type: 'price',
      content: {
        heading: readField(formData, 'heading'),
        subheading: readField(formData, 'subheading'),
        price: readField(formData, 'price'),
        badges: toBadgeList(readField(formData, 'badges')),
      },
    }),
  },
  promo: {
    title: 'Edit promo tile',
    description: 'Use promos for seasonal callouts or hero items.',
    fields: [
      { name: 'heading', label: 'Headline', required: true, maxLength: 80 },
      { name: 'body', label: 'Body', multiline: true, rows: 4, description: 'Describe the promotion or featured item.' },
      {
        name: 'badges',
        label: 'Badges',
        description: 'Comma separated labels (optional).',
        getValue: (tile) => (tile?.content?.badges ?? []).join(', '),
      },
    ],
    serialize: (formData) => ({
      type: 'promo',
      content: {
        heading: readField(formData, 'heading'),
        body: readField(formData, 'body'),
        badges: toBadgeList(readField(formData, 'badges')),
      },
    }),
  },
  qr: {
    title: 'Edit QR tile',
    description: 'Share links for loyalty, ordering, or surveys.',
    fields: [
      { name: 'heading', label: 'Headline', required: true },
      { name: 'body', label: 'Instructions', multiline: true, rows: 3 },
      {
        name: 'qrUrl',
        label: 'URL to encode',
        inputType: 'url',
        placeholder: 'https://example.com',
        required: true,
      },
    ],
    serialize: (formData) => ({
      type: 'qr',
      content: {
        heading: readField(formData, 'heading'),
        body: readField(formData, 'body'),
        qrUrl: readField(formData, 'qrUrl'),
      },
    }),
  },
  video: {
    title: 'Edit video tile',
    description: 'Spotlight motion content by pasting a streaming URL.',
    fields: [
      { name: 'heading', label: 'Title', required: true },
      { name: 'body', label: 'Description', multiline: true, rows: 3 },
      {
        name: 'videoUrl',
        label: 'Video URL',
        inputType: 'url',
        placeholder: 'https://cdn.example.com/video.mp4',
        required: true,
      },
    ],
    serialize: (formData) => ({
      type: 'video',
      content: {
        heading: readField(formData, 'heading'),
        body: readField(formData, 'body'),
        videoUrl: readField(formData, 'videoUrl'),
      },
    }),
  },
};

let modalElements = null;

const ensureTileEditorModal = () => {
  if (modalElements) return modalElements;
  const modal = document.createElement('dialog');
  modal.className = 'tile-editor-modal';
  const form = document.createElement('form');
  form.method = 'dialog';
  form.noValidate = true;
  const header = document.createElement('header');
  const titleEl = document.createElement('h3');
  const descriptionEl = document.createElement('p');
  descriptionEl.className = 'tile-editor-description';
  header.append(titleEl, descriptionEl);
  const fieldsRoot = document.createElement('div');
  fieldsRoot.className = 'tile-editor-fields';
  const footer = document.createElement('footer');
  footer.className = 'tile-editor-actions';
  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.textContent = 'Cancel';
  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = 'Save changes';
  footer.append(cancelButton, submitButton);
  form.append(header, fieldsRoot, footer);
  modal.appendChild(form);
  const attach = () => document.body.appendChild(modal);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach, { once: true });
  } else {
    attach();
  }
  modalElements = { modal, form, fieldsRoot, titleEl, descriptionEl, cancelButton, submitButton };
  return modalElements;
};

const applyTileEditorResult = (tileId, result, fallbackType) => {
  const prepared = result ?? {};
  const normalizedType = normalizeTileType(prepared.type ?? fallbackType);
  mutateTile(tileId, (tile) => {
    if (prepared.content) {
      tile.content = {
        ...tile.content,
        ...prepared.content,
      };
    }
    if (prepared.style) {
      tile.style = {
        ...tile.style,
        ...prepared.style,
      };
    }
    tile.type = normalizedType;
  });
};

export const openTileEditor = (tileId, { type } = {}) => {
  const state = editorState.getState();
  const slide = findActiveSlide(state.snapshot);
  const targetId = tileId ?? state.snapshot.activeTileId;
  const tile = slide?.tiles.find((item) => item.id === targetId);
  if (!tile) return;
  const resolvedType = normalizeTileType(type ?? tile.type);
  const config = TILE_EDITOR_CONFIG[resolvedType] ?? TILE_EDITOR_CONFIG.text;
  const { modal, form, fieldsRoot, titleEl, descriptionEl, cancelButton, submitButton } = ensureTileEditorModal();
  form.reset();
  fieldsRoot.innerHTML = '';
  config.fields.forEach((field) => fieldsRoot.appendChild(buildFieldElement(field, tile)));
  titleEl.textContent = config.title;
  descriptionEl.textContent = config.description ?? '';
  descriptionEl.hidden = !config.description;
  submitButton.textContent = config.cta ?? 'Save changes';
  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    form.removeEventListener('submit', handleSubmit);
    cancelButton.removeEventListener('click', handleCancel);
    modal.removeEventListener('close', handleDialogClose);
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const result = config.serialize(formData, tile) ?? {};
    applyTileEditorResult(tile.id, result, resolvedType);
    cleanup();
    modal.close();
  };
  const handleCancel = () => {
    cleanup();
    modal.close();
  };
  const handleDialogClose = () => {
    cleanup();
  };
  form.addEventListener('submit', handleSubmit);
  cancelButton.addEventListener('click', handleCancel);
  modal.addEventListener('close', handleDialogClose, { once: true });
  modal.showModal();
};
