const VERSION = 'v5';
const STATIC_CACHE = `digital-menu-player-static-${VERSION}`;
const RUNTIME_CACHE = `digital-menu-player-runtime-${VERSION}`;
const CONFIG_CACHE = `digital-menu-player-config-${VERSION}`;
const CONFIG_INDEX_KEY = '/player/__config-index__';
const BACKGROUND_REFRESH_TAG = 'digital-menu-refresh';
const FALLBACK_REFRESH_INTERVAL = 15 * 60 * 1000;

const CORE_ASSETS = [
  '/',
  '/player/',
  '/player/index.html',
  '/player/styles/app.css',
  '/player/scripts/main-player.js',
  '/player/scripts/render.js',
  '/player/scripts/cache-first.js',
  '/player/scripts/auto-refresh.js',
  '/player/scripts/schedule.js',
  '/player/scripts/animations.js',
  '/player/manifest.json',
  '/player/icons/icon.svg',
];

const trackedConfigs = new Set();
let fallbackIntervalId;

const openCaches = () => Promise.all([caches.open(STATIC_CACHE), caches.open(RUNTIME_CACHE), caches.open(CONFIG_CACHE)]);

const toRequest = (input) => (typeof input === 'string' ? new Request(input) : input);

const precacheCoreAssets = async () => {
  const cache = await caches.open(STATIC_CACHE);
  await cache.addAll(CORE_ASSETS);
};

const cleanupOldCaches = async () => {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((name) => ![STATIC_CACHE, RUNTIME_CACHE, CONFIG_CACHE].includes(name))
      .map((name) => caches.delete(name))
  );
};

const persistTrackedConfigs = async () => {
  const cache = await caches.open(CONFIG_CACHE);
  await cache.put(
    CONFIG_INDEX_KEY,
    new Response(JSON.stringify([...trackedConfigs]), { headers: { 'Content-Type': 'application/json' } })
  );
};

const hydrateTrackedConfigs = async () => {
  const cache = await caches.open(CONFIG_CACHE);
  const stored = await cache.match(CONFIG_INDEX_KEY);
  if (!stored) return;
  try {
    const values = await stored.json();
    values.forEach((url) => trackedConfigs.add(url));
  } catch (error) {
    console.warn('Failed to parse config index cache', error);
  }
};

const fetchAndCache = async (request, cacheName) => {
  const normalizedRequest = toRequest(request);
  const cache = await caches.open(cacheName);
  const response = await fetch(normalizedRequest, { cache: 'no-store' });
  if (response && response.ok) {
    await cache.put(normalizedRequest, response.clone());
  }
  return response;
};

const refreshTrackedConfigs = async () => {
  if (!trackedConfigs.size) return;
  const cache = await caches.open(CONFIG_CACHE);
  await Promise.all(
    [...trackedConfigs].map(async (url) => {
      try {
        const request = toRequest(url);
        const response = await fetch(request, { cache: 'no-store' });
        if (response.ok) {
          await cache.put(request, response.clone());
        }
      } catch (error) {
        console.warn('Failed to refresh config', url, error);
      }
    })
  );
};

const startFallbackLoop = () => {
  if (fallbackIntervalId) return;
  fallbackIntervalId = setInterval(() => {
    refreshTrackedConfigs();
  }, FALLBACK_REFRESH_INTERVAL);
};

const scheduleBackgroundRefresh = async () => {
  if (!self.registration) {
    startFallbackLoop();
    return;
  }
  try {
    if ('periodicSync' in self.registration) {
      await self.registration.periodicSync.register(BACKGROUND_REFRESH_TAG, {
        minInterval: FALLBACK_REFRESH_INTERVAL,
      });
      return;
    }
    if ('sync' in self.registration) {
      await self.registration.sync.register(BACKGROUND_REFRESH_TAG);
      return;
    }
  } catch (error) {
    console.warn('Unable to register background refresh', error);
  }
  startFallbackLoop();
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      await precacheCoreAssets();
      await openCaches();
      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await cleanupOldCaches();
      await hydrateTrackedConfigs();
      await scheduleBackgroundRefresh();
      await refreshTrackedConfigs();
      self.clients.claim();
    })()
  );
});

const isJsonRequest = (request) => {
  if (request.destination === 'document') return false;
  const accept = request.headers.get('accept') || '';
  return request.url.endsWith('.json') || accept.includes('application/json');
};

const handleNavigationRequest = async (request) => {
  try {
    return await fetch(request);
  } catch (_) {
    const cache = await caches.open(STATIC_CACHE);
    const fallback = await cache.match('/player/index.html');
    if (fallback) return fallback;
    throw _;
  }
};

const handleAssetRequest = async (request, cacheName = STATIC_CACHE) => {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    if (cacheName !== STATIC_CACHE) {
      const fallback = await caches.match(request);
      if (fallback) return fallback;
    }
    throw error;
  }
};

const handleConfigRequest = async (request) => {
  const normalizedRequest = toRequest(request);
  const cache = await caches.open(CONFIG_CACHE);
  const cached = await cache.match(normalizedRequest);
  try {
    const response = await fetch(normalizedRequest, { cache: 'no-store' });
    if (response && response.ok) {
      await cache.put(normalizedRequest, response.clone());
    }
    return response;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  if (url.origin === self.location.origin) {
    if (isJsonRequest(request)) {
      event.respondWith(handleConfigRequest(request));
      return;
    }
    if (CORE_ASSETS.includes(url.pathname)) {
      event.respondWith(handleAssetRequest(request));
      return;
    }
    if (url.pathname.startsWith('/player/')) {
      event.respondWith(handleAssetRequest(request, RUNTIME_CACHE));
      return;
    }
  }
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

self.addEventListener('message', (event) => {
  const { type, url } = event.data || {};
  if (type === 'TRACK_CONFIG' && url) {
    trackedConfigs.add(url);
    event.waitUntil(
      (async () => {
        await persistTrackedConfigs();
        try {
          await fetchAndCache(url, CONFIG_CACHE);
        } catch (error) {
          console.warn('Unable to prefetch tracked config', url, error);
        }
      })()
    );
  }
  if (type === 'TRIGGER_REFRESH') {
    event.waitUntil(refreshTrackedConfigs());
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === BACKGROUND_REFRESH_TAG) {
    event.waitUntil(refreshTrackedConfigs());
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === BACKGROUND_REFRESH_TAG) {
    event.waitUntil(refreshTrackedConfigs());
  }
});
