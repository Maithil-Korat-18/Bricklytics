import apiClient from './apiClient';

export const authApi = {
  signup: async (userData) => {
    const response = await apiClient.post('/auth/signup/', userData);
    return response.data;
  },

  verifyEmail: async (data) => {
    const response = await apiClient.post('/auth/verify-email/', data);
    return response.data;
  },

  resendCode: async (data) => {
    const response = await apiClient.post('/auth/resend-code/', data);
    return response.data;
  },

  login: async (credentials) => {
    const response = await apiClient.post('/auth/login/', credentials);
    return response.data;
  },

  forgotPassword: async (data) => {
    const response = await apiClient.post('/auth/forgot-password/', data);
    return response.data;
  },

  resetPassword: async (data) => {
    const response = await apiClient.post('/auth/reset-password/', data);
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me/');
    return response.data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout/');
    } catch {
      // Ignore network errors during logout
    }
  },
};
