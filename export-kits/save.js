const supportsFilePicker = typeof window !== 'undefined' && 'showSaveFilePicker' in window;

const downloadWithAnchor = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const saveWithPicker = async (blob, filename, options = {}) => {
  const type = options.mimeType ?? blob.type ?? 'application/octet-stream';
  const pickerOptions = {
    suggestedName: filename,
    types: [
      {
        description: options.description ?? 'Digital Menu export',
        accept: {
          [type]: options.extensions ?? ['.' + (filename.split('.').pop() ?? 'bin')],
        },
      },
    ],
  };
  const handle = await window.showSaveFilePicker(pickerOptions);
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
};

export const saveBlobAs = async (blob, filename, options = {}) => {
  if (!(blob instanceof Blob)) {
    throw new Error('saveBlobAs expects a Blob');
  }
  if (supportsFilePicker && options.usePicker !== false) {
    try {
      await saveWithPicker(blob, filename, options);
      return;
    } catch (error) {
      // Swallow abort errors and fall back to anchor downloads
      if (error?.name !== 'AbortError') {
        console.warn('File picker failed, falling back to download', error);
      }
    }
  }
  downloadWithAnchor(blob, filename);
};

export const saveTextAs = async (text, filename, options = {}) => {
  const blob = new Blob([text], { type: options.mimeType ?? 'text/plain' });
  await saveBlobAs(blob, filename, options);
};
