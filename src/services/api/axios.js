import axios from "axios";
import { tokenService } from "../token.service";

// Determine base URL - use HTTP for Capacitor apps to avoid mixed content issues
const getBaseURL = () => {
  // Check if running in Capacitor (native mobile app)
  // Use optional chaining as Capacitor might not be loaded yet
  const isCapacitor =
    typeof window !== "undefined" &&
    (window.Capacitor !== undefined ||
      window.location.protocol === "capacitor:" ||
      window.location.protocol === "ionic:");

  if (isCapacitor) {
    // For Capacitor, always use HTTP (no mixed content restrictions)
    return "http://192.168.1.2:8000/api";
  }

  // For web, use environment variable
  return import.meta.env.VITE_API_BASE_URL;
};

// Create axios instance with default config
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: import.meta.env.VITE_API_TIMEOUT || 30000,
  headers: {
    "Content-Type": "application/json",
  },
  validateStatus: (status) => {
    // FastAPI returns 422 for validation errors, which we want to handle
    return (status >= 200 && status < 300) || status === 422;
  },
});

// Token refresh state
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add a request interceptor
api.interceptors.request.use(
  async (config) => {
    // Check if token will expire soon and refresh if needed
    if (
      tokenService.willTokenExpireSoon() &&
      !config.url.includes("/refresh") &&
      !config.url.includes("/auth")
    ) {
      try {
        const refreshToken = tokenService.getRefreshToken();
        if (refreshToken) {
          console.log("Proactively refreshing token...");
          const response = await api.post("/employees/refresh", {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token } = response.data;
          tokenService.setTokens(access_token, refresh_token);
          console.log("Token refreshed successfully");
        }
      } catch (error) {
        console.error("Token refresh failed:", error);
        // Don't clear tokens here, let the response interceptor handle it
      }
    }

    // Add token to request
    const token = tokenService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Request to:", config.url, "with token");
    } else {
      console.log("Request to:", config.url, "without token");
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const { response } = error;

    // Handle 401 with token refresh
    if (response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        try {
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = tokenService.getRefreshToken();
        console.log("Attempting to refresh token on 401 error...");
        if (!refreshToken) {
          console.error("No refresh token available");
          throw new Error("No refresh token available");
        }

        console.log("Calling /employees/refresh endpoint");
        const response = await api.post("/employees/refresh", {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data;
        tokenService.setTokens(access_token, refresh_token);
        console.log("Token refresh successful on 401");

        processQueue(null, access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed on 401:", refreshError);
        processQueue(refreshError, null);
        tokenService.clearTokens();
        console.log("Redirecting to login...");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Return error to be handled by components
    // Components will display appropriate toast messages
    return Promise.reject(error);
  }
);

export { api };
export default api;
