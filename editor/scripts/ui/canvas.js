import { getActiveSlide } from '../core/state.js';
import { createGridPattern, normalizePosition, positionToPixels, snapPointToGrid } from '../features/grid.js';
import { openTileEditor, setActiveTile, updateTilePosition } from '../features/tiles.js';

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

const supportedTileTypes = new Set(['text', 'price', 'promo', 'qr', 'video']);

const resolveTileType = (tile) => {
  const type = tile?.type ? String(tile.type).toLowerCase() : 'text';
  if (type === 'item') return 'text';
  return supportedTileTypes.has(type) ? type : 'text';
};

const renderTileMarkup = (tile) => {
  const type = resolveTileType(tile);
  const layoutVariant = tile.style?.layoutVariant ?? 'classic';
  const isSplit = layoutVariant === 'split';
  const isMinimal = layoutVariant === 'minimal';
  const content = tile.content ?? {};
  const heading = escapeHtml(content.heading ?? 'New item');
  const subheadingRaw = content.subheading ?? '';
  const bodyRaw = content.body ?? '';
  const priceRaw = content.price ?? '';
  const qrUrl = content.qrUrl ?? '';
  const videoUrl = content.videoUrl ?? '';
  const accent = tile.style?.accentColor ?? '#2563eb';
  const badges = Array.isArray(content.badges) ? content.badges : [];
  const price = priceRaw ? escapeHtml(priceRaw) : '';
  const rowStyles = ['display:flex', 'gap:1rem', 'font-weight:600'];
  if (isSplit) {
    rowStyles.push('flex-direction:column', 'align-items:flex-start', 'justify-content:flex-start');
  } else {
    rowStyles.push(`align-items:${price ? 'center' : 'flex-start'}`);
    rowStyles.push(`justify-content:${price ? 'space-between' : 'flex-start'}`);
  }
  const priceMarkup = price
    ? `<span class="tile-price" style="white-space:nowrap; font-size:${isSplit ? '0.85em' : '1em'}; align-self:${
        isSplit ? 'flex-start' : 'center'
      };">${price}</span>`
    : '';
  const secondarySource =
    type === 'promo' || type === 'video' || type === 'qr'
      ? bodyRaw || subheadingRaw
      : subheadingRaw || bodyRaw;
  const fallbackText = type === 'promo' ? 'Add promo details' : 'Tap to edit content';
  const secondary = escapeHtml((secondarySource ?? fallbackText) || fallbackText);
  const secondaryMarkup = !isMinimal
    ? `<p class="tile-subheading" style="margin:0.25rem 0 0; font-size:0.6em; opacity:0.9;">${secondary}</p>`
    : '';
  const badgeNodes = badges
    .filter((badge) => Boolean(badge))
    .map(
      (badge) =>
        `<span class="tile-badge" style="display:inline-flex; align-items:center; padding:0.15rem 0.6rem; border-radius:999px; background:${accent}15; color:${accent}; font-size:0.45em; letter-spacing:0.03em; text-transform:uppercase;">${escapeHtml(
          badge
        )}</span>`
    )
    .join('');
  const badgesMarkup = !isMinimal && badgeNodes
    ? `<div class="tile-badges" style="display:flex; gap:0.35rem; flex-wrap:wrap; margin-top:0.35rem;">${badgeNodes}</div>`
    : '';
  const extras = [];
  if (type === 'qr' && qrUrl) {
    extras.push(
      `<p class="tile-qr-url" style="margin:0.4rem 0 0; font-size:0.55em; word-break:break-all; color:${accent};">${escapeHtml(
        qrUrl
      )}</p>`
    );
  }
  if (type === 'video' && videoUrl) {
    extras.push(
      `<p class="tile-video-url" style="margin:0.5rem 0 0; font-size:0.55em; word-break:break-all; opacity:0.75;">${escapeHtml(
        videoUrl
      )}</p>`
    );
  }

  return `
    <div class="tile-content" style="color:${tile.style?.textColor ?? '#0f172a'}; text-align:${tile.style?.textAlign ?? 'left'}; font-size:${tile.style?.fontSize ?? 32}px;">
      <div class="tile-row" style="${rowStyles.join('; ')};">
        <span class="tile-heading">${heading}</span>
        ${priceMarkup}
      </div>
      ${secondaryMarkup}
      ${badgesMarkup}
      ${extras.join('')}
    </div>
  `;
};

const applySelectionStyles = (element, isSelected) => {
  element.classList.toggle('is-selected', Boolean(isSelected));
  element.style.border = isSelected ? '2px solid #2563eb' : '1px solid rgba(15, 23, 42, 0.12)';
  element.style.boxShadow = isSelected
    ? '0 0 0 2px rgba(37, 99, 235, 0.35), 0 12px 32px rgba(15, 23, 42, 0.12)'
    : '0 10px 30px rgba(15, 23, 42, 0.12)';
};

const createGuide = (orientation, offset) => {
  const guide = document.createElement('div');
  guide.className = `canvas-guide canvas-guide--${orientation}`;
  guide.style.position = 'absolute';
  guide.style.pointerEvents = 'none';
  guide.style.background = 'rgba(37, 99, 235, 0.45)';
  if (orientation === 'horizontal') {
    guide.style.left = '0';
    guide.style.right = '0';
    guide.style.height = '1px';
    guide.style.top = `${Math.round(offset)}px`;
  } else {
    guide.style.top = '0';
    guide.style.bottom = '0';
    guide.style.width = '1px';
    guide.style.left = `${Math.round(offset)}px`;
  }
  return guide;
};

export const registerCanvas = (store) => {
  const canvas = document.getElementById('canvas');
  Object.assign(canvas.style, {
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem',
    boxSizing: 'border-box',
    gap: '1rem',
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  });

  let currentStage = null;
  let currentTiles = new Map();
  let dragContext = null;
  let selectedTileId = null;
  let guideRefs = { horizontal: null, vertical: null };

  const detachStage = () => {
    if (!currentStage) return;
    currentStage.removeEventListener('pointerdown', pointerHandlers.pointerdown);
    currentStage.removeEventListener('pointermove', pointerHandlers.pointermove);
    currentStage.removeEventListener('pointerup', pointerHandlers.pointerup);
    currentStage.removeEventListener('pointercancel', pointerHandlers.pointercancel);
    currentStage = null;
    currentTiles.clear();
    dragContext = null;
    guideRefs = { horizontal: null, vertical: null };
  };

  const updateGuidePositions = (tileId) => {
    const tile = tileId ? currentTiles.get(tileId) : null;
    if (!tile) return;
    if (guideRefs.horizontal) {
      guideRefs.horizontal.style.top = `${Number(tile.dataset.y ?? 0)}px`;
    }
    if (guideRefs.vertical) {
      guideRefs.vertical.style.left = `${Number(tile.dataset.x ?? 0)}px`;
    }
  };

  const updateSelection = (tileId) => {
    if (!tileId) return;
    selectedTileId = tileId;
    currentTiles.forEach((element, id) => {
      applySelectionStyles(element, id === tileId);
    });
    updateGuidePositions(tileId);
  };

  const pointerHandlers = {
    pointerdown(event) {
      if (event.button !== undefined && event.button !== 0) return;
      const tileEl = event.target.closest('[data-tile-id]');
      if (!tileEl || !currentStage) return;
      event.preventDefault();
      updateSelection(tileEl.dataset.tileId);
      dragContext = {
        pointerId: event.pointerId,
        tileId: tileEl.dataset.tileId,
        element: tileEl,
        canvasWidth: Number(currentStage.dataset.canvasWidth ?? 0),
        canvasHeight: Number(currentStage.dataset.canvasHeight ?? 0),
        gridSize: Number(currentStage.dataset.gridSize ?? 8),
        tileWidth: Number(tileEl.dataset.width ?? tileEl.offsetWidth ?? 0),
        tileHeight: Number(tileEl.dataset.height ?? tileEl.offsetHeight ?? 0),
        hasMoved: false,
      };
      dragContext.stageRect = currentStage.getBoundingClientRect();
      const pointerX = event.clientX - dragContext.stageRect.left;
      const pointerY = event.clientY - dragContext.stageRect.top;
      dragContext.offsetX = pointerX - Number(tileEl.dataset.x ?? 0);
      dragContext.offsetY = pointerY - Number(tileEl.dataset.y ?? 0);
      tileEl.setPointerCapture(event.pointerId);
      tileEl.style.cursor = 'grabbing';
    },
    pointermove(event) {
      if (!dragContext || event.pointerId !== dragContext.pointerId || !currentStage) return;
      dragContext.stageRect = currentStage.getBoundingClientRect();
      const pointerX = event.clientX - dragContext.stageRect.left;
      const pointerY = event.clientY - dragContext.stageRect.top;
      const desiredPoint = {
        x: pointerX - dragContext.offsetX,
        y: pointerY - dragContext.offsetY,
      };
      const snapped = snapPointToGrid(
        desiredPoint,
        dragContext.gridSize,
        dragContext.canvasWidth,
        dragContext.canvasHeight,
        dragContext.tileWidth,
        dragContext.tileHeight
      );
      dragContext.element.style.left = `${snapped.x}px`;
      dragContext.element.style.top = `${snapped.y}px`;
      dragContext.element.dataset.x = snapped.x;
      dragContext.element.dataset.y = snapped.y;
      dragContext.preview = normalizePosition(
        { x: snapped.x, y: snapped.y, width: dragContext.tileWidth, height: dragContext.tileHeight },
        dragContext.canvasWidth,
        dragContext.canvasHeight
      );
      dragContext.hasMoved = true;
      if (dragContext.tileId === selectedTileId) {
        updateGuidePositions(dragContext.tileId);
      }
    },
    pointerup(event) {
      finishDrag(event);
    },
    pointercancel(event) {
      finishDrag(event);
    },
  };

  const finishDrag = (event) => {
    if (!dragContext || event.pointerId !== dragContext.pointerId) return;
    dragContext.element.releasePointerCapture(event.pointerId);
    dragContext.element.style.cursor = 'grab';
    if (dragContext.hasMoved && dragContext.preview) {
      updateTilePosition(dragContext.tileId, {
        x: dragContext.preview.x,
        y: dragContext.preview.y,
      });
    }
    if (dragContext.tileId !== selectedTileId) {
      updateSelection(dragContext.tileId);
    }
    setActiveTile(dragContext.tileId);
    dragContext = null;
  };

  const attachStage = (stage) => {
    detachStage();
    stage.addEventListener('pointerdown', pointerHandlers.pointerdown);
    stage.addEventListener('pointermove', pointerHandlers.pointermove);
    stage.addEventListener('pointerup', pointerHandlers.pointerup);
    stage.addEventListener('pointercancel', pointerHandlers.pointercancel);
    currentStage = stage;
  };

  const render = () => {
    const { snapshot } = store.getState();
    const slide = getActiveSlide(snapshot);
    canvas.innerHTML = '';
    if (!slide) {
      const empty = document.createElement('div');
      empty.textContent = 'Select a slide to start designing';
      empty.style.padding = '2rem';
      empty.style.textAlign = 'center';
      empty.style.color = '#475467';
      canvas.appendChild(empty);
      detachStage();
      return;
    }

    const header = document.createElement('header');
    header.className = 'canvas__header';
    Object.assign(header.style, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontWeight: '600',
      fontSize: '1rem',
    });
    const titleEl = document.createElement('span');
    titleEl.textContent = slide.title;
    const countEl = document.createElement('span');
    countEl.textContent = `${slide.tiles.length} tile${slide.tiles.length === 1 ? '' : 's'}`;
    header.append(titleEl, countEl);

    const frame = document.createElement('div');
    Object.assign(frame.style, {
      flex: '1',
      overflow: 'auto',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '1rem',
    });

    const canvasConfig = snapshot.config.canvas;
    const stage = document.createElement('div');
    stage.className = 'canvas-stage';
    stage.dataset.canvasWidth = canvasConfig.width;
    stage.dataset.canvasHeight = canvasConfig.height;
    stage.dataset.gridSize = canvasConfig.gridSize ?? 8;
    Object.assign(stage.style, {
      position: 'relative',
      width: `${canvasConfig.width}px`,
      height: `${canvasConfig.height}px`,
      borderRadius: '36px',
      backgroundColor: slide.background ?? canvasConfig.background ?? '#ffffff',
      backgroundImage: createGridPattern(canvasConfig.gridSize ?? 8),
      backgroundSize: `${canvasConfig.gridSize ?? 8}px ${canvasConfig.gridSize ?? 8}px`,
      boxShadow: '0 40px 100px rgba(15, 23, 42, 0.18)',
    });

    const activeTileFromState = snapshot.activeTileId;
    const hasTile = slide.tiles.some((tile) => tile.id === selectedTileId);
    if (activeTileFromState && slide.tiles.some((tile) => tile.id === activeTileFromState)) {
      selectedTileId = activeTileFromState;
    } else if (!selectedTileId || !hasTile) {
      selectedTileId = slide.tiles[0]?.id ?? null;
    }

    currentTiles = new Map();
    guideRefs = { horizontal: null, vertical: null };
    let selectedRect = null;
    slide.tiles.forEach((tile) => {
      const rect = positionToPixels(tile.position ?? {}, canvasConfig.width, canvasConfig.height);
      const tileEl = document.createElement('article');
      tileEl.dataset.tileId = tile.id;
      tileEl.dataset.x = rect.x;
      tileEl.dataset.y = rect.y;
      tileEl.dataset.width = rect.width;
      tileEl.dataset.height = rect.height;
      Object.assign(tileEl.style, {
        position: 'absolute',
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        padding: '1.25rem',
        borderRadius: '28px',
        backgroundColor: tile.style?.backgroundColor ?? 'rgba(255,255,255,0.92)',
        boxSizing: 'border-box',
        cursor: 'grab',
        userSelect: 'none',
      });
      tileEl.innerHTML = renderTileMarkup(tile);
      tileEl.addEventListener('dblclick', () => openTileEditor(tile.id));
      const isSelected = tile.id === selectedTileId;
      applySelectionStyles(tileEl, isSelected);
      if (isSelected) {
        selectedRect = rect;
      }
      stage.appendChild(tileEl);
      currentTiles.set(tile.id, tileEl);
    });

    if (!slide.tiles.length) {
      const placeholder = document.createElement('p');
      placeholder.textContent = 'This slide has no tiles yet. Use the Tile tools to add items.';
      Object.assign(placeholder.style, {
        position: 'absolute',
        inset: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#475467',
        fontSize: '1rem',
      });
      stage.appendChild(placeholder);
    }

    if (selectedRect) {
      guideRefs.horizontal = createGuide('horizontal', selectedRect.y);
      guideRefs.vertical = createGuide('vertical', selectedRect.x);
      stage.appendChild(guideRefs.horizontal);
      stage.appendChild(guideRefs.vertical);
    }

    frame.appendChild(stage);
    canvas.append(header, frame);
    attachStage(stage);
  };

  render();
  store.subscribe(render);
  window.addEventListener('resize', render);
};
