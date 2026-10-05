import axios from 'axios';

/**
 * Determine API Base URL depending on environment (Next.js, Vite/Electron, or custom)
 */
export function getBaseUrl() {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return 'http://localhost:3000';
}

/**
 * Token manager for client storage
 */
let authToken = null;

export function setAuthToken(token) {
  authToken = token;
  if (typeof window !== 'undefined' && window.localStorage) {
    if (token) {
      localStorage.setItem('graphmint_auth_token', token);
    } else {
      localStorage.removeItem('graphmint_auth_token');
    }
  }
}

export function getAuthToken() {
  if (authToken) return authToken;
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('graphmint_auth_token');
  }
  return null;
}

/**
 * Standardized Axios HTTP Client
 */
export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach Auth Token and Request ID
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['x-client-platform'] = typeof window !== 'undefined' && window.navigator?.userAgent?.includes('Electron')
      ? 'desktop'
      : 'web';
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardize API responses and error structures
apiClient.interceptors.response.use(
  (response) => {
    // Return payload directly if wrapped in standard { data, message, statusCode }
    return response.data;
  },
  (error) => {
    const customError = {
      message: error.response?.data?.message || error.message || 'An unexpected API error occurred',
      statusCode: error.response?.status || 500,
      data: error.response?.data || null,
      isNetworkError: !error.response,
    };
    return Promise.reject(customError);
  }
);

/**
 * Standard HTTP helper methods
 */
export const http = {
  get: (url, config) => apiClient.get(url, config),
  post: (url, data, config) => apiClient.post(url, data, config),
  put: (url, data, config) => apiClient.put(url, data, config),
  patch: (url, data, config) => apiClient.patch(url, data, config),
  delete: (url, config) => apiClient.delete(url, config),
};
