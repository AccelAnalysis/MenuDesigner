import { editorState, getActiveTile } from '../../core/state.js';
import { openTileEditor, TILE_VARIANTS, updateTileContent, updateTileType } from '../../features/tiles.js';

const parseBadges = (value = '') =>
  value
    .split(',')
    .map((badge) => badge.trim())
    .filter(Boolean);

export const mountTileContentPanel = (container, store = editorState) => {
  if (!container) return;
  const section = document.createElement('section');
  section.className = 'panel-section tile-content-panel';
  section.innerHTML = `
    <h3>Tile Content</h3>
    <p class="panel-description">Switch tile templates and refresh badges from one place.</p>
    <label>Tile type
      <select data-field="tile-type"></select>
    </label>
    <button type="button" data-action="edit-content">Open content editor</button>
    <label>Badges
      <textarea data-field="tile-badges" rows="2" placeholder="Comma separated badges (e.g. Gluten Free, New)"></textarea>
    </label>
  `;
  container.appendChild(section);
  const typeSelect = section.querySelector('[data-field="tile-type"]');
  const editButton = section.querySelector('[data-action="edit-content"]');
  const badgesInput = section.querySelector('[data-field="tile-badges"]');
  TILE_VARIANTS.forEach(({ value, label }) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    typeSelect.appendChild(option);
  });
  const getTile = () => getActiveTile(store.getState().snapshot);
  const setDisabled = (disabled) => {
    typeSelect.disabled = disabled;
    editButton.disabled = disabled;
    badgesInput.disabled = disabled;
  };
  const render = () => {
    const tile = getTile();
    if (!tile) {
      setDisabled(true);
      badgesInput.value = '';
      typeSelect.value = TILE_VARIANTS[0].value;
      section.dataset.state = 'empty';
      return;
    }
    setDisabled(false);
    const normalizedType = tile.type === 'item' ? 'text' : tile.type ?? 'text';
    if (typeSelect.value !== normalizedType) {
      typeSelect.value = normalizedType;
    }
    const badges = Array.isArray(tile.content?.badges) ? tile.content.badges : [];
    badgesInput.value = badges.join(', ');
    section.dataset.state = 'ready';
  };
  const applyBadges = (value, finalize = false) => {
    const tile = getTile();
    if (!tile) return;
    updateTileContent(tile.id, { badges: parseBadges(value) }, finalize ? undefined : { recordHistory: false, stamp: false });
  };
  badgesInput.addEventListener('input', () => applyBadges(badgesInput.value, false));
  badgesInput.addEventListener('change', () => applyBadges(badgesInput.value, true));
  typeSelect.addEventListener('change', () => {
    const tile = getTile();
    if (!tile) return;
    const selectedType = typeSelect.value;
    updateTileType(tile.id, selectedType, { recordHistory: false, stamp: false });
    openTileEditor(tile.id, { type: selectedType });
  });
  editButton.addEventListener('click', () => {
    const tile = getTile();
    if (!tile) return;
    openTileEditor(tile.id);
  });
  render();
  store.subscribe(render);
};
