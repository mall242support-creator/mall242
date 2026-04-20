const express = require('express');
const router = express.Router();
const {
  getVendorStats,
  getVendorProducts,
  createVendorProduct,
  updateVendorProduct,
  deleteVendorProduct,
  updateInventory,
  getVendorOrders,
  updateVendorOrderItem,
  getSalesAnalytics,
} = require('../controllers/vendorController');
const { protect, vendorOnly } = require('../middleware/auth');
const { body } = require('express-validator');

// All vendor routes require authentication and vendor role
router.use(protect, vendorOnly);

// Dashboard
router.get('/dashboard/stats', getVendorStats);
router.get('/analytics/sales', getSalesAnalytics);

// Product Management
router.get('/products', getVendorProducts);
router.post('/products', createVendorProduct);
router.put('/products/:id', updateVendorProduct);
router.delete('/products/:id', deleteVendorProduct);
router.put('/inventory', updateInventory);

// Order Management
router.get('/orders', getVendorOrders);
router.put('/orders/:orderId/items/:itemId', updateVendorOrderItem);

module.exports = router;