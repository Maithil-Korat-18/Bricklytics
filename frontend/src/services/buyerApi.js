import apiClient from './apiClient';

export const buyerApi = {
  getDashboard: async () => {
    const response = await apiClient.get('/buyer/dashboard/');
    return response.data;
  },

  getProperties: async (params = {}) => {
    const response = await apiClient.get('/buyer/properties/', { params });
    return response.data;
  },

  getPropertyById: async (id) => {
    const response = await apiClient.get(`/buyer/properties/${id}/`);
    return response.data;
  },

  getWishlist: async () => {
    const response = await apiClient.get('/buyer/wishlist/');
    return response.data;
  },

  toggleWishlist: async (propertyId) => {
    const response = await apiClient.post('/buyer/wishlist/', { property_id: propertyId });
    return response.data;
  },

  deleteWishlist: async (propertyId) => {
    const response = await apiClient.delete(`/buyer/wishlist/${propertyId}/`);
    return response.data;
  },

  getSavedSearches: async () => {
    const response = await apiClient.get('/buyer/saved-searches/');
    return response.data;
  },

  saveSearch: async (data) => {
    const response = await apiClient.post('/buyer/saved-searches/', data);
    return response.data;
  },

  deleteSavedSearch: async (id) => {
    const response = await apiClient.delete(`/buyer/saved-searches/${id}/`);
    return response.data;
  },

  getScheduledVisits: async () => {
    const response = await apiClient.get('/buyer/schedule-visit/');
    return response.data;
  },

  scheduleVisit: async (data) => {
    const response = await apiClient.post('/buyer/schedule-visit/', data);
    return response.data;
  },

  compareProperties: async (propertyIds) => {
    const response = await apiClient.post('/buyer/compare/', { property_ids: propertyIds });
    return response.data;
  },

  getRecentlyViewed: async () => {
    const response = await apiClient.get('/buyer/recently-viewed/');
    return response.data;
  },
};
