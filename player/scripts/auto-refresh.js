const MIN_INTERVAL = 60 * 1000;
const DEFAULT_INTERVAL = 3 * 60 * 1000;
const MAX_INTERVAL = 20 * 60 * 1000;

let etag;
let nextDelay = DEFAULT_INTERVAL;
let timerId;
const configParam = new URLSearchParams(window.location.search).get('config');
const trackedConfigUrl = configParam
  ? new URL(configParam, window.location.href).toString()
  : null;

const scheduleNextCheck = (delay = nextDelay) => {
  const clamped = Math.min(MAX_INTERVAL, Math.max(MIN_INTERVAL, delay));
  nextDelay = clamped;
  clearTimeout(timerId);
  timerId = setTimeout(checkForUpdate, clamped);
};

const deriveIntervalFromHeaders = (headers) => {
  const refreshHeader = headers.get('x-menu-refresh') || headers.get('x-refresh-interval');
  if (refreshHeader) {
    const seconds = Number(refreshHeader);
    if (Number.isFinite(seconds) && seconds > 0) {
      return seconds * 1000;
    }
  }
  const retryAfter = headers.get('retry-after');
  if (retryAfter) {
    const retrySeconds = Number(retryAfter);
    if (Number.isFinite(retrySeconds) && retrySeconds > 0) {
      return retrySeconds * 1000;
    }
  }
  const cacheControl = headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  if (maxAgeMatch) {
    const maxAge = Number(maxAgeMatch[1]);
    if (Number.isFinite(maxAge) && maxAge > 0) {
      return maxAge * 1000;
    }
  }
  return null;
};

const updateEtagAndReloadIfNeeded = (response) => {
  const responseEtag = response.headers.get('etag');
  if (!responseEtag) return;
  if (etag && responseEtag !== etag) {
    window.location.reload();
    return;
  }
  etag = responseEtag;
};

export const applyRefreshHint = (intervalMs) => {
  if (!intervalMs) return;
  scheduleNextCheck(intervalMs);
};

const checkForUpdate = async () => {
  if (!trackedConfigUrl) return;
  try {
    let response = await fetch(trackedConfigUrl, { method: 'HEAD', cache: 'no-store' });
    if (response.status === 405) {
      response = await fetch(trackedConfigUrl, { method: 'GET', cache: 'no-store' });
    }
    if (!response.ok) throw new Error('Unable to check menu update');
    updateEtagAndReloadIfNeeded(response);
    const interval = deriveIntervalFromHeaders(response.headers);
    if (interval) {
      scheduleNextCheck(interval);
    } else {
      scheduleNextCheck(DEFAULT_INTERVAL);
    }
  } catch (error) {
    console.warn('Auto-refresh check failed', error);
    scheduleNextCheck(Math.min(MAX_INTERVAL, nextDelay * 1.5));
  }
};

if (trackedConfigUrl) {
  scheduleNextCheck(DEFAULT_INTERVAL);
  window.addEventListener('menu-cache:updated', (event) => {
    if (event.detail?.configUrl !== trackedConfigUrl) return;
    const hint = event.detail?.record?.refreshInterval;
    if (hint) {
      applyRefreshHint(hint);
    }
  });
}
