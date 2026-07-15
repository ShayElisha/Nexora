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

const isAuthProbe = (url = "") =>
  url.includes("/auth/me") || url.includes("/auth/refresh");

const isProtectedPath = (pathname = "") =>
  pathname.startsWith("/dashboard") || pathname.startsWith("/employee");

// Add response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config || {};

    // If we get a 401 and haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const authProbe = isAuthProbe(originalRequest.url || "");

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
        // Guests hit /auth/me with no cookies — that is normal, not a logout.
        // Never hard-redirect from public/marketing pages; only from app areas.
        if (!authProbe && isProtectedPath(window.location.pathname)) {
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
