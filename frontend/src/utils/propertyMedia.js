const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const apiOrigin = (() => {
  try {
    return new URL(apiBaseUrl, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
})();

/** Resolve API `/media/...` paths without changing external or preview URLs. */
export function getPropertyMediaUrl(url) {
  if (!url || /^(https?:|blob:|data:)/i.test(url)) return url;
  return `${apiOrigin}${url.startsWith('/') ? url : `/${url}`}`;
}
