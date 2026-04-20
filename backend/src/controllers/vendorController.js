const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { asyncHandler, NotFoundError, BadRequestError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// @desc    Get vendor dashboard statistics
// @route   GET /api/vendor/dashboard/stats
// @access  Private (Vendor only)
const getVendorStats = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - 7));
  const startOfMonth = new Date(now.setMonth(now.getMonth() - 1));

  // Product statistics
  const totalProducts = await Product.countDocuments({ vendor: vendorId });
  const activeProducts = await Product.countDocuments({ vendor: vendorId, isActive: true });
  const outOfStockProducts = await Product.countDocuments({ vendor: vendorId, quantity: 0, isActive: true });
  const lowStockProducts = await Product.countDocuments({ vendor: vendorId, quantity: { $lt: 10 }, quantity: { $gt: 0 }, isActive: true });
  const pendingApprovalProducts = await Product.countDocuments({ vendor: vendorId, isApproved: false });

  // Order statistics
  const orders = await Order.find({ 'items.vendor': vendorId });
  
  let totalOrders = 0;
  let pendingOrders = 0;
  let processingOrders = 0;
  let shippedOrders = 0;
  let deliveredOrders = 0;
  let cancelledOrders = 0;
  let totalRevenue = 0;
  let revenueThisWeek = 0;
  let revenueThisMonth = 0;

  for (const order of orders) {
    const vendorItems = order.items.filter(item => item.vendor.toString() === vendorId.toString());
    const orderTotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    totalOrders++;
    totalRevenue += orderTotal;
    
    if (order.createdAt >= startOfWeek) revenueThisWeek += orderTotal;
    if (order.createdAt >= startOfMonth) revenueThisMonth += orderTotal;
    
    switch (order.status) {
      case 'pending': pendingOrders++; break;
      case 'processing': processingOrders++; break;
      case 'shipped': shippedOrders++; break;
      case 'delivered': deliveredOrders++; break;
      case 'cancelled': cancelledOrders++; break;
    }
  }

  // Recent orders
  const recentOrders = await Order.find({ 'items.vendor': vendorId })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(10);

  // Format recent orders with vendor-specific items
  const formattedRecentOrders = recentOrders.map(order => {
    const vendorItems = order.items.filter(item => item.vendor.toString() === vendorId.toString());
    return {
      _id: order._id,
      orderNumber: order.orderNumber,
      user: order.user,
      items: vendorItems,
      total: vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: order.status,
      createdAt: order.createdAt,
    };
  });

  // Recent products
  const recentProducts = await Product.find({ vendor: vendorId })
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({
    success: true,
    stats: {
      products: {
        total: totalProducts,
        active: activeProducts,
        outOfStock: outOfStockProducts,
        lowStock: lowStockProducts,
        pendingApproval: pendingApprovalProducts,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      revenue: {
        total: totalRevenue,
        thisWeek: revenueThisWeek,
        thisMonth: revenueThisMonth,
      },
      recentOrders: formattedRecentOrders,
      recentProducts,
    },
  });
});

// @desc    Get vendor products
// @route   GET /api/vendor/products
// @access  Private (Vendor only)
const getVendorProducts = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;
  const { page = 1, limit = 20, status } = req.query;
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const query = { vendor: vendorId };
  if (status === 'active') query.isActive = true;
  if (status === 'inactive') query.isActive = false;
  if (status === 'pending') query.isApproved = false;

  const products = await Product.find(query)
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Product.countDocuments(query);

  res.json({
    success: true,
    count: products.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    products,
  });
});

// @desc    Create product (vendor)
// @route   POST /api/vendor/products
// @access  Private (Vendor only)
const createVendorProduct = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;
  
  const productData = {
    ...req.body,
    vendor: vendorId,
    isApproved: false, // Products need admin approval
  };

  // Check if slug already exists
  if (productData.slug) {
    const existingProduct = await Product.findOne({ slug: productData.slug });
    if (existingProduct) {
      throw new BadRequestError('Product with this slug already exists');
    }
  }

  const product = await Product.create(productData);

  logger.logRequest(req, `Product created by vendor ${req.user.email}: ${product.name}`);

  res.status(201).json({
    success: true,
    message: 'Product created successfully. Waiting for admin approval.',
    product,
  });
});

// @desc    Update product (vendor)
// @route   PUT /api/vendor/products/:id
// @access  Private (Vendor only)
const updateVendorProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.user._id;
  
  const product = await Product.findById(id);
  
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  if (product.vendor.toString() !== vendorId.toString()) {
    throw new BadRequestError('You are not authorized to edit this product');
  }
  
  // Reset approval status when product is updated
  const updateData = {
    ...req.body,
    isApproved: false,
  };
  
  const updated = await Product.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  
  logger.logRequest(req, `Product updated by vendor ${req.user.email}: ${updated.name}`);
  
  res.json({
    success: true,
    message: 'Product updated successfully. Changes require admin approval.',
    product: updated,
  });
});

// @desc    Delete product (vendor)
// @route   DELETE /api/vendor/products/:id
// @access  Private (Vendor only)
const deleteVendorProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.user._id;
  
  const product = await Product.findById(id);
  
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  if (product.vendor.toString() !== vendorId.toString()) {
    throw new BadRequestError('You are not authorized to delete this product');
  }
  
  await product.deleteOne();
  
  logger.logRequest(req, `Product deleted by vendor ${req.user.email}: ${product.name}`);
  
  res.json({
    success: true,
    message: 'Product deleted successfully',
  });
});

// @desc    Update inventory (bulk)
// @route   PUT /api/vendor/inventory
// @access  Private (Vendor only)
const updateInventory = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;
  const { updates } = req.body; // Array of { productId, quantity }
  
  if (!updates || !Array.isArray(updates)) {
    throw new BadRequestError('Invalid updates format');
  }
  
  const results = [];
  
  for (const update of updates) {
    const product = await Product.findOne({ _id: update.productId, vendor: vendorId });
    
    if (product) {
      product.quantity = update.quantity;
      await product.save();
      results.push({ productId: update.productId, success: true, name: product.name });
    } else {
      results.push({ productId: update.productId, success: false, error: 'Product not found or unauthorized' });
    }
  }
  
  logger.logRequest(req, `Inventory updated by vendor ${req.user.email}: ${results.length} products`);
  
  res.json({
    success: true,
    message: 'Inventory updated successfully',
    results,
  });
});

// @desc    Get vendor orders
// @route   GET /api/vendor/orders
// @access  Private (Vendor only)
const getVendorOrders = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;
  const { page = 1, limit = 20, status } = req.query;
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const query = { 'items.vendor': vendorId };
  if (status) query.status = status;

  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  // Filter items for this vendor only
  const formattedOrders = orders.map(order => {
    const vendorItems = order.items.filter(item => item.vendor.toString() === vendorId.toString());
    return {
      _id: order._id,
      orderNumber: order.orderNumber,
      user: order.user,
      items: vendorItems,
      total: vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: order.status,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  });

  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    count: formattedOrders.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    orders: formattedOrders,
  });
});

// @desc    Update order item status (vendor)
// @route   PUT /api/vendor/orders/:orderId/items/:itemId
// @access  Private (Vendor only)
const updateVendorOrderItem = asyncHandler(async (req, res) => {
  const { orderId, itemId } = req.params;
  const { status, trackingNumber, trackingCarrier } = req.body;
  const vendorId = req.user._id;
  
  const order = await Order.findById(orderId);
  
  if (!order) {
    throw new NotFoundError('Order not found');
  }
  
  const item = order.items.id(itemId);
  if (!item) {
    throw new NotFoundError('Order item not found');
  }
  
  if (item.vendor.toString() !== vendorId.toString()) {
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

// @desc    Get sales analytics (vendor)
// @route   GET /api/vendor/analytics/sales
// @access  Private (Vendor only)
const getSalesAnalytics = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;
  const { period = 'month' } = req.query;
  
  let startDate;
  const now = new Date();
  
  if (period === 'week') {
    startDate = new Date(now.setDate(now.getDate() - 7));
  } else if (period === 'month') {
    startDate = new Date(now.setMonth(now.getMonth() - 1));
  } else if (period === 'year') {
    startDate = new Date(now.setFullYear(now.getFullYear() - 1));
  } else {
    startDate = new Date(now.setMonth(now.getMonth() - 1));
  }
  
  // Get all orders with vendor items
  const orders = await Order.find({
    'items.vendor': vendorId,
    createdAt: { $gte: startDate },
  });
  
  // Daily sales aggregation
  const dailySales = {};
  
  for (const order of orders) {
    const vendorItems = order.items.filter(item => item.vendor.toString() === vendorId.toString());
    const orderTotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const dateKey = order.createdAt.toISOString().split('T')[0];
    
    if (!dailySales[dateKey]) {
      dailySales[dateKey] = { date: dateKey, sales: 0, orders: 0 };
    }
    dailySales[dateKey].sales += orderTotal;
    dailySales[dateKey].orders += 1;
  }
  
  // Top selling products
  const productSales = {};
  
  for (const order of orders) {
    for (const item of order.items) {
      if (item.vendor.toString() === vendorId.toString()) {
        if (!productSales[item.product]) {
          productSales[item.product] = {
            productId: item.product,
            name: item.name,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[item.product].quantity += item.quantity;
        productSales[item.product].revenue += item.price * item.quantity;
      }
    }
  }
  
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  
  res.json({
    success: true,
    analytics: {
      period,
      dailySales: Object.values(dailySales).sort((a, b) => a.date.localeCompare(b.date)),
      topProducts,
      summary: {
        totalSales: Object.values(dailySales).reduce((sum, day) => sum + day.sales, 0),
        totalOrders: Object.values(dailySales).reduce((sum, day) => sum + day.orders, 0),
        averageOrderValue: Object.values(dailySales).reduce((sum, day) => sum + day.sales, 0) / Object.values(dailySales).reduce((sum, day) => sum + day.orders, 0) || 0,
      },
    },
  });
});

module.exports = {
  getVendorStats,
  getVendorProducts,
  createVendorProduct,
  updateVendorProduct,
  deleteVendorProduct,
  updateInventory,
  getVendorOrders,
  updateVendorOrderItem,
  getSalesAnalytics,
};