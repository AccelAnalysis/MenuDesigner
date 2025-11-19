const STORAGE_KEY = 'digital-menu-library';
const DEFAULT_COMPRESS_OPTIONS = { maxWidth: 1920, maxHeight: 1080, quality: 0.82, format: 'image/webp' };

const library = new Map();
const subscribers = new Set();
const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

export const getLibraryImages = () =>
  Array.from(library.values()).map(({ dataUrl, ...entry }) => ({ ...entry }));

const hasStorage = () => {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch (err) {
    return false;
  }
};

const notify = () => {
  const payload = getLibraryImages();
  subscribers.forEach((listener) => listener(payload));
};

const persist = () => {
  if (!hasStorage()) return;
  const payload = JSON.stringify(
    Array.from(library.values()).map(({ id, name, type, size, width, height, createdAt, dataUrl }) => ({
      id,
      name,
      type,
      size,
      width,
      height,
      createdAt,
      dataUrl,
    }))
  );
  window.localStorage.setItem(STORAGE_KEY, payload);
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const dataUrlToBlob = async (dataUrl) => {
  const response = await fetch(dataUrl);
  return await response.blob();
};

const decodeImage = async (file) => {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    return {
      width: bitmap.width,
      height: bitmap.height,
      image: bitmap,
      cleanup: () => bitmap.close?.(),
    };
  }
  return await new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight, image: img, cleanup: () => {} });
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    img.src = url;
  });
};

const canvasToBlob = (canvas, format, quality) =>
  new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), format, quality));

const compressImage = async (file, options = {}) => {
  const settings = { ...DEFAULT_COMPRESS_OPTIONS, ...options };
  const decoded = await decodeImage(file);
  const scale = Math.min(1, settings.maxWidth / decoded.width, settings.maxHeight / decoded.height);
  const width = Math.max(1, Math.round(decoded.width * scale));
  const height = Math.max(1, Math.round(decoded.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { alpha: true });
  context.drawImage(decoded.image, 0, 0, width, height);
  decoded.cleanup?.();
  const blob = (await canvasToBlob(canvas, settings.format, settings.quality)) ?? file;
  return {
    blob,
    width,
    height,
    type: blob.type || file.type,
    size: blob.size,
  };
};

const hydrateEntry = async (entry) => {
  const blob = await dataUrlToBlob(entry.dataUrl);
  return {
    ...entry,
    url: URL.createObjectURL(blob),
  };
};

const restoreLibrary = async () => {
  if (!hasStorage()) return;
  const serialized = window.localStorage.getItem(STORAGE_KEY);
  if (!serialized) return;
  try {
    const entries = JSON.parse(serialized);
    for (const entry of entries) {
      if (!entry?.dataUrl) continue;
      try {
        const hydrated = await hydrateEntry(entry);
        library.set(hydrated.id, hydrated);
      } catch (err) {
        console.warn('Failed to hydrate library item', err);
      }
    }
    notify();
  } catch (err) {
    console.warn('Failed to parse image library', err);
  }
};

if (typeof window !== 'undefined') {
  restoreLibrary();
}

const registerEntry = (entry) => {
  library.set(entry.id, entry);
  persist();
  notify();
  return { ...entry };
};

const isImageFile = (file) =>
  file && (file.type ? file.type.startsWith('image/') : supportedTypes.some((type) => file.name.endsWith(type.split('/')[1])));

const toFileArray = (fileList) => Array.from(fileList ?? []).filter(Boolean);

export const subscribeToLibrary = (listener) => {
  if (typeof listener !== 'function') return () => {};
  subscribers.add(listener);
  listener(getLibraryImages());
  return () => subscribers.delete(listener);
};

export const getImage = (idOrName) => {
  if (!idOrName) return null;
  const entry = library.get(idOrName);
  if (entry) return { ...entry };
  const fallback = Array.from(library.values()).find((item) => item.name === idOrName);
  return fallback ? { ...fallback } : null;
};

export const importImages = async (files, options) => {
  const accepted = toFileArray(files).filter((file) => isImageFile(file));
  const results = [];
  for (const file of accepted) {
    try {
      const compressed = await compressImage(file, options);
      const dataUrl = await blobToDataUrl(compressed.blob);
      const entry = registerEntry({
        id: crypto.randomUUID(),
        name: file.name,
        type: compressed.type,
        size: compressed.size,
        width: compressed.width,
        height: compressed.height,
        createdAt: new Date().toISOString(),
        dataUrl,
        url: URL.createObjectURL(compressed.blob),
      });
      results.push(entry);
    } catch (err) {
      console.warn('Failed to import image', err);
    }
  }
  return results;
};

export const addImage = async (file, options) => (await importImages([file], options))[0] ?? null;

export const registerImageDropzone = (element, options) => {
  if (!element) return () => {};
  const prevent = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  const handleDrag = (event) => {
    prevent(event);
    element.classList.add('is-dragover');
  };
  const handleLeave = (event) => {
    prevent(event);
    if (event.target === element) {
      element.classList.remove('is-dragover');
    }
  };
  const handleDrop = async (event) => {
    prevent(event);
    element.classList.remove('is-dragover');
    const files = event.dataTransfer
      ? event.dataTransfer.items
        ? Array.from(event.dataTransfer.items)
            .filter((item) => item.kind === 'file')
            .map((item) => item.getAsFile())
        : Array.from(event.dataTransfer.files ?? [])
      : [];
    const filtered = files.filter(Boolean);
    if (!filtered.length) return;
    await importImages(filtered, options);
  };
  element.addEventListener('dragenter', handleDrag);
  element.addEventListener('dragover', handleDrag);
  element.addEventListener('dragleave', handleLeave);
  element.addEventListener('drop', handleDrop);
  return () => {
    element.removeEventListener('dragenter', handleDrag);
    element.removeEventListener('dragover', handleDrag);
    element.removeEventListener('dragleave', handleLeave);
    element.removeEventListener('drop', handleDrop);
  };
};
