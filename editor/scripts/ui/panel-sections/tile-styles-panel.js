import { editorState, getActiveTile } from '../../core/state.js';
import { updateTileStyle } from '../../features/tiles.js';

const LAYOUT_VARIANTS = [
  { value: 'classic', label: 'Classic stack' },
  { value: 'split', label: 'Split column' },
  { value: 'minimal', label: 'Minimal badges' },
];

const ensureColor = (value, fallback) => (typeof value === 'string' && value.startsWith('#') ? value : fallback);

export const mountTileStylesPanel = (container, store = editorState) => {
  if (!container) return;
  const section = document.createElement('section');
  section.className = 'panel-section tile-styles-panel';
  section.innerHTML = `
    <h3>Tile Styles</h3>
    <label>Background color<input type="color" name="backgroundColor" /></label>
    <label>Text color<input type="color" name="textColor" /></label>
    <label>Accent color<input type="color" name="accentColor" /></label>
    <label>Font size
      <input type="range" name="fontSize" min="20" max="96" step="2" />
      <span data-field="font-size-value"></span>
    </label>
    <label>Text align
      <select name="textAlign">
        <option value="left">Left</option>
        <option value="center">Center</option>
        <option value="right">Right</option>
      </select>
    </label>
    <label>Layout variant
      <select name="layoutVariant"></select>
    </label>
  `;
  container.appendChild(section);
  const inputs = {
    backgroundColor: section.querySelector('[name="backgroundColor"]'),
    textColor: section.querySelector('[name="textColor"]'),
    accentColor: section.querySelector('[name="accentColor"]'),
    fontSize: section.querySelector('[name="fontSize"]'),
    textAlign: section.querySelector('[name="textAlign"]'),
    layoutVariant: section.querySelector('[name="layoutVariant"]'),
  };
  const fontSizeValue = section.querySelector('[data-field="font-size-value"]');
  LAYOUT_VARIANTS.forEach(({ value, label }) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    inputs.layoutVariant.appendChild(option);
  });
  const getTile = () => getActiveTile(store.getState().snapshot);
  const setDisabled = (disabled) => {
    Object.values(inputs).forEach((input) => {
      input.disabled = disabled;
    });
  };
  const render = () => {
    const tile = getTile();
    if (!tile) {
      setDisabled(true);
      fontSizeValue.textContent = '—';
      section.dataset.state = 'empty';
      return;
    }
    setDisabled(false);
    inputs.backgroundColor.value = ensureColor(tile.style?.backgroundColor, '#ffffff');
    inputs.textColor.value = ensureColor(tile.style?.textColor, '#0f172a');
    inputs.accentColor.value = ensureColor(tile.style?.accentColor, '#2563eb');
    inputs.fontSize.value = tile.style?.fontSize ?? 32;
    inputs.textAlign.value = tile.style?.textAlign ?? 'left';
    inputs.layoutVariant.value = tile.style?.layoutVariant ?? 'classic';
    fontSizeValue.textContent = `${Math.round(tile.style?.fontSize ?? 32)}px`;
    section.dataset.state = 'ready';
  };
  const applyStyle = (name, value, finalize = false) => {
    const tile = getTile();
    if (!tile) return;
    const prepared = name === 'fontSize' ? Number(value) || tile.style?.fontSize || 32 : value;
    updateTileStyle(tile.id, { [name]: prepared }, finalize ? undefined : { recordHistory: false, stamp: false });
  };
  ['backgroundColor', 'textColor', 'accentColor'].forEach((name) => {
    const input = inputs[name];
    input.addEventListener('input', () => applyStyle(name, input.value, false));
    input.addEventListener('change', () => applyStyle(name, input.value, true));
  });
  inputs.fontSize.addEventListener('input', () => {
    fontSizeValue.textContent = `${inputs.fontSize.value}px`;
    applyStyle('fontSize', inputs.fontSize.value, false);
  });
  inputs.fontSize.addEventListener('change', () => applyStyle('fontSize', inputs.fontSize.value, true));
  inputs.textAlign.addEventListener('change', () => applyStyle('textAlign', inputs.textAlign.value, true));
  inputs.layoutVariant.addEventListener('change', () => applyStyle('layoutVariant', inputs.layoutVariant.value, true));
  render();
  store.subscribe(render);
};
