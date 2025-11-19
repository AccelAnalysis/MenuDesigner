import { buildPresentation } from './presentation.js';

const JSON_MIME = 'application/json';
const HTML_MIME = 'text/html';
const ZIP_MIME = 'application/zip';
const PLAYER_STYLE_PATH = '../../../player/styles/app.css';
const PLAYER_RENDER_PATH = '../../../player/scripts/render.js';

const textEncoder = new TextEncoder();
let cachedStylesPromise;
let cachedRenderSourcePromise;
let cachedRuntimePromise;

const DEFAULT_STYLES = `:root {
  color-scheme: dark;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #0f172a;
  color: #f8fafc;
}

body {
  margin: 0;
  background: radial-gradient(circle at top, rgba(37, 99, 235, 0.25), transparent 55%), #020617;
  color: inherit;
}

#player-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3vw;
}

.player-error {
  font-size: 1.15rem;
  opacity: 0.85;
}`;

const FALLBACK_RENDER_SOURCE = `const normalizeMenu = (menu = {}) => ({
  name: menu.name ?? 'Digital Menu',
  theme: menu.theme ?? 'default',
  groups: Array.isArray(menu.groups) ? menu.groups : [],
});

const escapeHtml = (value = '') => String(value).replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char] ?? char));

const render = (menu = {}) => {
  const root = document.getElementById('player-root');
  if (!root) return;
  const title = escapeHtml(menu.name ?? 'Digital Menu');
  root.innerHTML = '<p class="player-error">' + title + '</p>';
};`;

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char] ?? char));

const escapeForScript = (value = '') => value.replace(/<\/script/gi, '<' + '/script');
const escapeForStyle = (value = '') => value.replace(/<\/style/gi, '<' + '/style');

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'menu';

const toBytes = (value) => (typeof value === 'string' ? textEncoder.encode(value) : value);

const buildCrcTable = () => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let crc = i;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    table[i] = crc >>> 0;
  }
  return table;
};

const CRC_TABLE = buildCrcTable();

const crc32 = (bytes) => {
  let crc = 0xffffffff;
  for (let index = 0; index < bytes.length; index += 1) {
    const byte = bytes[index];
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const toDosDateTime = (timestamp = Date.now()) => {
  const date = new Date(timestamp);
  const year = Math.max(1980, date.getFullYear());
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  return { dosDate, dosTime };
};

const createZipArchive = (files, timestamp = Date.now()) => {
  const { dosDate, dosTime } = toDosDateTime(timestamp);
  const records = [];
  const localChunks = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = toBytes(file.path);
    const dataBytes = toBytes(file.content);
    const crc = crc32(dataBytes);
    const header = new Uint8Array(30);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, dosTime, true);
    view.setUint16(12, dosDate, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, dataBytes.length, true);
    view.setUint32(22, dataBytes.length, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);
    const chunk = new Uint8Array(header.length + nameBytes.length + dataBytes.length);
    chunk.set(header, 0);
    chunk.set(nameBytes, header.length);
    chunk.set(dataBytes, header.length + nameBytes.length);
    localChunks.push(chunk);
    records.push({ nameBytes, crc, size: dataBytes.length, offset, dosDate, dosTime });
    offset += chunk.length;
  });

  const centralChunks = [];
  let centralSize = 0;
  records.forEach((record) => {
    const central = new Uint8Array(46 + record.nameBytes.length);
    const view = new DataView(central.buffer);
    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, record.dosTime, true);
    view.setUint16(14, record.dosDate, true);
    view.setUint32(16, record.crc, true);
    view.setUint32(20, record.size, true);
    view.setUint32(24, record.size, true);
    view.setUint16(28, record.nameBytes.length, true);
    view.setUint16(30, 0, true);
    view.setUint16(32, 0, true);
    view.setUint16(34, 0, true);
    view.setUint16(36, 0, true);
    view.setUint32(38, 0, true);
    view.setUint32(42, record.offset, true);
    central.set(record.nameBytes, 46);
    centralChunks.push(central);
    centralSize += central.length;
  });

  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, records.length, true);
  endView.setUint16(10, records.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);

  const totalSize = offset + centralSize + end.length;
  const zip = new Uint8Array(totalSize);
  let cursor = 0;
  localChunks.forEach((chunk) => {
    zip.set(chunk, cursor);
    cursor += chunk.length;
  });
  centralChunks.forEach((chunk) => {
    zip.set(chunk, cursor);
    cursor += chunk.length;
  });
  zip.set(end, cursor);
  return zip;
};

const fetchText = async (path) => {
  const url = new URL(path, import.meta.url);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${path}`);
  return await response.text();
};

const getPlayerStyles = async () => {
  if (!cachedStylesPromise) {
    cachedStylesPromise = fetchText(PLAYER_STYLE_PATH).catch(() => DEFAULT_STYLES);
  }
  return cachedStylesPromise;
};

const sanitizeModuleSource = (source) =>
  source
    .replace(/export\s+const\s+/g, 'const ')
    .replace(/export\s+function\s+/g, 'function ')
    .replace(/export\s+default/g, 'const defaultExport =')
    .replace(/export\s+\{[^}]+\};?/g, '')
    .trim();

const getRenderSource = async () => {
  if (!cachedRenderSourcePromise) {
    cachedRenderSourcePromise = fetchText(PLAYER_RENDER_PATH).then(sanitizeModuleSource).catch(() => FALLBACK_RENDER_SOURCE);
  }
  return cachedRenderSourcePromise;
};

const BOOTSTRAP_SCRIPT = `const readInlineConfig = () => {
  const node = document.querySelector('script[data-menu-config]');
  if (!node) return null;
  try {
    return JSON.parse(node.textContent || '{}');
  } catch (error) {
    console.warn('Failed to parse inline menu config', error);
    return null;
  }
};

const showRuntimeError = (message) => {
  const root = document.getElementById('player-root');
  if (root) {
    root.innerHTML = '<p class="player-error">' + message + '</p>';
  }
};

const bootPlayer = async () => {
  const inline = readInlineConfig();
  if (inline) {
    render(normalizeMenu(inline));
    return;
  }
  try {
    const response = await fetch('./menu.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const payload = await response.json();
    render(normalizeMenu(payload));
  } catch (error) {
    console.error('Failed to load bundled menu', error);
    showRuntimeError('Unable to load menu data.');
  }
};

bootPlayer();`;

const getRuntimeSource = async () => {
  if (!cachedRuntimePromise) {
    cachedRuntimePromise = (async () => {
      const renderSource = await getRenderSource();
      return `${renderSource}
${BOOTSTRAP_SCRIPT}`;
    })();
  }
  return cachedRuntimePromise;
};

const buildPlayerHtml = async (config, { inlineData = false } = {}) => {
  const [styles, runtime] = await Promise.all([getPlayerStyles(), getRuntimeSource()]);
  const title = `${config.name ?? 'Digital Menu'} · Menu Player`;
  const theme = config.theme ?? 'default';
  const inlineScript = inlineData
    ? `    <script type="application/json" data-menu-config>
${escapeForScript(JSON.stringify(config, null, 2))}
    </script>
`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
${escapeForStyle(styles)}
    </style>
  </head>
  <body>
    <div id="player-root" class="player-root" data-theme="${escapeHtml(theme)}"></div>
${inlineScript}    <script>
${escapeForScript(runtime)}
    </script>
  </body>
</html>
`;
};

const createJsonArtifact = (config, slug) => {
  const json = JSON.stringify(config, null, 2);
  return {
    filename: `${slug}.json`,
    blob: new Blob([json], { type: JSON_MIME }),
  };
};

const createInlineHtmlArtifact = async (config, slug) => {
  const html = await buildPlayerHtml(config, { inlineData: true });
  return {
    filename: `${slug}-player.html`,
    blob: new Blob([html], { type: HTML_MIME }),
  };
};

const createZipArtifact = async (config, slug) => {
  const html = await buildPlayerHtml(config, { inlineData: false });
  const json = JSON.stringify(config, null, 2);
  const updatedAt = Date.parse(config.updatedAt ?? '') || Date.now();
  const zipBytes = createZipArchive(
    [
      { path: 'index.html', content: html },
      { path: 'menu.json', content: json },
    ],
    updatedAt
  );
  return {
    filename: `${slug}-bundle.zip`,
    blob: new Blob([zipBytes], { type: ZIP_MIME }),
  };
};

const prepareConfig = () => {
  const config = buildPresentation();
  const slug = slugify(config.name ?? config.id ?? 'menu');
  return { config, slug };
};

export const buildJsonExport = async () => {
  const { config, slug } = prepareConfig();
  return createJsonArtifact(config, slug);
};

export const buildInlineHtmlExport = async () => {
  const { config, slug } = prepareConfig();
  return await createInlineHtmlArtifact(config, slug);
};

export const buildZipBundleExport = async () => {
  const { config, slug } = prepareConfig();
  return await createZipArtifact(config, slug);
};
