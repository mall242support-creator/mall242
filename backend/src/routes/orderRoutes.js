const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  requestReturn,
  trackOrder,
  getVendorOrders,
  updateOrderItemStatus,
  getAllOrders,
  updateOrderStatus,
  processRefund,
} = require('../controllers/orderController');
const { protect, vendorOnly, adminOnly } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation rules
const createOrderValidation = [
  body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
  body('shippingAddress.fullName').notEmpty().withMessage('Full name is required'),
  body('shippingAddress.street').notEmpty().withMessage('Street address is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.island').notEmpty().withMessage('Island is required'),
  body('shippingAddress.postalCode').notEmpty().withMessage('Postal code is required'),
  body('shippingAddress.phone').notEmpty().withMessage('Phone number is required'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required'),
  body('total').isNumeric().withMessage('Total must be a number'),
];

const cancelOrderValidation = [
  body('reason').optional().isString(),
];

const returnRequestValidation = [
  body('reason').notEmpty().withMessage('Return reason is required'),
];

const updateOrderItemValidation = [
  body('status').isIn(['processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  body('trackingNumber').optional().isString(),
  body('trackingCarrier').optional().isString(),
];

const updateOrderStatusValidation = [
  body('status').isIn(['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded']).withMessage('Invalid status'),
  body('note').optional().isString(),
];

const refundValidation = [
  body('amount').optional().isNumeric(),
  body('reason').optional().isString(),
];

// User routes
router.use(protect);
router.post('/', createOrderValidation, createOrder);
router.get('/', getUserOrders);
router.get('/track/:id', trackOrder);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrderValidation, cancelOrder);
router.post('/:id/return', returnRequestValidation, requestReturn);

// Vendor routes
router.get('/vendor/orders', vendorOnly, getVendorOrders);
router.put('/vendor/:orderId/items/:itemId', vendorOnly, updateOrderItemValidation, updateOrderItemStatus);

// Admin routes
router.get('/admin/all', adminOnly, getAllOrders);
router.put('/admin/:id/status', adminOnly, updateOrderStatusValidation, updateOrderStatus);
router.post('/admin/:id/refund', adminOnly, refundValidation, processRefund);

module.exports = router;