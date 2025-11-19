import { set, get } from 'idb-keyval';

const CACHE_KEY = 'digital-menu-cache';

export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/player/service-worker.js');
  }
};

export const cacheSchedule = (data) => set(CACHE_KEY, data);
export const readCachedSchedule = () => get(CACHE_KEY);
