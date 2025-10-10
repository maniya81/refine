import dataProviderSimpleRest from "@refinedev/simple-rest";
import axios from "axios";

export const API_BASE_URL = "http://localhost:8000";
export const API_URL = `${API_BASE_URL}/v1`;

/**
 * Get CSRF token from cookie
 */
const getCsrfToken = (): string | null => {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf_access_token') {
      return value;
    }
  }
  return null;
};

// Create axios instance with credentials included for cookie-based auth
const axiosInstance = axios.create({
  withCredentials: true, // Important: include cookies for JWT auth
});

// Add request interceptor to include CSRF token in all requests
axiosInstance.interceptors.request.use((config) => {
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

export const dataProvider = dataProviderSimpleRest(API_URL, axiosInstance);

export const liveProvider = undefined;
