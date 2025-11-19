import { set, get } from 'idb-keyval';

const CACHE_KEY = 'digital-menu-cache-v2';
const MAX_ENTRIES = 5;

const normalizeUrl = (value) => {
  try {
    return new URL(value, window.location.href).toString();
  } catch (_) {
    return value;
  }
};

const readStore = async () => {
  const current = (await get(CACHE_KEY)) || {};
  if (!current.entries) {
    return { entries: {} };
  }
  return current;
};

const writeStore = (next) => set(CACHE_KEY, next);

const dispatchCacheEvent = (detail) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('menu-cache:updated', { detail }));
};

const postMessageToServiceWorker = async (payload) => {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const target = navigator.serviceWorker.controller || registration?.active;
    target?.postMessage(payload);
  } catch (error) {
    console.warn('Unable to notify service worker', error);
  }
};

export const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/player/service-worker.js');
  }
 };

export const cacheSchedule = async (configUrl, data, metadata = {}) => {
  if (!configUrl) return null;
  const url = normalizeUrl(configUrl);
  const store = await readStore();
  const now = Date.now();
  const record = {
    data,
    cachedAt: now,
    etag: metadata.etag || null,
    refreshInterval: metadata.refreshInterval || null,
    expiresAt: metadata.refreshInterval ? now + metadata.refreshInterval : null,
  };
  store.entries[url] = record;
  const keys = Object.keys(store.entries);
  if (keys.length > MAX_ENTRIES) {
    keys
      .sort((a, b) => (store.entries[a].cachedAt || 0) - (store.entries[b].cachedAt || 0))
      .slice(0, keys.length - MAX_ENTRIES)
      .forEach((key) => delete store.entries[key]);
  }
  await writeStore(store);
  dispatchCacheEvent({ configUrl: url, record });
  await postMessageToServiceWorker({ type: 'TRACK_CONFIG', url, refreshInterval: record.refreshInterval });
  return record;
};

export const cacheSchedule = async (configUrl, data, metadata = {}) => {
  if (!configUrl) return null;
  const url = normalizeUrl(configUrl);
  const store = await readStore();
  const now = Date.now();
  const record = {
    data,
    cachedAt: now,
    etag: metadata.etag || null,
    refreshInterval: metadata.refreshInterval || null,
    expiresAt: metadata.refreshInterval ? now + metadata.refreshInterval : null,
  };
  store.entries[url] = record;
  const keys = Object.keys(store.entries);
  if (keys.length > MAX_ENTRIES) {
    keys
      .sort((a, b) => (store.entries[a].cachedAt || 0) - (store.entries[b].cachedAt || 0))
      .slice(0, keys.length - MAX_ENTRIES)
      .forEach((key) => delete store.entries[key]);
  }
  await writeStore(store);
  dispatchCacheEvent({ configUrl: url, record });
  await postMessageToServiceWorker({ type: 'TRACK_CONFIG', url, refreshInterval: record.refreshInterval });
  return record;
};

export const readCachedSchedule = async (configUrl) => {
  if (!configUrl) return null;
  const url = normalizeUrl(configUrl);
  const store = await readStore();
  const record = store.entries[url];
  if (record) {
    record.lastAccessed = Date.now();
    await writeStore(store);
  }
  return record || null;
};
