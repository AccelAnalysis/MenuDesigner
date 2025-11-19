const toArray = (value) => (Array.isArray(value) ? value : []);

const safeText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number' && Number.isFinite(value)) return value.toString();
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  return fallback;
};

const createIdFactory = (prefix) => {
  let counter = 0;
  return () => `${prefix}-${(counter += 1)}`;
};

const fallbackId = createIdFactory('menu');

const ensureId = (value, prefix) => {
  const normalized = safeText(value, '');
  if (normalized) return normalized;
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (_) {
      // ignore
    }
  }
  return fallbackId(prefix);
};

const normalizeBadges = (badges) => {
  if (!Array.isArray(badges)) return [];
  return badges.map((badge) => safeText(badge, '')).filter(Boolean);
};

const normalizePrice = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toFixed(2);
  }
  return safeText(value, '');
};

const normalizeTile = (tile = {}, index = 0) => {
  const content = tile.content ?? {};
  return {
    id: ensureId(tile.id, `tile-${index + 1}`),
    heading: safeText(content.heading ?? content.name ?? `Item ${index + 1}`, `Item ${index + 1}`),
    description: safeText(content.subheading ?? content.body ?? content.description, ''),
    price: normalizePrice(content.price ?? tile.price),
    badges: normalizeBadges(content.badges),
  };
};

const normalizeSlide = (slide = {}, index = 0) => {
  const duration = Number(slide.duration ?? slide.durationSeconds ?? 10);
  return {
    id: ensureId(slide.id, `slide-${index + 1}`),
    title: safeText(slide.title ?? slide.name ?? `Slide ${index + 1}`, `Slide ${index + 1}`),
    duration: Number.isFinite(duration) ? Math.max(3, Math.round(duration)) : 10,
    tiles: toArray(slide.tiles).map((tile, tileIndex) => normalizeTile(tile, tileIndex)),
  };
};

const normalizeGroup = (group = {}, index = 0) => ({
  id: ensureId(group.id, `group-${index + 1}`),
  name: safeText(group.name ?? group.title ?? `Group ${index + 1}`, `Group ${index + 1}`),
  slides: toArray(group.slides).map((slide, slideIndex) => normalizeSlide(slide, slideIndex)),
});

export const normalizeMenu = (raw = {}) => {
  const groups = toArray(raw.groups).map((group, index) => normalizeGroup(group, index));
  return {
    id: safeText(raw.id, ''),
    name: safeText(raw.name, 'Digital Menu'),
    theme: safeText(raw.theme, 'default') || 'default',
    updatedAt: safeText(raw.updatedAt, new Date().toISOString()),
    groups,
  };
};

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char));

const renderBadges = (badges) =>
  badges.length
    ? `<div class="player-badges">${badges.map((badge) => `<span class="player-badge">${escapeHtml(badge)}</span>`).join('')}</div>`
    : '';

const renderTile = (tile) => {
  const description = tile.description
    ? `<p class="player-tile-description">${escapeHtml(tile.description)}</p>`
    : '';
  const badges = renderBadges(tile.badges);
  const price = tile.price ? `<span class="player-tile-price">${escapeHtml(tile.price)}</span>` : '';
  return `
    <li class="player-tile" data-tile="${escapeHtml(tile.id)}">
      <div class="player-tile-content">
        <p class="player-tile-heading">${escapeHtml(tile.heading)}</p>
        ${description}
        ${badges}
      </div>
      ${price}
    </li>
  `;
};

const renderSlide = (slide) => `
  <article class="player-slide" data-slide="${escapeHtml(slide.id)}">
    <header class="player-slide-header">
      <h3>${escapeHtml(slide.title)}</h3>
      <span class="player-slide-duration">${slide.duration}s</span>
    </header>
    <ul class="player-slide-list">
      ${slide.tiles.map(renderTile).join('')}
    </ul>
  </article>
`;

const renderGroup = (group) => `
  <section class="player-group" data-group="${escapeHtml(group.id)}">
    <h2>${escapeHtml(group.name)}</h2>
    ${group.slides.map(renderSlide).join('')}
  </section>
`;

export const render = (menu) => {
  const normalized = normalizeMenu(menu);
  const root = document.getElementById('player-root');
  if (!root) return;
  if (!normalized.groups.length) {
    root.innerHTML = '<p class="player-empty">This menu does not have any groups yet.</p>';
    return;
  }
  root.innerHTML = `<div class="player-shell">${normalized.groups.map(renderGroup).join('')}</div>`;
};
