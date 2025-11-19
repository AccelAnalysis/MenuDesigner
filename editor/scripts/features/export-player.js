import { buildPresentation } from './presentation.js';

export const exportSingleFile = () => {
  const data = buildPresentation();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'menu.json';
  link.click();
  URL.revokeObjectURL(url);
};
