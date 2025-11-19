import { HISTORY_LIMIT } from './config.js';

const STORAGE_KEY = 'digital-menu-studio';

export const initializeStorage = (store) => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      store.setState({ snapshot: parsed.snapshot ?? parsed });
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
