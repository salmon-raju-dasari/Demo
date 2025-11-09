import api from "./axios";
import { tokenService } from "../token.service";

export const authService = {
  login: async ({ email, password, role }) => {
    const response = await api.post("/users/auth", {
      email: email, // your backend expects email
      password,
      role,
    });

    const { access_token, refresh_token } = response.data;

    // Store both tokens
    tokenService.setTokens(access_token, refresh_token);

    return { user: { email: email, role } };
  },

  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post("/users/refresh", {
        refresh_token: refreshToken,
      });

      const { access_token, refresh_token } = response.data;
      tokenService.setTokens(access_token, refresh_token);

      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  },
  register: async (userData) => {
    // Your backend expects a specific format
    const response = await api.post("/users", {
      email: userData.email,
      username: userData.username,
      password: userData.password,
      full_name: userData.fullName || "",
      role: userData.role || "user",
    });

    return response.data;
  },
  logout: () => {
    // Your backend doesn't have a logout endpoint yet, so we'll just clear tokens
    tokenService.clearTokens();
  },
  getCurrentUser: async () => {
    if (!tokenService.isTokenValid()) {
      throw new Error("No valid token");
    }
    // Decode the token to get user ID, then fetch user details
    const token = tokenService.getAccessToken();
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.sub;

    const response = await api.get(`/users/${userId}`);
    return response.data;
  }, // Check if user is authenticated
  isAuthenticated: () => {
    return tokenService.isTokenValid();
  },
};
