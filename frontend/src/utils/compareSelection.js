const STORAGE_KEY = 'bricklytics_compare_property_ids';
const MAX_PROPERTIES = 8;

const normalizeIds = (ids) => [...new Set((ids || []).map(String).filter(Boolean))].slice(0, MAX_PROPERTIES);


export function getComparePropertyIds() {
  try {
    return normalizeIds(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch {
    return [];
  }
}

export function saveComparePropertyIds(ids) {
  const normalizedIds = normalizeIds(ids);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedIds));
  return normalizedIds;
}

export function addComparePropertyId(propertyId) {
  const id = String(propertyId);
  const current = getComparePropertyIds().filter((currentId) => currentId !== id);
  return saveComparePropertyIds([...current, id]);
}

export function removeComparePropertyId(propertyId) {
  return saveComparePropertyIds(getComparePropertyIds().filter((id) => id !== String(propertyId)));
}

export function isComparePropertySelected(propertyId) {
  return getComparePropertyIds().includes(String(propertyId));
}

export function toggleComparePropertyId(propertyId) {
  const id = String(propertyId);
  const currentIds = getComparePropertyIds();

  if (currentIds.includes(id)) {
    return { ids: saveComparePropertyIds(currentIds.filter((currentId) => currentId !== id)), isSelected: false };
  }

  if (currentIds.length >= MAX_PROPERTIES) {
    return { ids: currentIds, isSelected: false, limitReached: true };
  }

  return { ids: saveComparePropertyIds([...currentIds, id]), isSelected: true };
}
