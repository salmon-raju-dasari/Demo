import api from "./axios";
import { tokenService } from "../token.service";

export const authService = {
  login: async ({ user_id, password }) => {
    const response = await api.post("/employees/auth", {
      user_id: user_id,
      password,
    });

    // Check for error responses (401, 400, etc.)
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(response.data?.detail || "Login failed");
    }

    const { access_token, refresh_token } = response.data;

    if (!access_token || !refresh_token) {
      throw new Error("Invalid response from server");
    }

    // Store both tokens
    tokenService.setTokens(access_token, refresh_token);

    // Decode token to get user role
    const payload = JSON.parse(atob(access_token.split(".")[1]));
    const userRole = payload.role;
    const empId = payload.sub;

    return { user: { user_id: user_id, role: userRole, emp_id: empId } };
  },

  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post("/employees/refresh", {
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
    // Register as employee
    const response = await api.post("/employees/register", {
      name: userData.fullName || userData.name,
      email: userData.email,
      phone_number: userData.phoneNumber || "",
      password: userData.password,
      role: userData.role || "employee",
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
    // Decode the token to get employee ID, then fetch employee details
    const token = tokenService.getAccessToken();
    const payload = JSON.parse(atob(token.split(".")[1]));
    const empId = payload.sub;
    const userRole = payload.role;

    const response = await api.get(`/employees/${empId}`);
    return { ...response.data, role: userRole };
  }, // Check if user is authenticated
  isAuthenticated: () => {
    return tokenService.isTokenValid();
  },
};
