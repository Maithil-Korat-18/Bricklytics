const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const apiOrigin = (() => {
  try {
    return new URL(apiBaseUrl, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
})();

/** Standard neutral fallback placeholder ONLY used when a property genuinely has 0 uploaded/imported images. */
export const DEFAULT_PROPERTY_PLACEHOLDER = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80';

/** Resolve API `/media/...` paths without changing external or preview URLs. */
export function getPropertyMediaUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  return `${apiOrigin}${url.startsWith('/') ? url : `/${url}`}`;
}

/**
 * Safely extract and resolve the primary cover image URL for any property data structure.
 * Handles arrays of image dicts [{url, is_cover}], arrays of string URLs, and top-level cover image fields.
 */
export function getPropertyCoverImage(property) {
  if (!property) return null;

  const images = property.images;
  if (Array.isArray(images) && images.length > 0) {
    // 1. Check for object marked with is_cover
    const coverObj = images.find((img) => img && typeof img === 'object' && img.is_cover);
    if (coverObj && coverObj.url) return getPropertyMediaUrl(coverObj.url);

    // 2. Check for first valid object with url
    const firstObj = images.find((img) => img && typeof img === 'object' && img.url);
    if (firstObj && firstObj.url) return getPropertyMediaUrl(firstObj.url);

    // 3. Check for first non-empty string in array
    const firstStr = images.find((img) => typeof img === 'string' && img.trim() !== '');
    if (firstStr) return getPropertyMediaUrl(firstStr);
  }

  // 4. Check top-level single image fields
  const singleCover = property.cover_image || property.property_image || property.image_url || property.image;
  if (singleCover && typeof singleCover === 'string' && singleCover.trim() !== '') {
    return getPropertyMediaUrl(singleCover);
  }

  return null;
}

/**
 * Normalizes property images into a clean array of objects: [{ id, url, is_cover, caption }].
 * Supports arrays of objects, arrays of strings, or single cover fields.
 */
export function getPropertyImages(property) {
  if (!property) return [];

  const images = property.images;
  if (Array.isArray(images) && images.length > 0) {
    const list = images
      .map((img, idx) => {
        if (!img) return null;
        if (typeof img === 'string') {
          return { id: `img-${idx}`, url: getPropertyMediaUrl(img), is_cover: idx === 0 };
        }
        if (typeof img === 'object' && img.url) {
          return {
            id: img.id || `img-${idx}`,
            url: getPropertyMediaUrl(img.url),
            is_cover: Boolean(img.is_cover),
            caption: img.caption || '',
          };
        }
        return null;
      })
      .filter(Boolean);

    if (list.length > 0) return list;
  }

  const singleCover = getPropertyCoverImage(property);
  if (singleCover) {
    return [{ id: 'img-0', url: singleCover, is_cover: true }];
  }

  return [];
}

