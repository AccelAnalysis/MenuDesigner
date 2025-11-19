import { editorState } from '../core/state.js';
import { refreshSignedUrl } from '../utils/signed-url.js';
import { assertValidMenu } from '../../../shared/validator.js';
import { showConflictModal } from './conflict-resolution.js';

const REMOTE_KEY = 'digital-menu-remote';

let remoteConfig = JSON.parse(localStorage.getItem(REMOTE_KEY) ?? '{}');

const clone = (value) => JSON.parse(JSON.stringify(value));

const hasRemote = () => Boolean(remoteConfig?.url);

const persistRemoteConfig = () => {
  localStorage.setItem(REMOTE_KEY, JSON.stringify(remoteConfig));
};

const setRemoteStatus = (status) => {
  const { setRemoteStatus: updateStatus } = editorState.getState();
  updateStatus(status);
};

const deriveStatus = (state = editorState.getState()) => {
  if (!navigator.onLine) return 'offline';
  if (!hasRemote()) return 'idle';
  if (!state.snapshot?.dirtySince && remoteConfig.lastPublishedAt) {
    return 'synced';
  }
  return 'idle';
};

const syncRemoteStatus = (state = editorState.getState()) => {
  if (!navigator.onLine) {
    setRemoteStatus('offline');
    return;
  }
  if (['saving', 'conflict'].includes(state.remoteStatus)) return;
  const next = deriveStatus(state);
  if (next !== state.remoteStatus) {
    setRemoteStatus(next);
  }
};

const clearDirtyFlag = () => {
  editorState.setState((state) => ({
    ...state,
    snapshot: { ...state.snapshot, dirtySince: null },
  }));
};

editorState.subscribe((state) => syncRemoteStatus(state));

window.addEventListener('online', () => syncRemoteStatus());
window.addEventListener('offline', () => setRemoteStatus('offline'));

window.addEventListener('storage', (event) => {
  if (event.key !== REMOTE_KEY) return;
  try {
    remoteConfig = JSON.parse(event.newValue ?? '{}');
  } catch (err) {
    remoteConfig = {};
  }
  syncRemoteStatus();
});

export const configureRemote = (config) => {
  const normalized = { ...config };
  if (typeof normalized.url === 'string') normalized.url = normalized.url.trim();
  if (typeof normalized.token === 'string') normalized.token = normalized.token.trim();
  remoteConfig = {
    ...remoteConfig,
    ...normalized,
  };
  if (!remoteConfig.url) delete remoteConfig.url;
  if (!remoteConfig.token) delete remoteConfig.token;
  persistRemoteConfig();
  syncRemoteStatus();
};

export const getRemoteConfig = () => ({ ...remoteConfig });

const publishPayload = async ({ force = false } = {}) => {
  const url = await refreshSignedUrl(remoteConfig.url);
  const payload = assertValidMenu(clone(editorState.getState().snapshot.config));
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(remoteConfig.token ? { Authorization: `Bearer ${remoteConfig.token}` } : {}),
      ...(force ? { 'X-Force-Overwrite': '1' } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 409 && !force) {
    let detail = {};
    try {
      detail = await response.json();
    } catch (err) {
      detail = {};
    }
    const action = (await showConflictModal({
      message: detail.message ?? 'Someone else already published a newer version.',
      updatedBy: detail.updatedBy,
      updatedAt: detail.updatedAt,
      remoteVersion: detail.version,
      localVersion: payload.version,
    })) ?? 'dismiss';

    if (action === 'force') {
      return publishPayload({ force: true });
    }

    if (action === 'reload') {
      window.location.reload();
      return null;
    }

    const conflictError = new Error('Conflict unresolved');
    conflictError.code = 'CONFLICT';
    throw conflictError;
  }

  if (!response.ok) {
    const remoteError = new Error(`Remote save failed (${response.status})`);
    remoteError.code = 'REMOTE_ERROR';
    throw remoteError;
  }

  return payload;
};

export const saveToRemote = async () => {
  if (!hasRemote()) {
    throw new Error('Signed URL required');
  }

  if (!navigator.onLine) {
    setRemoteStatus('offline');
    throw new Error('Offline – connect to publish');
  }

  setRemoteStatus('saving');

  try {
    const payload = await publishPayload();
    if (!payload) return null;
    configureRemote({
      lastPublishedAt: payload.updatedAt,
      lastPublishedVersion: payload.version,
    });
    clearDirtyFlag();
    setRemoteStatus('synced');
    return payload;
  } catch (error) {
    if (error.code === 'CONFLICT') {
      setRemoteStatus('conflict');
    } else if (!navigator.onLine) {
      setRemoteStatus('offline');
    } else {
      setRemoteStatus('idle');
    }
    throw error;
  }
};

syncRemoteStatus();
