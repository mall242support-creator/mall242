const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { asyncHandler, NotFoundError, BadRequestError } = require('../middleware/errorHandler');
const { sendOrderConfirmationEmail } = require('../config/brevo');
const logger = require('../utils/logger');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const {
    shippingAddress,
    paymentMethod,
    items,
    subtotal,
    shippingCost,
    tax,
    discountCode,
    discountAmount,
    total,
    notes,
  } = req.body;

  const user = req.user;

  // Validate required fields
  if (!shippingAddress || !shippingAddress.fullName) {
    throw new BadRequestError('Shipping address is required');
  }
  if (!paymentMethod) {
    throw new BadRequestError('Payment method is required');
  }
  if (!items || items.length === 0) {
    throw new BadRequestError('No items in order');
  }

  // Prepare order items and check stock
  const preparedItems = [];
  for (const item of items) {
    // Get product ID - handle both _id and id formats
    const productId = item.product?._id || item.product || item.id;
    
    if (!productId) {
      throw new BadRequestError(`Product ID missing for item: ${item.name}`);
    }
    
    const product = await Product.findById(productId);
    
    if (!product) {
      throw new NotFoundError(`Product ${item.name} not found`);
    }
    
    if (product.quantity < item.quantity) {
      throw new BadRequestError(`Only ${product.quantity} units of ${product.name} available`);
    }
    
    // Update product stock
    product.quantity -= item.quantity;
    product.sales = (product.sales || 0) + item.quantity;
    await product.save();
    
    preparedItems.push({
      product: product._id,
      name: item.name,
      slug: product.slug,
      image: item.image || product.images?.[0]?.url,
      price: item.price,
      quantity: item.quantity,
      variant: item.variant || null,
      vendor: product.vendor,
      status: 'pending',
    });
  }

  // Generate order number
  const orderNumber = `MAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Create order
  const order = await Order.create({
    orderNumber,
    user: user._id,
    items: preparedItems,
    shippingAddress,
    payment: {
      method: paymentMethod,
      status: 'pending',
    },
    subtotal: subtotal || 0,
    shippingCost: shippingCost || 0,
    tax: tax || 0,
    discount: discountAmount || 0,
    discountCode: discountCode || null,
    total: total || 0,
    customerNotes: notes || null,
    status: 'pending',
    isVIPOrder: user.vipStatus || false,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Add status history
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    status: 'pending',
    note: 'Order placed',
    updatedBy: user._id,
    timestamp: new Date(),
  });
  await order.save();

  // Clear user's cart (you'll need to implement this)
  // await Cart.findOneAndDelete({ user: user._id });

  // Send order confirmation email
  try {
    await sendOrderConfirmationEmail(user, order);
  } catch (emailError) {
    logger.error(`Failed to send order confirmation email: ${emailError.message}`);
    // Don't fail the order if email fails
  }

  logger.logRequest(req, `Order created: ${order.orderNumber} by ${user.email}`);

  res.status(201).json({
    success: true,
    order,
    message: 'Order placed successfully',
  });
});

// @desc    Get user's orders
// @route   GET /api/orders
// @access  Private
const getUserOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const query = { user: req.user._id };
  if (status) {
    query.status = status;
  }

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    count: orders.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    orders,
  });
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const order = await Order.findById(id)
    .populate('user', 'name email')
    .populate('items.product', 'name slug images');

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Check if user owns the order or is admin
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new BadRequestError('Not authorized to view this order');
  }

  res.json({
    success: true,
    order,
  });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  const order = await Order.findById(id);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Check if user owns the order
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new BadRequestError('Not authorized to cancel this order');
  }

  if (!order.canCancel()) {
    throw new BadRequestError('Order cannot be cancelled at this stage');
  }

  // Restore product quantities
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      product.quantity += item.quantity;
      product.sales -= item.quantity;
      await product.save();
    }
  }

  order.status = 'cancelled';
  order.addStatusHistory('cancelled', reason || 'Cancelled by user', req.user._id);
  await order.save();

  logger.logRequest(req, `Order cancelled: ${order.orderNumber} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Order cancelled successfully',
  });
});

// @desc    Request return
// @route   POST /api/orders/:id/return
// @access  Private
const requestReturn = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason, items } = req.body;
  
  const order = await Order.findById(id);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (!order.canReturn()) {
    throw new BadRequestError('Order cannot be returned. Return window may have expired.');
  }

  // Add return request to order (you might want to create a Returns model)
  order.returnRequested = true;
  order.returnReason = reason;
  order.returnItems = items || order.items.map(i => ({ product: i.product, quantity: i.quantity }));
  order.returnRequestedAt = new Date();
  order.addStatusHistory('return_requested', reason, req.user._id);
  await order.save();

  logger.logRequest(req, `Return requested for order: ${order.orderNumber} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Return request submitted successfully',
  });
});

// @desc    Track order
// @route   GET /api/orders/:id/track
// @access  Private
const trackOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const order = await Order.findById(id).select('orderNumber status trackingNumber trackingCarrier trackingUrl estimatedDelivery');

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  res.json({
    success: true,
    tracking: {
      orderNumber: order.orderNumber,
      status: order.status,
      trackingNumber: order.trackingNumber,
      carrier: order.trackingCarrier,
      trackingUrl: order.trackingUrl,
      estimatedDelivery: order.estimatedDelivery,
    },
  });
});

// ============ VENDOR ORDER ROUTES ============

// @desc    Get vendor orders
// @route   GET /api/orders/vendor/orders
// @access  Private (Vendor only)
const getVendorOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const query = { 'items.vendor': req.user._id };
  if (status) {
    query.status = status;
  }

  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  // Filter items for this vendor only
  const filteredOrders = orders.map(order => {
    const vendorItems = order.items.filter(item => item.vendor.toString() === req.user._id.toString());
    return {
      ...order.toObject(),
      items: vendorItems,
      total: vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    };
  });

  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    count: filteredOrders.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    orders: filteredOrders,
  });
});

// @desc    Update order item status (vendor)
// @route   PUT /api/orders/vendor/:orderId/items/:itemId
// @access  Private (Vendor only)
const updateOrderItemStatus = asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;
  const { status, trackingNumber, trackingCarrier } = req.body;
  
  const order = await Order.findById(orderId);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  const item = order.items.id(itemId);
  if (!item) {
    throw new NotFoundError('Order item not found');
  }

  if (item.vendor.toString() !== req.user._id.toString()) {
    throw new BadRequestError('Not authorized to update this item');
  }

  item.status = status;
  if (trackingNumber) {
    item.trackingNumber = trackingNumber;
    item.trackingCarrier = trackingCarrier;
  }
  
  if (status === 'shipped') {
    item.shippedAt = new Date();
  }
  if (status === 'delivered') {
    item.deliveredAt = new Date();
  }

  await order.save();

  // Check if all items are delivered to update order status
  const allItemsDelivered = order.items.every(i => i.status === 'delivered');
  if (allItemsDelivered && order.status !== 'delivered') {
    order.status = 'delivered';
    order.addStatusHistory('delivered', 'All items delivered', req.user._id);
    await order.save();
  }

  logger.logRequest(req, `Order item ${itemId} status updated to ${status} by vendor ${req.user.email}`);

  res.json({
    success: true,
    message: 'Order item status updated',
    item,
  });
});

// ============ ADMIN ORDER ROUTES ============

// @desc    Get all orders (admin)
// @route   GET /api/orders/admin/all
// @access  Private (Admin only)
const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, startDate, endDate } = req.query;
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (status) query.status = status;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Order.countDocuments(query);

  // Calculate statistics
  const stats = await Order.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' },
      },
    },
  ]);

  res.json({
    success: true,
    count: orders.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    orders,
    stats: stats[0] || { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 },
  });
});

// @desc    Update order status (admin)
// @route   PUT /api/orders/admin/:id/status
// @access  Private (Admin only)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note, trackingNumber, trackingCarrier } = req.body;
  
  const order = await Order.findById(id);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  order.status = status;
  if (trackingNumber) {
    order.trackingNumber = trackingNumber;
    order.trackingCarrier = trackingCarrier;
  }
  
  order.addStatusHistory(status, note, req.user._id);
  await order.save();

  logger.logRequest(req, `Order ${order.orderNumber} status updated to ${status} by admin ${req.user.email}`);

  res.json({
    success: true,
    message: 'Order status updated',
    order,
  });
});

// @desc    Process refund (admin)
// @route   POST /api/orders/admin/:id/refund
// @access  Private (Admin only)
const processRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body;
  
  const order = await Order.findById(id);

  if (!order) {
    throw new NotFoundError('Order not found');
  }

  if (order.status !== 'cancelled' && order.status !== 'delivered') {
    throw new BadRequestError('Order cannot be refunded at this stage');
  }

  order.payment.status = 'refunded';
  order.payment.refundAmount = amount || order.total;
  order.payment.refundReason = reason;
  order.payment.refundedAt = new Date();
  order.addStatusHistory('refunded', reason, req.user._id);
  await order.save();

  logger.logRequest(req, `Refund processed for order ${order.orderNumber} by admin ${req.user.email}`);

  res.json({
    success: true,
    message: 'Refund processed successfully',
  });
});

module.exports = {
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
};