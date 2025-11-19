import { editorState } from '../core/state.js';
import { refreshSignedUrl } from '../utils/signed-url.js';

const REMOTE_KEY = 'digital-menu-remote';

const remoteConfig = JSON.parse(localStorage.getItem(REMOTE_KEY) ?? '{}');

export const configureRemote = (config) => {
  localStorage.setItem(REMOTE_KEY, JSON.stringify(config));
};

export const saveToRemote = async () => {
  if (!remoteConfig?.url) return;
  const url = await refreshSignedUrl(remoteConfig.url);
  const payload = editorState.getState().snapshot;
  await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(remoteConfig.token ? { Authorization: `Bearer ${remoteConfig.token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
};
