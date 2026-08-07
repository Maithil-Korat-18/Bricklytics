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

  getScheduledVisits: async () => {
    const response = await apiClient.get('/buyer/schedule-visit/');
    return response.data;
  },

  scheduleVisit: async (data) => {
    const response = await apiClient.post('/buyer/schedule-visit/', data);
    return response.data;
  },

  replyToVisit: async (visitId, message) => {
    const response = await apiClient.post(`/buyer/schedule-visit/${visitId}/reply/`, { message });
    return response.data;
  },

  compareProperties: async (propertyIds) => {
    const response = await apiClient.post('/buyer/compare/', { property_ids: propertyIds });
    return response.data;
  },

  getCompareList: async () => {
    const response = await apiClient.get('/buyer/compare/');
    return response.data;
  },

  addToCompare: async (propertyId) => {
    const response = await apiClient.post('/buyer/compare/', { property_id: propertyId });
    return response.data;
  },

  removeFromCompare: async (propertyId) => {
    const response = await apiClient.delete('/buyer/compare/', { params: { property_id: propertyId } });
    return response.data;
  },

  clearCompareList: async () => {
    const response = await apiClient.delete('/buyer/compare/');
    return response.data;
  },

  syncCompareList: async (propertyIds) => {
    const response = await apiClient.post('/buyer/compare/', { property_ids: propertyIds });
    return response.data;
  },

  getBetterAlternatives: async (propertyId, limit = 3) => {
    const response = await apiClient.get(`/buyer/properties/${propertyId}/alternatives/`, {
      params: { limit },
    });
    return response.data;
  },

  getTopProperties: async (limit = 6, sortBy = '-investment_score') => {
    const response = await apiClient.get('/buyer/top-properties/', {
      params: { limit, sort_by: sortBy },
    });
    return response.data;
  },
};
