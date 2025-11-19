let etag;
const REFRESH_INTERVAL = 3 * 60 * 1000;

const checkForUpdate = async () => {
  const url = new URL(window.location.href);
  const configUrl = url.searchParams.get('config');
  if (!configUrl) return;
  const response = await fetch(configUrl, { method: 'HEAD' });
  if (!response.ok) return;
  if (etag && response.headers.get('etag') !== etag) {
    window.location.reload();
  }
  etag = response.headers.get('etag');
};

setInterval(checkForUpdate, REFRESH_INTERVAL);
