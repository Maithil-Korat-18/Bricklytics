export const ROUTES = {
  HOME: '/',
  
  // Auth Routes
  LOGIN: '/login',
  SIGNUP: '/signup',
  VERIFY_EMAIL: '/verify-email',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Buyer Module Routes
  BUYER_BASE: '/buyer',
  BUYER_DASHBOARD: '/buyer/dashboard',
  PROPERTIES: '/properties',
  PROPERTY_DETAILS_BUYER: '/property/:id',
  WISHLIST: '/buyer/wishlist',
  COMPARE: '/buyer/compare',
  SCHEDULE_VISIT: '/buyer/schedule-visit',
  BUYER_PROFILE: '/buyer/profile',

  // Seller Module Routes
  SELLER_BASE: '/seller',
  SELLER_DASHBOARD: '/seller/dashboard',
  ADD_PROPERTY: '/seller/add-property',
  MANAGE_PROPERTIES: '/seller/manage-properties',
  PROPERTY_DETAILS: '/seller/property/:id',
  EDIT_PROPERTY: '/seller/edit-property/:id',
  ANALYTICS: '/seller/analytics',
  SELLER_PROFILE: '/seller/profile',
  
  // Wildcard / 404
  NOT_FOUND: '*',
};

export const getPropertyDetailsPath = (id) => `/property/${id}`;
export const getSellerPropertyDetailsPath = (id) => `/seller/property/${id}`;
export const getEditPropertyPath = (id) => `/seller/edit-property/${id}`;
