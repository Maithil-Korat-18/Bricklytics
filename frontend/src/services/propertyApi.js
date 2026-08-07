import apiClient from './apiClient';

export const propertyApi = {
  getDashboard: async () => {
    const response = await apiClient.get('/seller/dashboard/');
    return response.data;
  },

  // GET List Properties with filtering, search, sort, pagination
  getProperties: async (params = {}) => {
    const response = await apiClient.get('/seller/properties/', { params });
    return response.data;
  },

  // GET Single Property
  getPropertyById: async (id) => {
    const response = await apiClient.get(`/seller/properties/${id}/`);
    return response.data;
  },

  // POST Create Property
  createProperty: async (propertyData) => {
    const response = await apiClient.post('/seller/properties/', propertyData);
    return response.data;
  },

  // PUT Update Property
  updateProperty: async (id, propertyData) => {
    const response = await apiClient.put(`/seller/properties/${id}/`, propertyData);
    return response.data;
  },

  updatePropertyStatus: async (id, status) => {
    const response = await apiClient.patch(`/seller/properties/${id}/status/`, { status });
    return response.data;
  },

  // DELETE Soft-delete Property
  deleteProperty: async (id) => {
    const response = await apiClient.delete(`/seller/properties/${id}/`);
    return response.data;
  },

  // POST Upload Images
  uploadImages: async (id, imageFiles) => {
    const formData = new FormData();
    imageFiles.forEach((file) => {
      formData.append('images', file);
    });
    const response = await apiClient.post(`/seller/properties/${id}/images/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // DELETE Image
  deleteImage: async (propertyId, imageId) => {
    const response = await apiClient.delete(`/seller/properties/${propertyId}/images/${imageId}/`);
    return response.data;
  },

  // PUT Set Cover Image
  setCoverImage: async (propertyId, imageId) => {
    const response = await apiClient.put(`/seller/properties/${propertyId}/images/${imageId}/cover/`);
    return response.data;
  },

  // POST Upload Brochure PDF
  uploadBrochure: async (propertyId, pdfFile) => {
    const formData = new FormData();
    formData.append('brochure', pdfFile);
    const response = await apiClient.post(`/seller/properties/${propertyId}/brochure/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // ── ML PREDICTION ENDPOINTS ────────────────────────────────────────────────

  predictCondition: async (conditions) => {
    const response = await apiClient.post('/seller/properties/predict-condition/', conditions);
    return response.data;
  },

  getAhmedabadLocations: async () => {
    const response = await apiClient.get('/seller/properties/locations/');
    return response.data;
  },

  predictPrice: async (propertyId) => {
    const response = await apiClient.post(`/seller/properties/${propertyId}/predict-price/`);
    return response.data;
  },

  predictAppreciation: async (propertyId) => {
    const response = await apiClient.post(`/seller/properties/${propertyId}/predict-appreciation/`);
    return response.data;
  },

  getPredictionHistory: async (propertyId) => {
    const response = await apiClient.get(`/seller/properties/${propertyId}/predictions/`);
    return response.data;
  },

  // ── OFFLINE MAP ENDPOINTS ──────────────────────────────────────────────────

  searchMapLocation: async (query) => {
    const response = await apiClient.get('/seller/properties/map/search/', { params: { q: query } });
    return response.data;
  },

  reverseGeocodeMap: async (lat, lon) => {
    const response = await apiClient.get('/seller/properties/map/reverse/', { params: { lat, lon } });
    return response.data;
  },


  // ── ANALYTICS ENDPOINT ─────────────────────────────────────────────────────

  getAnalytics: async () => {
    const response = await apiClient.get('/seller/analytics/');
    return response.data;
  },

  replyToInquiry: async (inquiryId, replyText) => {
    const response = await apiClient.post(`/seller/inquiries/${inquiryId}/reply/`, { reply: replyText });
    return response.data;
  },

  // ── SELLER REQUEST MANAGEMENT & PROFILE ENDPOINTS ─────────────────────────

  getRequests: async () => {
    const response = await apiClient.get('/seller/requests/');
    return response.data;
  },

  manageRequestAction: async (id, action, payload = {}) => {
    const response = await apiClient.post(`/seller/requests/${id}/action/`, { action, ...payload });
    return response.data;
  },

  replyToRequest: async (id, message) => {
    const response = await apiClient.post(`/seller/requests/${id}/reply/`, { message });
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/seller/profile/');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await apiClient.put('/seller/profile/', data);
    return response.data;
  },
};

