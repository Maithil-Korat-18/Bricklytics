/**
 * Centralized Amenity Normalization Layer for Frontend
 * Converts raw dataset amenity names into standard, user-friendly categories.
 */

const AMENITY_RULES = [
  // 1. Gym / Fitness
  { standard: 'Gym', regex: /\bgym\b|fitness|health club|gymnasium/i },
  
  // 2. Swimming Pool
  { standard: 'Swimming Pool', regex: /\bpool\b|swimming/i },

  // 3. EV Charging
  { standard: 'EV Charging', regex: /\bev\b|electric vehicle|\bcharging\b/i },

  // 4. Children's Play Area
  { standard: "Children's Play Area", regex: /play (area|zone)|kids (play|zone|area)|children/i },

  // 5. Jogging Track
  { standard: 'Jogging Track', regex: /jogging|running track|walking track/i },

  // 6. Community Hall
  { standard: 'Community Hall', regex: /community hall|banquet|club hall|party hall|multipurpose hall/i },

  // 7. Sports Court
  { standard: 'Sports Court', regex: /sports court|basketball|tennis|badminton|squash/i },

  // 8. Elevator
  { standard: 'Elevator', regex: /elevator|\blift\b|passenger lift/i },

  // 9. Garden
  { standard: 'Garden', regex: /garden|lawn|landscape|green area|gazebo/i },

  // 10. Club House
  { standard: 'Club House', regex: /clubhouse|club house|recreation club/i },

  // 11. Parking
  { standard: 'Parking', regex: /parking|covered parking|visitor parking|reserved parking/i },

  // 12. Security
  { standard: 'Security', regex: /security|gated community|security guard/i },

  // 13. CCTV
  { standard: 'CCTV', regex: /cctv|surveillance/i },

  // 14. Power Backup
  { standard: 'Power Backup', regex: /power backup|generator/i },

  // 15. Wi-Fi
  { standard: 'Wi-Fi', regex: /wi-?fi|internet/i },

  // 16. Library
  { standard: 'Library', regex: /library|reading room/i },

  // 17. Indoor Games
  { standard: 'Indoor Games', regex: /indoor games|table tennis|carrom|chess/i },

  // 18. Outdoor Games
  { standard: 'Outdoor Games', regex: /outdoor games|cricket/i },

  // 19. Pet Area
  { standard: 'Pet Area', regex: /pet (area|park)/i },

  // 20. Senior Citizen Area
  { standard: 'Senior Citizen Area', regex: /senior citizen/i },

  // 21. Temple
  { standard: 'Temple', regex: /temple|meditation hall|prayer room/i },

  // 22. Yoga Deck
  { standard: 'Yoga Deck', regex: /yoga/i },

  // 23. Sky Deck
  { standard: 'Sky Deck', regex: /sky deck|rooftop deck/i },

  // 24. Terrace Garden
  { standard: 'Terrace Garden', regex: /terrace garden|rooftop garden|terrace/i },

  // 25. BBQ Area
  { standard: 'BBQ Area', regex: /bbq|barbecue/i },

  // 26. Business Center
  { standard: 'Business Center', regex: /business center|co-working/i },

  // 27. Conference Room
  { standard: 'Conference Room', regex: /conference|meeting room/i },

  // 28. Intercom
  { standard: 'Intercom', regex: /intercom/i },

  // 29. Fire Safety
  { standard: 'Fire Safety', regex: /fire safety|fire fighting/i },

  // 30. Solar Power
  { standard: 'Solar Power', regex: /solar/i },

  // 31. Rain Water Harvesting
  { standard: 'Rain Water Harvesting', regex: /rain water|rainwater/i },
];

/**
 * Normalizes a single raw amenity string or object into a standardized category.
 */
export function normalizeAmenityName(rawInput) {
  if (!rawInput) return '';
  const rawStr = typeof rawInput === 'object' ? (rawInput.name || rawInput.label || '') : String(rawInput);
  const trimmed = rawStr.trim();
  if (!trimmed) return '';

  for (const rule of AMENITY_RULES) {
    if (rule.regex.test(trimmed)) {
      return rule.standard;
    }
  }

  // Fallback: Clean title casing if no exact rule matched
  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Normalizes an array of raw amenities into a deduplicated list of standardized category strings.
 */
export function normalizeAmenities(amenitiesList) {
  if (!Array.isArray(amenitiesList)) return [];

  const set = new Set();
  amenitiesList.forEach((item) => {
    const normalized = normalizeAmenityName(item);
    if (normalized) {
      set.add(normalized);
    }
  });

  return Array.from(set);
}

export default {
  normalizeAmenityName,
  normalizeAmenities,
};
