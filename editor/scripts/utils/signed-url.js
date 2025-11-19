export const refreshSignedUrl = async (url) => {
  const response = await fetch(url, { method: 'HEAD' });
  if (response.status === 403) {
    throw new Error('Signed URL expired');
  }
  return url;
};
