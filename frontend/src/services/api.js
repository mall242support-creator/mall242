import axios from 'axios';

// Create axios instance with base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('API_URL from env:', import.meta.env.VITE_API_URL);
console.log('Final API_URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for HTTP-only cookies
});

// Request interceptor to add token (if needed for mobile apps)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors - NO REFRESH LOOP
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 Unauthorized, clear storage and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('temp_auth');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============ AUTH SERVICES ============

export const authService = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },
  
  changePassword: async (passwordData) => {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  },
  
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  
  resetPassword: async (token, password) => {
    const response = await api.put(`/auth/reset-password/${token}`, { password });
    return response.data;
  },
};

// ============ CONTACT SERVICES ============

export const contactService = {
  sendContactForm: async (formData) => {
    const response = await api.post('/contact', formData);
    return response.data;
  },
};

// ============ WISHLIST SERVICES ============

export const wishlistService = {
  getWishlist: async () => {
    const response = await api.get('/wishlist');
    return response.data;
  },
  
  addToWishlist: async (productId) => {
    const response = await api.post('/wishlist/add', { productId });
    return response.data;
  },
  
  removeFromWishlist: async (productId) => {
    const response = await api.delete(`/wishlist/remove/${productId}`);
    return response.data;
  },
  
  moveToCart: async (productId) => {
    const response = await api.post(`/wishlist/move-to-cart/${productId}`);
    return response.data;
  },
  
  clearWishlist: async () => {
    const response = await api.delete('/wishlist/clear');
    return response.data;
  },
};

// ============ PRODUCT SERVICES ============

export const productService = {
  getProducts: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });
    const response = await api.get(`/products?${params.toString()}`);
    return response.data;
  },
  
  getProduct: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  
  getProductsByCategory: async (slug, page = 1, limit = 20) => {
    const response = await api.get(`/products/category/${slug}?page=${page}&limit=${limit}`);
    return response.data;
  },
  
  searchProducts: async (query, page = 1, limit = 20) => {
    const response = await api.get(`/products/search?q=${query}&page=${page}&limit=${limit}`);
    return response.data;
  },
  
  getFeaturedProducts: async (limit = 10) => {
    const response = await api.get(`/products/featured?limit=${limit}`);
    return response.data;
  },
  
  getDealsProducts: async (limit = 12) => {
    const response = await api.get(`/products/deals?limit=${limit}`);
    return response.data;
  },
  
  getRelatedProducts: async (productId, limit = 6) => {
    const response = await api.get(`/products/${productId}/related?limit=${limit}`);
    return response.data;
  },
  
  getReviews: async (productId, page = 1, limit = 10) => {
    const response = await api.get(`/products/${productId}/reviews?page=${page}&limit=${limit}`);
    return response.data;
  },

  addReview: async (productId, reviewData) => {
    const response = await api.post(`/products/${productId}/reviews`, reviewData);
    return response.data;
  },

  markReviewHelpful: async (reviewId) => {
    const response = await api.put(`/products/reviews/${reviewId}/helpful`);
    return response.data;
  },

  reportReview: async (reviewId, reason) => {
    const response = await api.post(`/products/reviews/${reviewId}/report`, { reason });
    return response.data;
  },
};

// ============ CART SERVICES ============

export const cartService = {
  getCart: async (sessionId = null) => {
    const params = sessionId ? `?sessionId=${sessionId}` : '';
    const response = await api.get(`/cart${params}`);
    return response.data;
  },
  
  addToCart: async (productId, quantity = 1, variant = null, sessionId = null) => {
    const response = await api.post('/cart/add', { productId, quantity, variant, sessionId });
    return response.data;
  },
  
  updateCartItem: async (productId, quantity, variant = null, sessionId = null) => {
    const response = await api.put(`/cart/update/${productId}`, { quantity, variant, sessionId });
    return response.data;
  },
  
  removeFromCart: async (productId, variant = null, sessionId = null) => {
    const response = await api.delete(`/cart/remove/${productId}`, { data: { variant, sessionId } });
    return response.data;
  },
  
  clearCart: async (sessionId = null) => {
    const response = await api.delete('/cart/clear', { data: { sessionId } });
    return response.data;
  },
  
  saveForLater: async (productId, variant = null, sessionId = null) => {
    const response = await api.post('/cart/save-for-later', { productId, variant, sessionId });
    return response.data;
  },
  
  moveToCart: async (productId, variant = null, sessionId = null) => {
    const response = await api.post('/cart/move-to-cart', { productId, variant, sessionId });
    return response.data;
  },
  
  applyDiscount: async (discountCode, sessionId = null) => {
    const response = await api.post('/cart/apply-discount', { discountCode, sessionId });
    return response.data;
  },
  
  mergeCart: async (sessionId) => {
    const response = await api.post('/cart/merge', { sessionId });
    return response.data;
  },
};

// ============ ORDER SERVICES ============

export const orderService = {
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },
  
  getUserOrders: async (page = 1, limit = 10, status = null) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    const response = await api.get(`/orders?${params.toString()}`);
    return response.data;
  },
  
  getOrderById: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },
  
  cancelOrder: async (orderId, reason = null) => {
    const response = await api.put(`/orders/${orderId}/cancel`, { reason });
    return response.data;
  },
  
  requestReturn: async (orderId, reason, items = null) => {
    const response = await api.post(`/orders/${orderId}/return`, { reason, items });
    return response.data;
  },
  
  trackOrder: async (orderId) => {
    const response = await api.get(`/orders/track/${orderId}`);
    return response.data;
  },
};

// ============ REFERRAL SERVICES ============

export const referralService = {
  getStats: async () => {
    const response = await api.get('/referrals/stats');
    return response.data;
  },
  
  getHistory: async (page = 1, limit = 20) => {
    const response = await api.get(`/referrals/history?page=${page}&limit=${limit}`);
    return response.data;
  },
  
  getRewards: async () => {
    const response = await api.get('/referrals/rewards');
    return response.data;
  },
  
  claimReward: async (rewardId) => {
    const response = await api.post(`/referrals/claim-reward/${rewardId}`);
    return response.data;
  },
  
  getShareLinks: async () => {
    const response = await api.get('/referrals/share-links');
    return response.data;
  },
  
  getLeaderboard: async (period = 'month', limit = 10) => {
    const response = await api.get(`/referrals/leaderboard?period=${period}&limit=${limit}`);
    return response.data;
  },
  
  trackClick: async (referralCode, source = 'direct') => {
    const response = await api.post('/referrals/track-click', { referralCode, source });
    return response.data;
  },
  
  getRewardTiers: async () => {
    const response = await api.get('/referrals/tiers');
    return response.data;
  },
  
  checkEarlyAccess: async () => {
    const response = await api.get('/referrals/early-access');
    return response.data;
  },
};

// ============ DREAM MALL SERVICES ============

export const dreamMallService = {
  savePreferences: async (preferences) => {
    const response = await api.post('/dream-mall/save', preferences);
    return response.data;
  },
  
  getMyPreferences: async () => {
    const response = await api.get('/dream-mall/my-preferences');
    return response.data;
  },
  
  updatePreferences: async (preferences) => {
    const response = await api.put('/dream-mall/update', preferences);
    return response.data;
  },
  
  getRecommendations: async () => {
    const response = await api.get('/dream-mall/recommendations');
    return response.data;
  },
  
  getQuizCategories: async () => {
    const response = await api.get('/dream-mall/categories');
    return response.data;
  },
  
  getQuizBrands: async () => {
    const response = await api.get('/dream-mall/brands');
    return response.data;
  },

  deletePreferences: async () => {
    const response = await api.delete('/dream-mall/preferences');
    return response.data;
  },
  
  getDealTypes: async () => {
    const response = await api.get('/dream-mall/deal-types');
    return response.data;
  },
};

// ============ MYSTERY DROP SERVICES ============

export const mysteryDropService = {
  getAll: async (isVIP = false) => {
    const response = await api.get(`/mystery-drops?isVIP=${isVIP}`);
    return response.data;
  },
  
  getOne: async (id, isVIP = false) => {
    const response = await api.get(`/mystery-drops/${id}?isVIP=${isVIP}`);
    return response.data;
  },
  
  signup: async (email, mysteryDropId) => {
    const response = await api.post('/mystery-drops/signup', { email, mysteryDropId });
    return response.data;
  },
};

// ============ VENDOR SERVICES ============

export const vendorService = {
  getStats: async () => {
    const response = await api.get('/vendor/dashboard/stats');
    return response.data;
  },
  
  getProducts: async (page = 1, limit = 20, status = null) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    const response = await api.get(`/vendor/products?${params.toString()}`);
    return response.data;
  },
  
  createProduct: async (productData) => {
    const response = await api.post('/vendor/products', productData);
    return response.data;
  },
  
  updateProduct: async (productId, productData) => {
    const response = await api.put(`/vendor/products/${productId}`, productData);
    return response.data;
  },
  
  deleteProduct: async (productId) => {
    const response = await api.delete(`/vendor/products/${productId}`);
    return response.data;
  },
  
  updateInventory: async (updates) => {
    const response = await api.put('/vendor/inventory', { updates });
    return response.data;
  },
  
  getOrders: async (page = 1, limit = 20, status = null) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    const response = await api.get(`/vendor/orders?${params.toString()}`);
    return response.data;
  },
  
  updateOrderItem: async (orderId, itemId, status, trackingNumber = null, trackingCarrier = null) => {
    const response = await api.put(`/vendor/orders/${orderId}/items/${itemId}`, {
      status,
      trackingNumber,
      trackingCarrier,
    });
    return response.data;
  },
  
  getSalesAnalytics: async (period = 'month') => {
    const response = await api.get(`/vendor/analytics/sales?period=${period}`);
    return response.data;
  },
};

// ============ HERO SERVICES ============

export const heroService = {
  getHeroSlides: async () => {
    const response = await api.get('/hero');
    return response.data;
  },
};

// ============ PROMO SERVICES ============

export const promoService = {
  getActivePromo: async () => {
    const response = await api.get('/promo/active');
    return response.data;
  },
};

// ============ ADMIN SERVICES ============

export const adminService = {
  getStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  getAllPromos: async () => {
    const response = await api.get('/admin/promos');
    return response.data;
  },

  createPromo: async (data) => {
    const response = await api.post('/admin/promos', data);
    return response.data;
  },

  updatePromo: async (id, data) => {
    const response = await api.put(`/admin/promos/${id}`, data);
    return response.data;
  },

  deletePromo: async (id) => {
    const response = await api.delete(`/admin/promos/${id}`);
    return response.data;
  },

  getAllMysteryDrops: async () => {
    const response = await api.get('/admin/mystery-drops');
    return response.data;
  },

  createMysteryDrop: async (data) => {
    const response = await api.post('/admin/mystery-drops', data);
    return response.data;
  },

  updateMysteryDrop: async (id, data) => {
    const response = await api.put(`/admin/mystery-drops/${id}`, data);
    return response.data;
  },

  deleteMysteryDrop: async (id) => {
    const response = await api.delete(`/admin/mystery-drops/${id}`);
    return response.data;
  },

  revealMysteryDrop: async (id) => {
    const response = await api.post(`/admin/mystery-drops/${id}/reveal`);
    return response.data;
  },

  getMysteryDropSignups: async (id, page = 1, limit = 50) => {
    const response = await api.get(`/admin/mystery-drops/${id}/signups?page=${page}&limit=${limit}`);
    return response.data;
  },

  getContactMessages: async (page = 1, limit = 20, status = null) => {
    const params = new URLSearchParams({ page, limit });
    if (status && status !== 'all') params.append('status', status);
    const response = await api.get(`/admin/contact?${params.toString()}`);
    return response.data;
  },

  getContactMessage: async (id) => {
    const response = await api.get(`/admin/contact/${id}`);
    return response.data;
  },

  replyToContact: async (id, reply, closeTicket = false) => {
    const response = await api.post(`/admin/contact/${id}/reply`, { reply, closeTicket });
    return response.data;
  },

  deleteContactMessage: async (id) => {
    const response = await api.delete(`/admin/contact/${id}`);
    return response.data;
  },

  getAllHeroSlides: async () => {
    const response = await api.get('/admin/hero');
    return response.data;
  },

  getHeroSlideById: async (id) => {
    const response = await api.get(`/admin/hero/${id}`);
    return response.data;
  },

  createHeroSlide: async (slideData) => {
    const response = await api.post('/admin/hero', slideData);
    return response.data;
  },

  updateHeroSlide: async (id, slideData) => {
    const response = await api.put(`/admin/hero/${id}`, slideData);
    return response.data;
  },

  deleteHeroSlide: async (id) => {
    const response = await api.delete(`/admin/hero/${id}`);
    return response.data;
  },

  reorderHeroSlides: async (slides) => {
    const response = await api.put('/admin/hero/reorder', { slides });
    return response.data;
  },
  
  getUsers: async (page = 1, limit = 20, role = null, search = null) => {
    const params = new URLSearchParams({ page, limit });
    if (role) params.append('role', role);
    if (search) params.append('search', search);
    const response = await api.get(`/admin/users?${params.toString()}`);
    return response.data;
  },
  
  getUser: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },
  
  updateUserRole: async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },
  
  approveVendor: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/approve-vendor`);
    return response.data;
  },
  
  deactivateUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/deactivate`);
    return response.data;
  },
  
  activateUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/activate`);
    return response.data;
  },
  
  getAllProducts: async (page = 1, limit = 20, status = null, vendor = null) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    if (vendor) params.append('vendor', vendor);
    const response = await api.get(`/admin/products?${params.toString()}`);
    return response.data;
  },
  
  createProduct: async (productData) => {
    const response = await api.post('/admin/products', productData);
    return response.data;
  },
  
  updateProduct: async (id, productData) => {
    const response = await api.put(`/admin/products/${id}`, productData);
    return response.data;
  },
  
  deleteProduct: async (id) => {
    const response = await api.delete(`/admin/products/${id}`);
    return response.data;
  },
  
  approveProduct: async (id) => {
    const response = await api.put(`/admin/products/${id}/approve`);
    return response.data;
  },
  
  rejectProduct: async (id, reason) => {
    const response = await api.put(`/admin/products/${id}/reject`, { reason });
    return response.data;
  },
  
  getAllOrders: async (page = 1, limit = 20, status = null, startDate = null, endDate = null) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/admin/orders?${params.toString()}`);
    return response.data;
  },
  
  updateOrderStatus: async (orderId, status, note = '') => {
    const response = await api.put(`/admin/orders/${orderId}/status`, { status, note });
    return response.data;
  },
  
  processRefund: async (orderId, amount, reason) => {
    const response = await api.post(`/admin/orders/${orderId}/refund`, { amount, reason });
    return response.data;
  },
  
  getAllCategories: async () => {
    const response = await api.get('/admin/categories');
    return response.data;
  },
  
  getCategoryById: async (id) => {
    const response = await api.get(`/admin/categories/${id}`);
    return response.data;
  },
  
  createCategory: async (categoryData) => {
    const response = await api.post('/admin/categories', categoryData);
    return response.data;
  },
  
  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/admin/categories/${id}`, categoryData);
    return response.data;
  },
  
  deleteCategory: async (id) => {
    const response = await api.delete(`/admin/categories/${id}`);
    return response.data;
  },
  
  sendBroadcastEmail: async (subject, message, userType, templateId = null) => {
    const response = await api.post('/admin/broadcast/email', {
      subject,
      message,
      userType,
      templateId,
    });
    return response.data;
  },

  getSettings: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  updateSettings: async (settings) => {
    const response = await api.put('/admin/settings', settings);
    return response.data;
  },
  
  getReferralAnalytics: async (period = 'month') => {
    const response = await api.get(`/admin/referrals/analytics?period=${period}`);
    return response.data;
  },
  
  updateRewardTiers: async (tiers) => {
    const response = await api.put('/admin/referrals/tiers', { tiers });
    return response.data;
  },
};

// ============ CATEGORY SERVICES (Public) ============

export const categoryService = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
  
  getOne: async (slug) => {
    const response = await api.get(`/categories/${slug}`);
    return response.data;
  },
};

export default api;