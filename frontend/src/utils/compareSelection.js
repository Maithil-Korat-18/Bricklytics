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
 * Toggles a property ID in the comparison list.
 * Returns { ids, isSelected, limitReached, invalid }
 */
export function toggleComparePropertyId(propertyOrId) {
  const id = getPropertyId(propertyOrId);
  if (!id) {
    console.error('Invalid property ID provided to toggleComparePropertyId:', propertyOrId);
    return {
      ids: getComparePropertyIds(),
      isSelected: false,
      limitReached: false,
      invalid: true,
    };
  }

  const currentIds = getComparePropertyIds();
  const isAlreadySelected = currentIds.includes(id);

  if (isAlreadySelected) {
    const nextIds = currentIds.filter((currentId) => currentId !== id);
    const saved = saveComparePropertyIds(nextIds);
    return { ids: saved, isSelected: false, limitReached: false, invalid: false };
  }

  if (currentIds.length >= MAX_PROPERTIES) {
    return { ids: currentIds, isSelected: false, limitReached: true, invalid: false };
  }

  const nextIds = [...currentIds, id];
  const saved = saveComparePropertyIds(nextIds);
  return { ids: saved, isSelected: true, limitReached: false, invalid: false };
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
 * Adds a property ID to comparison list if limit not reached.
 */
export function addComparePropertyId(propertyOrId) {
  const id = getPropertyId(propertyOrId);
  if (!id) return getComparePropertyIds();
  const current = getComparePropertyIds().filter((cId) => cId !== id);
  if (current.length >= MAX_PROPERTIES) return current;
  return saveComparePropertyIds([...current, id]);
}

/**
 * Removes a property ID from comparison list.
 */
export function removeComparePropertyId(propertyOrId) {
  const id = getPropertyId(propertyOrId);
  if (!id) return getComparePropertyIds();
  return saveComparePropertyIds(getComparePropertyIds().filter((cId) => cId !== id));
}

/**
 * Clears all compare property IDs from localStorage and triggers update event.
 */
export function clearCompareSelection() {
  saveComparePropertyIds([]);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bricklytics_compare_updated'));
  }
}
