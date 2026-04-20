const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');

// Import admin controller functions
const {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUserRole,
  approveVendor,
  deactivateUser,
  activateUser,
  getAllProductsAdmin,
  approveProduct,
  rejectProduct,
  getAllOrders,
  updateOrderStatus,
  processRefund,
  sendBroadcastEmail,
  getReferralAnalytics,
  updateRewardTiers,
  getSettings,
  updateSettings,
  deleteUser,
  forceDeleteUser,
} = require('../controllers/adminController');

// Import category controller functions
const {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategoriesAdmin,
  getCategoryById,
} = require('../controllers/categoryController');

// Import hero controller functions
const {
  getAllHeroSlides,
  getHeroSlideById,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  reorderHeroSlides,
} = require('../controllers/heroController');

// Import contact controller functions
const {
  getContactMessages,
  getContactMessage,
  replyToContact,
  deleteContactMessage,
} = require('../controllers/contactController');

// Import mystery drop controller functions
const {
  getAllMysteryDropsAdmin,
  createMysteryDropAdmin,
  updateMysteryDropAdmin,
  deleteMysteryDropAdmin,
  revealMysteryDropAdmin,
  getMysteryDropSignupsAdmin,
  exportMysteryDropSignups,
} = require('../controllers/mysteryDropController');

// Import promo controller functions
const {
  getAllPromos,
  createPromo,
  updatePromo,
  deletePromo,
} = require('../controllers/promoController');

// All admin routes require authentication and admin role
router.use(protect, adminOnly);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// User Management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/approve-vendor', approveVendor);
router.put('/users/:id/deactivate', deactivateUser);
router.put('/users/:id/activate', activateUser);

// Product Management
router.get('/products', getAllProductsAdmin);
router.put('/products/:id/approve', approveProduct);
router.put('/products/:id/reject', rejectProduct);

// Order Management
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.post('/orders/:id/refund', processRefund);

// Category Management
router.get('/categories', getAllCategoriesAdmin);
router.get('/categories/:id', getCategoryById);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Hero Banner Management
router.get('/hero', getAllHeroSlides);
router.get('/hero/:id', getHeroSlideById);
router.post('/hero', createHeroSlide);
router.put('/hero/:id', updateHeroSlide);
router.delete('/hero/:id', deleteHeroSlide);
router.put('/hero/reorder', reorderHeroSlides);

// Contact Management
router.get('/contact', getContactMessages);
router.get('/contact/:id', getContactMessage);
router.post('/contact/:id/reply', replyToContact);
router.delete('/contact/:id', deleteContactMessage);

// Mystery Drop Management
router.get('/mystery-drops', getAllMysteryDropsAdmin);
router.post('/mystery-drops', createMysteryDropAdmin);
router.put('/mystery-drops/:id', updateMysteryDropAdmin);
router.delete('/mystery-drops/:id', deleteMysteryDropAdmin);
router.post('/mystery-drops/:id/reveal', revealMysteryDropAdmin);
router.get('/mystery-drops/:id/signups', getMysteryDropSignupsAdmin);
router.get('/mystery-drops/:id/export', exportMysteryDropSignups);

// Promo Popup Management
router.get('/promos', getAllPromos);
router.post('/promos', createPromo);
router.put('/promos/:id', updatePromo);
router.delete('/promos/:id', deletePromo);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Broadcast
router.post('/broadcast/email', sendBroadcastEmail);

// Referral System
router.get('/referrals/analytics', getReferralAnalytics);
router.put('/referrals/tiers', updateRewardTiers);

router.delete('/users/:id', deleteUser);
router.delete('/users/:id/force', forceDeleteUser);

module.exports = router;