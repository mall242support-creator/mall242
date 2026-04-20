import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await api.post('/auth/refresh');
        return api(originalRequest);
      } catch (refreshError) {
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// ============ AUTH SERVICES ============
export const authService = {
  register: (userData) => api.post('/auth/register', userData).then(res => res.data),
  login: (credentials) => api.post('/auth/login', credentials).then(res => res.data),
  logout: () => api.post('/auth/logout').then(res => res.data),
  getMe: () => api.get('/auth/me').then(res => res.data),
  updateProfile: (profileData) => api.put('/auth/profile', profileData).then(res => res.data),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData).then(res => res.data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then(res => res.data),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }).then(res => res.data),
};

// ============ PRODUCT SERVICES ============
export const productService = {
  getProducts: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params.append(key, value); });
    return api.get(`/products?${params.toString()}`).then(res => res.data);
  },
  getProduct: (id) => api.get(`/products/${id}`).then(res => res.data),
  getFeaturedProducts: (limit = 10) => api.get(`/products/featured?limit=${limit}`).then(res => res.data),
  getDealsProducts: (limit = 12) => api.get(`/products/deals?limit=${limit}`).then(res => res.data),
  getRelatedProducts: (productId, limit = 6) => api.get(`/products/${productId}/related?limit=${limit}`).then(res => res.data),
  searchProducts: (query, page = 1, limit = 20) => api.get(`/products/search?q=${query}&page=${page}&limit=${limit}`).then(res => res.data),
  addReview: (productId, reviewData) => api.post(`/products/${productId}/reviews`, reviewData).then(res => res.data),
  getReviews: (productId, page = 1, limit = 10) => api.get(`/products/${productId}/reviews?page=${page}&limit=${limit}`).then(res => res.data),
  markReviewHelpful: (reviewId) => api.put(`/products/reviews/${reviewId}/helpful`).then(res => res.data),
};

// ============ CART SERVICES ============
export const cartService = {
  getCart: (sessionId = null) => api.get(`/cart${sessionId ? `?sessionId=${sessionId}` : ''}`).then(res => res.data),
  addToCart: (productId, quantity = 1, variant = null, sessionId = null) => api.post('/cart/add', { productId, quantity, variant, sessionId }).then(res => res.data),
  updateCartItem: (productId, quantity, variant = null, sessionId = null) => api.put(`/cart/update/${productId}`, { quantity, variant, sessionId }).then(res => res.data),
  removeFromCart: (productId, variant = null, sessionId = null) => api.delete(`/cart/remove/${productId}`, { data: { variant, sessionId } }).then(res => res.data),
  clearCart: (sessionId = null) => api.delete('/cart/clear', { data: { sessionId } }).then(res => res.data),
  saveForLater: (productId, variant = null, sessionId = null) => api.post('/cart/save-for-later', { productId, variant, sessionId }).then(res => res.data),
  moveToCart: (productId, variant = null, sessionId = null) => api.post('/cart/move-to-cart', { productId, variant, sessionId }).then(res => res.data),
  applyDiscount: (discountCode, sessionId = null) => api.post('/cart/apply-discount', { discountCode, sessionId }).then(res => res.data),
  mergeCart: (sessionId) => api.post('/cart/merge', { sessionId }).then(res => res.data),
};

// ============ ORDER SERVICES ============
export const orderService = {
  createOrder: (orderData) => api.post('/orders', orderData).then(res => res.data),
  getUserOrders: (page = 1, limit = 10, status = null) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    return api.get(`/orders?${params.toString()}`).then(res => res.data);
  },
  getOrderById: (orderId) => api.get(`/orders/${orderId}`).then(res => res.data),
  cancelOrder: (orderId, reason = null) => api.put(`/orders/${orderId}/cancel`, { reason }).then(res => res.data),
  requestReturn: (orderId, reason, items = null) => api.post(`/orders/${orderId}/return`, { reason, items }).then(res => res.data),
  trackOrder: (orderId) => api.get(`/orders/track/${orderId}`).then(res => res.data),
};

// ============ REFERRAL SERVICES ============
export const referralService = {
  getStats: () => api.get('/referrals/stats').then(res => res.data),
  getRewards: () => api.get('/referrals/rewards').then(res => res.data),
  getShareLinks: () => api.get('/referrals/share-links').then(res => res.data),
  getLeaderboard: (period = 'month', limit = 10) => api.get(`/referrals/leaderboard?period=${period}&limit=${limit}`).then(res => res.data),
  trackClick: (referralCode, source = 'direct') => api.post('/referrals/track-click', { referralCode, source }).then(res => res.data),
};

// ============ DREAM MALL SERVICES ============
export const dreamMallService = {
  savePreferences: (preferences) => api.post('/dream-mall/save', preferences).then(res => res.data),
  getMyPreferences: () => api.get('/dream-mall/my-preferences').then(res => res.data),
  updatePreferences: (preferences) => api.put('/dream-mall/update', preferences).then(res => res.data),
  getRecommendations: () => api.get('/dream-mall/recommendations').then(res => res.data),
  deletePreferences: () => api.delete('/dream-mall/preferences').then(res => res.data),
};

// ============ MYSTERY DROP SERVICES ============
export const mysteryDropService = {
  getAll: (isVIP = false) => api.get(`/mystery-drops?isVIP=${isVIP}`).then(res => res.data),
  getOne: (id, isVIP = false) => api.get(`/mystery-drops/${id}?isVIP=${isVIP}`).then(res => res.data),
  signup: (email, mysteryDropId) => api.post('/mystery-drops/signup', { email, mysteryDropId }).then(res => res.data),
};

// ============ WISHLIST SERVICES ============
export const wishlistService = {
  getWishlist: () => api.get('/wishlist').then(res => res.data),
  addToWishlist: (productId) => api.post('/wishlist/add', { productId }).then(res => res.data),
  removeFromWishlist: (productId) => api.delete(`/wishlist/remove/${productId}`).then(res => res.data),
  moveToCart: (productId) => api.post(`/wishlist/move-to-cart/${productId}`).then(res => res.data),
  clearWishlist: () => api.delete('/wishlist/clear').then(res => res.data),
};

// ============ CATEGORY SERVICES ============
export const categoryService = {
  getAll: () => api.get('/categories').then(res => res.data),
  getOne: (slug) => api.get(`/categories/${slug}`).then(res => res.data),
};

// ============ HERO SERVICES ============
export const heroService = {
  getHeroSlides: () => api.get('/hero').then(res => res.data),
};

// ============ CONTACT SERVICES ============
export const contactService = {
  sendContactForm: (formData) => api.post('/contact', formData).then(res => res.data),
};

// ============ PROMO SERVICES ============
export const promoService = {
  getActivePromo: () => api.get('/promo/active').then(res => res.data),
};

// ============ ADMIN SERVICES ============
export const adminService = {
  getStats: () => api.get('/admin/dashboard/stats').then(res => res.data),
  getUsers: (page = 1, limit = 20, role = null, search = null) => {
    const params = new URLSearchParams({ page, limit });
    if (role) params.append('role', role);
    if (search) params.append('search', search);
    return api.get(`/admin/users?${params.toString()}`).then(res => res.data);
  },
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }).then(res => res.data),
  deactivateUser: (userId) => api.put(`/admin/users/${userId}/deactivate`).then(res => res.data),
  activateUser: (userId) => api.put(`/admin/users/${userId}/activate`).then(res => res.data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`).then(res => res.data),
  getAllProducts: (page = 1, limit = 20, status = null) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    return api.get(`/admin/products?${params.toString()}`).then(res => res.data);
  },
  getAllOrders: (page = 1, limit = 20, status = null) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    return api.get(`/admin/orders?${params.toString()}`).then(res => res.data);
  },
  updateOrderStatus: (orderId, status, note = '') => api.put(`/admin/orders/${orderId}/status`, { status, note }).then(res => res.data),
  sendBroadcastEmail: (subject, message, userType) => api.post('/admin/broadcast/email', { subject, message, userType }).then(res => res.data),
  getSettings: () => api.get('/admin/settings').then(res => res.data),
  updateSettings: (settings) => api.put('/admin/settings', settings).then(res => res.data),
  getAllHeroSlides: () => api.get('/admin/hero').then(res => res.data),
  createHeroSlide: (slideData) => api.post('/admin/hero', slideData).then(res => res.data),
  updateHeroSlide: (id, slideData) => api.put(`/admin/hero/${id}`, slideData).then(res => res.data),
  deleteHeroSlide: (id) => api.delete(`/admin/hero/${id}`).then(res => res.data),
  getAllCategories: () => api.get('/admin/categories').then(res => res.data),
  createCategory: (categoryData) => api.post('/admin/categories', categoryData).then(res => res.data),
  updateCategory: (id, categoryData) => api.put(`/admin/categories/${id}`, categoryData).then(res => res.data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`).then(res => res.data),
  getContactMessages: (page = 1, limit = 20, status = null) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);
    return api.get(`/admin/contact?${params.toString()}`).then(res => res.data);
  },
  replyToContact: (id, reply, closeTicket = false) => api.post(`/admin/contact/${id}/reply`, { reply, closeTicket }).then(res => res.data),
  getAllMysteryDrops: () => api.get('/admin/mystery-drops').then(res => res.data),
  createMysteryDrop: (data) => api.post('/admin/mystery-drops', data).then(res => res.data),
  updateMysteryDrop: (id, data) => api.put(`/admin/mystery-drops/${id}`, data).then(res => res.data),
  deleteMysteryDrop: (id) => api.delete(`/admin/mystery-drops/${id}`).then(res => res.data),
  revealMysteryDrop: (id) => api.post(`/admin/mystery-drops/${id}/reveal`).then(res => res.data),
  getAllPromos: () => api.get('/admin/promos').then(res => res.data),
  createPromo: (data) => api.post('/admin/promos', data).then(res => res.data),
  updatePromo: (id, data) => api.put(`/admin/promos/${id}`, data).then(res => res.data),
  deletePromo: (id) => api.delete(`/admin/promos/${id}`).then(res => res.data),
  getReferralAnalytics: (period = 'month') => api.get(`/admin/referrals/analytics?period=${period}`).then(res => res.data),
};

export default api;