// Token storage keys
const TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// Helper to decode JWT
const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

export const tokenService = {
  // Get tokens
  getAccessToken: () => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),

  // Set tokens
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  // Clear tokens and all localStorage
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    // Clear all localStorage on logout/expiry
    localStorage.clear();
  },

  // Get user role from token
  getUserRole: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    const payload = decodeToken(token);
    return payload?.role || null;
  },

  // Check if token exists and is not expired
  isTokenValid: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;

    const payload = decodeToken(token);
    if (!payload) return false;

    // Check if token is expired
    return payload.exp * 1000 > Date.now();
  },

  // Check if token will expire soon (within next 5 minutes)
  willTokenExpireSoon: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return true;

    const payload = decodeToken(token);
    if (!payload) return true;

    // Check if token will expire in next 5 minutes
    return payload.exp * 1000 < Date.now() + 5 * 60 * 1000;
  },
};
