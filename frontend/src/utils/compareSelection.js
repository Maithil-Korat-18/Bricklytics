import { buyerApi } from '../services/buyerApi';

const STORAGE_KEY = 'bricklytics_compare_property_ids';
const MAX_PROPERTIES = 12;

/**
 * Safely extracts a valid string property ID from an object, string, or number.
 */
export function getPropertyId(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string' || typeof val === 'number') {
    const s = String(val).trim();
    return s && s !== 'undefined' && s !== 'null' && s !== '[object Object]' ? s : null;
  }
  if (typeof val === 'object') {
    const raw = val.id || val._id || val.property_id;
    return raw ? getPropertyId(raw) : null;
  }
  return null;
}

/**
 * Normalizes an array/string/object into a clean, deduplicated list of max 12 valid string IDs.
 */
export function normalizeIds(rawInput) {
  let ids = rawInput;
  if (typeof ids === 'string') {
    try {
      ids = JSON.parse(ids);
    } catch {
      ids = ids.split(',');
    }
  }

  if (!Array.isArray(ids)) return [];

  const clean = ids
    .map(getPropertyId)
    .filter((id) => id !== null);

  return [...new Set(clean)].slice(0, MAX_PROPERTIES);
}

/**
 * Retrieves normalized comparison property IDs from localStorage.
 */
export function getComparePropertyIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return normalizeIds(raw);
  } catch (e) {
    console.error('Error reading compare property IDs from localStorage:', e);
    return [];
  }
}

/**
 * Saves normalized comparison property IDs to localStorage.
 */
export function saveComparePropertyIds(ids) {
  const normalized = normalizeIds(ids);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch (e) {
    console.error('Error writing compare property IDs to localStorage:', e);
  }
  return normalized;
}

/**
 * Fetches user's saved compare property list from DB and syncs with frontend state/localStorage cache.
 */
export async function syncCompareWithBackend() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) return getComparePropertyIds();

  try {
    const res = await buyerApi.getCompareList();
    if (res?.success && res?.data) {
      const serverIds = res.data.property_ids || (Array.isArray(res.data.properties) ? res.data.properties.map(getPropertyId).filter(Boolean) : []);
      const saved = saveComparePropertyIds(serverIds);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bricklytics_compare_updated'));
      }
      return saved;
    }
  } catch (e) {
    console.warn('Failed to sync compare selection with backend:', e);
  }
  return getComparePropertyIds();
}

/**
 * Toggles a property ID in the comparison list and syncs with backend database.
 * Returns { ids, isSelected, limitReached, invalid }
 */
export async function toggleComparePropertyId(propertyOrId) {
  const id = getPropertyId(propertyOrId);
  if (!id) {
    return {
      ids: getComparePropertyIds(),
      isSelected: false,
      limitReached: false,
      invalid: true,
    };
  }

  const currentIds = getComparePropertyIds();
  const isAlreadySelected = currentIds.includes(id);
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  if (isAlreadySelected) {
    const nextIds = currentIds.filter((currentId) => currentId !== id);
    saveComparePropertyIds(nextIds);
    if (token) {
      try {
        await buyerApi.removeFromCompare(id);
      } catch (e) {
        console.error('Error removing compare property from backend:', e);
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bricklytics_compare_updated'));
    }
    return { ids: nextIds, isSelected: false, limitReached: false, invalid: false };
  }

  if (currentIds.length >= MAX_PROPERTIES) {
    return { ids: currentIds, isSelected: false, limitReached: true, invalid: false };
  }

  const nextIds = [...currentIds, id];
  saveComparePropertyIds(nextIds);
  if (token) {
    try {
      await buyerApi.addToCompare(id);
    } catch (e) {
      console.error('Error adding compare property to backend:', e);
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bricklytics_compare_updated'));
  }
  return { ids: nextIds, isSelected: true, limitReached: false, invalid: false };
}

/**
 * Checks if a property ID is currently selected for comparison.
 */
export function isComparePropertySelected(propertyOrId) {
  const id = getPropertyId(propertyOrId);
  if (!id) return false;
  return getComparePropertyIds().includes(id);
}

/**
 * Adds a property ID to comparison list if limit not reached and saves to DB.
 */
export async function addComparePropertyId(propertyOrId) {
  const id = getPropertyId(propertyOrId);
  if (!id) return getComparePropertyIds();
  const current = getComparePropertyIds().filter((cId) => cId !== id);
  if (current.length >= MAX_PROPERTIES) return current;

  const next = saveComparePropertyIds([...current, id]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    try {
      await buyerApi.addToCompare(id);
    } catch (e) {
      console.error('Error adding compare property to backend:', e);
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bricklytics_compare_updated'));
  }
  return next;
}

/**
 * Removes a property ID from comparison list and DB.
 */
export async function removeComparePropertyId(propertyOrId) {
  const id = getPropertyId(propertyOrId);
  if (!id) return getComparePropertyIds();
  const next = saveComparePropertyIds(getComparePropertyIds().filter((cId) => cId !== id));
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    try {
      await buyerApi.removeFromCompare(id);
    } catch (e) {
      console.error('Error removing compare property from backend:', e);
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bricklytics_compare_updated'));
  }
  return next;
}

/**
 * Clears all compare property IDs from frontend AND backend database.
 */
export async function clearCompareSelection() {
  saveComparePropertyIds([]);
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    try {
      await buyerApi.clearCompareList();
    } catch (e) {
      console.error('Error clearing compare list on backend:', e);
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bricklytics_compare_updated'));
  }
}

/**
 * Clears ONLY local frontend cache/state (for logout or switching accounts without modifying DB).
 */
export function clearLocalCompareSelectionOnly() {
  saveComparePropertyIds([]);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bricklytics_compare_updated'));
  }
}
