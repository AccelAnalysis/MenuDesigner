const listeners = new Map();

export const on = (event, handler) => {
  const handlers = listeners.get(event) ?? new Set();
  handlers.add(handler);
  listeners.set(event, handlers);
  return () => handlers.delete(handler);
};

export const emit = (event, detail) => {
  const handlers = listeners.get(event);
  if (!handlers) return;
  handlers.forEach((handler) => handler(detail));
};
