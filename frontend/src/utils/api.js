import { API_BASE_URL } from "../config/constants";

/**
 * Fetches a fresh CSRF token from the Django backend.
 * Must be called before every POST request when using session auth.
 */
export const getCsrfToken = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/csrf/`, { credentials: "include" });
    const data = await res.json();
    return data.csrfToken;
  } catch (err) {
    console.error("Failed to fetch CSRF token:", err);
    return "";
  }
};
