const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  getRelatedProducts,
  getProductsByCategory,
  searchProducts,
  getFeaturedProducts,
  getDealsProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
  getProductReviews,
  updateReviewHelpful,
  reportReview,
} = require('../controllers/productController');
const { protect, vendorOnly, adminOnly } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation rules
const productValidation = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('price').isNumeric().withMessage('Price must be a number').isFloat({ min: 0 }),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive integer'),
  body('category').notEmpty().withMessage('Category is required'),
  body('description').notEmpty().withMessage('Description is required'),
];

const reviewValidation = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').notEmpty().withMessage('Review comment is required'),
];

// IMPORTANT: Place specific routes BEFORE parameter routes
// Public routes
router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/deals', getDealsProducts);
router.get('/category/:slug', getProductsByCategory);
router.get('/:id/related', getRelatedProducts);
router.get('/:id/reviews', getProductReviews);
// This MUST be last - catches single product by ID or slug
router.get('/:id', getProduct);

// Protected routes (require authentication)
router.use(protect);

// Review routes
router.post('/:id/reviews', reviewValidation, addProductReview);
router.use(protect);
router.post('/:id/reviews', addProductReview);
router.put('/reviews/:reviewId/helpful', updateReviewHelpful);
router.post('/reviews/:reviewId/report', reportReview);

// Vendor/Admin routes
router.post('/', vendorOnly, productValidation, createProduct);
router.put('/:id', vendorOnly, productValidation, updateProduct);
router.delete('/:id', vendorOnly, deleteProduct);

module.exports = router;