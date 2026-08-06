const CLIENT_ID_PATTERN = /^\d{8,}-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/;

export function getGoogleClientId() {
  const value = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
  return CLIENT_ID_PATTERN.test(value) ? value : "";
}

export const GOOGLE_CLIENT_ID = getGoogleClientId();
export const GOOGLE_LOGIN_ENABLED = Boolean(GOOGLE_CLIENT_ID);
