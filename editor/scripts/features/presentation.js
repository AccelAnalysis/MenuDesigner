import { editorState } from '../core/state.js';
import { assertValidMenu } from '../../../shared/validator.js';

const clone = (value) =>
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

export const buildPresentation = () => {
  const { snapshot } = editorState.getState();
  const payload = clone(snapshot.config);
  payload.version = snapshot.config.version ?? 1;
  payload.updatedAt = new Date().toISOString();
  return assertValidMenu(payload);
};
