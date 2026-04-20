const express = require('express');
const router = express.Router();
const {
  getUserCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  saveForLater,
  moveToCart,
  applyDiscount,
  mergeCart,
} = require('../controllers/cartController');
const { protect, optionalAuth } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation rules
const addToCartValidation = [
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('sessionId').optional().isString(),
];

const updateCartValidation = [
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive number'),
  body('sessionId').optional().isString(),
];

const discountValidation = [
  body('discountCode').notEmpty().withMessage('Discount code is required'),
  body('sessionId').optional().isString(),
];

const mergeCartValidation = [
  body('sessionId').notEmpty().withMessage('Session ID is required'),
];

// Public routes (with optional auth for guest carts)
router.get('/', optionalAuth, getUserCart);
router.post('/add', optionalAuth, addToCartValidation, addToCart);
router.put('/update/:productId', optionalAuth, updateCartValidation, updateCartItem);
router.delete('/remove/:productId', optionalAuth, removeFromCart);
router.delete('/clear', optionalAuth, clearCart);
router.post('/save-for-later', optionalAuth, saveForLater);
router.post('/move-to-cart', optionalAuth, moveToCart);
router.post('/apply-discount', optionalAuth, discountValidation, applyDiscount);

// Protected routes (require authentication)
router.use(protect);
router.post('/merge', mergeCartValidation, mergeCart);

module.exports = router;