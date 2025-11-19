import { editorState } from '../core/state.js';

export const buildPresentation = () => {
  const { snapshot } = editorState.getState();
  return {
    generatedAt: new Date().toISOString(),
    groups: snapshot.groups,
  };
};
