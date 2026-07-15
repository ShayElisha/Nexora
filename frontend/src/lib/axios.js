import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add request interceptor to ensure cookies are sent
axiosInstance.interceptors.request.use(
  (config) => {
    // Ensure withCredentials is set for all requests
    config.withCredentials = true;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const shouldSkipTokenRefresh = (url = "") =>
  [
    "/auth/me",
    "/auth/refresh",
    "/auth/signup",
    "/auth/login",
    "/auth/forgot-password",
    "/auth/reset-password",
  ].some((path) => url.includes(path));

const isProtectedPath = (pathname = "") =>
  pathname.startsWith("/dashboard") || pathname.startsWith("/employee");

// Add response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config || {};

    // Guests and public auth calls routinely get 401 — do not attempt refresh
    if (
      error.response?.status === 401 &&
      shouldSkipTokenRefresh(originalRequest.url || "")
    ) {
      return Promise.reject(error);
    }

    // If we get a 401 and haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token using axios directly to avoid interceptor loop
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (refreshResponse.data.success) {
          // Retry the original request with new token
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        if (isProtectedPath(window.location.pathname)) {
          console.error("Token refresh failed, redirecting to login");
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
