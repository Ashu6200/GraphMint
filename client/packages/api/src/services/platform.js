import { http, setAuthToken } from '../client.js';
import { ENDPOINTS } from '../endpoints.js';

export const platformApi = {
  /**
   * Health check for platform microservice
   */
  getHealth: () => http.get(ENDPOINTS.PLATFORM.HEALTH),

  /**
   * Authentication
   */
  login: async (credentials) => {
    const response = await http.post(ENDPOINTS.PLATFORM.AUTH.LOGIN, credentials);
    if (response?.data?.token || response?.token) {
      setAuthToken(response?.data?.token || response?.token);
    }
    return response;
  },
  register: async (userData) => {
    const response = await http.post(ENDPOINTS.PLATFORM.AUTH.REGISTER, userData);
    if (response?.data?.token || response?.token) {
      setAuthToken(response?.data?.token || response?.token);
    }
    return response;
  },
  logout: async () => {
    try {
      await http.post(ENDPOINTS.PLATFORM.AUTH.LOGOUT);
    } finally {
      setAuthToken(null);
    }
  },
  getCurrentUser: () => http.get(ENDPOINTS.PLATFORM.AUTH.ME),

  /**
   * Users & Organizations
   */
  getUsers: (params) => http.get(ENDPOINTS.PLATFORM.USERS, { params }),
  getSettings: () => http.get(ENDPOINTS.PLATFORM.SETTINGS),
  updateSettings: (data) => http.put(ENDPOINTS.PLATFORM.SETTINGS, data),
  getOrganizations: () => http.get(ENDPOINTS.PLATFORM.ORGANIZATIONS),
};
