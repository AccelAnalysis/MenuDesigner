import { validateMenu } from '../../shared/validator.js';
import { cacheSchedule, readCachedSchedule } from './cache-first.js';

const parseRefreshInterval = (headers) => {
  const refreshHeader = headers.get('x-menu-refresh') || headers.get('x-refresh-interval');
  if (refreshHeader) {
    const parsed = Number(refreshHeader);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed * 1000;
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

const normalizeConfigUrl = (value) => {
  try {
    return new URL(value, window.location.href).toString();
  } catch (_) {
    return value;
  }
};

export const loadSchedule = async (configUrl) => {
  const url = normalizeConfigUrl(configUrl);
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to load schedule');
    const json = await response.json();
    const result = validateMenu(json);
    if (!result.valid) {
      throw new Error(`Menu config invalid: ${result.errors.join('; ')}`);
    }
    const metadata = {
      etag: response.headers.get('etag'),
      refreshInterval: parseRefreshInterval(response.headers),
    };
    await cacheSchedule(url, json, metadata);
    return json;
  } catch (networkError) {
    const cached = await readCachedSchedule(url);
    if (cached?.data) {
      console.warn('Serving cached menu after network failure', networkError);
      return cached.data;
    }
    throw networkError;
  }
};
