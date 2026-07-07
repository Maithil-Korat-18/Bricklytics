/* ============================================================
   DESIGN TOKENS & APP CONSTANTS
============================================================ */

// Color palette — shared across all components
export const C = {
  bg: "#FAFAF8",
  surface: "#FFFFFF",
  blue: "#3E6FE0",
  purple: "#2A54BE",
  blueGlow: "rgba(62,111,224,0.16)",
  purpleGlow: "rgba(130,94,235,0.12)",
  text: "#14171F",
  border: "rgba(20,23,31,0.10)",
};

// Backend API root
export const API_BASE_URL = "http://localhost:8000/api/v1";

// Onboarding data
export const PROPERTY_TYPES = [
  { key: "apartment", label: "Apartment" },
  { key: "villa", label: "Villa" },
  { key: "plot", label: "Plot" },
  { key: "commercial", label: "Commercial" },
];

export const PRIORITIES = [
  { key: "schools", label: "Schools" },
  { key: "traffic", label: "Traffic" },
  { key: "safety", label: "Safety" },
  { key: "investment", label: "Investment" },
  { key: "hospitals", label: "Hospitals" },
  { key: "transit", label: "Public Transport" },
  { key: "green", label: "Green Spaces" },
];

export function budgetLabel(v) {
  if (v >= 200) return "₹2Cr+";
  if (v >= 100) return `₹${(v / 100).toFixed(2)}Cr`;
  return `₹${v}L`;
}
