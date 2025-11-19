import { HISTORY_LIMIT } from './config.js';
import { createMenuConfig } from './models.js';
import { buildInitialSnapshot } from './state.js';
import { validateMenu } from '../../../shared/validator.js';

const STORAGE_KEY = 'digital-menu-studio';

const upgradeLegacySnapshot = (snapshot) => {
  if (!snapshot) return buildInitialSnapshot(createMenuConfig());
  if (snapshot.config) return snapshot;
  const config = createMenuConfig({ groups: snapshot.groups ?? [] });
  return {
    config,
    activeGroupId: snapshot.activeGroupId ?? config.groups[0]?.id ?? null,
    activeSlideId: snapshot.activeSlideId ?? config.groups[0]?.slides[0]?.id ?? null,
    dirtySince: snapshot.dirtySince ?? null,
  };
};

export const initializeStorage = (store) => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const normalizedSnapshot = upgradeLegacySnapshot(parsed.snapshot ?? parsed);
      const validation = validateMenu(normalizedSnapshot.config);
      if (!validation.valid) {
        console.warn('Saved menu failed validation', validation.errors);
      } else {
        const history = (parsed.history ?? []).map(upgradeLegacySnapshot).slice(-HISTORY_LIMIT);
        store.setState({
          snapshot: normalizedSnapshot,
          __history: history,
          __future: [],
        });
      }
    } catch (err) {
      console.warn('Failed to load saved snapshot', err);
    }
  }

  store.subscribe((state) => {
    const history = state.__history.slice(-HISTORY_LIMIT);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ snapshot: state.snapshot, history })
    );
  });
};

export const resetSnapshot = (store) => {
  const config = createMenuConfig();
  store.setState({
    snapshot: buildInitialSnapshot(config),
    __history: [],
    __future: [],
  });
  localStorage.removeItem(STORAGE_KEY);
};
