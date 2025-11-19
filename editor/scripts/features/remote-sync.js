import { editorState } from '../core/state.js';
import { refreshSignedUrl } from '../utils/signed-url.js';
import { assertValidMenu } from '../../../shared/validator.js';

const REMOTE_KEY = 'digital-menu-remote';

let remoteConfig = JSON.parse(localStorage.getItem(REMOTE_KEY) ?? '{}');

const clone = (value) => JSON.parse(JSON.stringify(value));

export const configureRemote = (config) => {
  remoteConfig = { ...remoteConfig, ...config };
  localStorage.setItem(REMOTE_KEY, JSON.stringify(remoteConfig));
};

export const saveToRemote = async () => {
  if (!remoteConfig?.url) return;
  const url = await refreshSignedUrl(remoteConfig.url);
  const payload = assertValidMenu(clone(editorState.getState().snapshot.config));
  await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(remoteConfig.token ? { Authorization: `Bearer ${remoteConfig.token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
};
