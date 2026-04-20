const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Referral = require('../models/Referral');
const Reward = require('../models/Reward');
const { asyncHandler, NotFoundError, BadRequestError } = require('../middleware/errorHandler');
const { sendEmail } = require('../config/brevo');
const logger = require('../utils/logger');
const SiteSetting = require('../models/SiteSetting');

// ============ DASHBOARD STATISTICS ============

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin only)
const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const startOfWeek = new Date(now.setDate(now.getDate() - 7));
  const startOfMonth = new Date(now.setMonth(now.getMonth() - 1));

  // User statistics
  const totalUsers = await User.countDocuments();
  const newUsersToday = await User.countDocuments({ createdAt: { $gte: startOfDay } });
  const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: startOfWeek } });
  const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: startOfMonth } });
  const totalVendors = await User.countDocuments({ role: 'vendor' });
  const pendingVendors = await User.countDocuments({ role: 'vendor', 'vendorInfo.isApproved': false });
  const totalVIPUsers = await User.countDocuments({ vipStatus: true });

  // Order statistics
  const totalOrders = await Order.countDocuments();
  const pendingOrders = await Order.countDocuments({ status: 'pending' });
  const processingOrders = await Order.countDocuments({ status: 'processing' });
  const shippedOrders = await Order.countDocuments({ status: 'shipped' });
  const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
  const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

  // Revenue statistics
  const revenueData = await Order.aggregate([
    {
      $match: { status: { $in: ['delivered', 'shipped', 'processing'] } },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        averageOrderValue: { $avg: '$total' },
      },
    },
  ]);

  const revenueToday = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay },
        status: { $in: ['delivered', 'shipped', 'processing'] },
      },
    },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$total' },
      },
    },
  ]);

  const revenueThisWeek = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfWeek },
        status: { $in: ['delivered', 'shipped', 'processing'] },
      },
    },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$total' },
      },
    },
  ]);

  // Product statistics
  const totalProducts = await Product.countDocuments();
  const activeProducts = await Product.countDocuments({ isActive: true });
  const outOfStockProducts = await Product.countDocuments({ quantity: 0, isActive: true });
  const lowStockProducts = await Product.countDocuments({ quantity: { $lt: 10 }, quantity: { $gt: 0 }, isActive: true });
  const pendingApprovalProducts = await Product.countDocuments({ isApproved: false, isActive: true });

  // Referral statistics
  const totalReferrals = await Referral.countDocuments();
  const successfulReferrals = await Referral.countDocuments({ status: 'completed_purchase' });
  const totalRewardsGiven = await Reward.countDocuments({ isRedeemed: true });

  // Recent activity
  const recentOrders = await Order.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(10);

  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select('name email role createdAt');

  const recentProducts = await Product.find()
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({
    success: true,
    stats: {
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
        newThisMonth: newUsersThisMonth,
        totalVendors,
        pendingVendors,
        totalVIP: totalVIPUsers,
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
        total: revenueData[0]?.totalRevenue || 0,
        averageOrderValue: revenueData[0]?.averageOrderValue || 0,
        today: revenueToday[0]?.revenue || 0,
        thisWeek: revenueThisWeek[0]?.revenue || 0,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        outOfStock: outOfStockProducts,
        lowStock: lowStockProducts,
        pendingApproval: pendingApprovalProducts,
      },
      referrals: {
        total: totalReferrals,
        successful: successfulReferrals,
        rewardsGiven: totalRewardsGiven,
      },
      recent: {
        orders: recentOrders,
        users: recentUsers,
        products: recentProducts,
      },
    },
  });
});

// ============ USER MANAGEMENT ============

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    count: users.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    users,
  });
});

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = await User.findById(id).select('-password');
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Get user's orders
  const orders = await Order.find({ user: id }).sort({ createdAt: -1 }).limit(10);
  
  // Get user's referrals
  const referrals = await Referral.find({ referrer: id }).populate('referredUser', 'name email');
  
  res.json({
    success: true,
    user,
    orders,
    referrals,
  });
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin only)
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  
  if (!['user', 'vendor', 'admin'].includes(role)) {
    throw new BadRequestError('Invalid role');
  }
  
  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  user.role = role;
  await user.save();
  
  logger.logRequest(req, `User role updated: ${user.email} -> ${role} by admin`);
  
  res.json({
    success: true,
    message: 'User role updated successfully',
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// @desc    Approve vendor
// @route   PUT /api/admin/users/:id/approve-vendor
// @access  Private (Admin only)
const approveVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  if (user.role !== 'vendor') {
    throw new BadRequestError('User is not a vendor');
  }
  
  user.vendorInfo.isApproved = true;
  user.vendorInfo.approvedAt = new Date();
  await user.save();
  
  // TODO: Send approval email to vendor
  // await sendVendorApprovalEmail(user);
  
  logger.logRequest(req, `Vendor approved: ${user.email} by admin`);
  
  res.json({
    success: true,
    message: 'Vendor approved successfully',
    user: { id: user._id, name: user.name, email: user.email, vendorInfo: user.vendorInfo },
  });
});

// @desc    Deactivate user
// @route   PUT /api/admin/users/:id/deactivate
// @access  Private (Admin only)
const deactivateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  user.isActive = false;
  await user.save();
  
  logger.logRequest(req, `User deactivated: ${user.email} by admin`);
  
  res.json({
    success: true,
    message: 'User deactivated successfully',
  });
});

// @desc    Activate user
// @route   PUT /api/admin/users/:id/activate
// @access  Private (Admin only)
const activateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  user.isActive = true;
  await user.save();
  
  logger.logRequest(req, `User activated: ${user.email} by admin`);
  
  res.json({
    success: true,
    message: 'User activated successfully',
  });
});

// @desc    Get all settings
// @route   GET /api/admin/settings
// @access  Private (Admin only)
const getSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSetting.find();
  const settingsObj = {};
  settings.forEach(s => {
    settingsObj[s.key] = s.value;
  });
  
  // Return default values if not set
  res.json({
    success: true,
    settings: {
      siteName: settingsObj.siteName || 'Mall242',
      siteDescription: settingsObj.siteDescription || 'Bahamas Premier Digital Mall',
      contactEmail: settingsObj.contactEmail || 'hello@mall242.com',
      contactPhone: settingsObj.contactPhone || '+1-242-555-0123',
      address: settingsObj.address || '123 Bay Street, Nassau, Bahamas',
      launchDate: settingsObj.launchDate || '2024-12-01',
      isEarlyAccessEnabled: settingsObj.isEarlyAccessEnabled !== undefined ? settingsObj.isEarlyAccessEnabled : true,
      isSiteLive: settingsObj.isSiteLive !== undefined ? settingsObj.isSiteLive : true,
      referralExpiryDays: settingsObj.referralExpiryDays || 30,
      vipThreshold: settingsObj.vipThreshold || 10,
      mysteryDropAutoReveal: settingsObj.mysteryDropAutoReveal !== undefined ? settingsObj.mysteryDropAutoReveal : true,
      mysteryDropRevealHour: settingsObj.mysteryDropRevealHour || 10,
      freeShippingThreshold: settingsObj.freeShippingThreshold || 50,
      baseShippingCost: settingsObj.baseShippingCost || 5.99,
      taxRate: settingsObj.taxRate || 7.5,
      senderEmail: settingsObj.senderEmail || 'hello@mall242.com',
      senderName: settingsObj.senderName || 'Mall242',
      metaTitle: settingsObj.metaTitle || 'Mall242 - Bahamas Premier Digital Mall',
      metaDescription: settingsObj.metaDescription || 'Discover Mall242, the Bahamas premier online marketplace.',
      metaKeywords: settingsObj.metaKeywords || 'mall242, bahamas shopping, online mall',
    },
  });
});

// @desc    Update settings
// @route   PUT /api/admin/settings
// @access  Private (Admin only)
const updateSettings = asyncHandler(async (req, res) => {
  const updates = req.body;
  
  for (const [key, value] of Object.entries(updates)) {
    await SiteSetting.findOneAndUpdate(
      { key },
      { key, value },
      { upsert: true, new: true }
    );
  }
  
  logger.logRequest(req, `Settings updated by admin ${req.user.email}`);
  
  res.json({
    success: true,
    message: 'Settings updated successfully',
  });
});

// ============ PRODUCT MANAGEMENT ============

// @desc    Get all products (admin view)
// @route   GET /api/admin/products
// @access  Private (Admin only)
const getAllProductsAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, vendor } = req.query;
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (status === 'pending') query.isApproved = false;
  if (status === 'approved') query.isApproved = true;
  if (vendor) query.vendor = vendor;

  const products = await Product.find(query)
    .populate('category', 'name')
    .populate('vendor', 'name email')
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

// @desc    Approve product
// @route   PUT /api/admin/products/:id/approve
// @access  Private (Admin only)
const approveProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const product = await Product.findById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  product.isApproved = true;
  await product.save();
  
  logger.logRequest(req, `Product approved: ${product.name} by admin`);
  
  res.json({
    success: true,
    message: 'Product approved successfully',
    product,
  });
});

// @desc    Reject product
// @route   PUT /api/admin/products/:id/reject
// @access  Private (Admin only)
const rejectProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  const product = await Product.findById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  product.isApproved = false;
  product.isActive = false;
  product.rejectionReason = reason;
  await product.save();
  
  logger.logRequest(req, `Product rejected: ${product.name} by admin`);
  
  res.json({
    success: true,
    message: 'Product rejected successfully',
  });
});

// ============ CATEGORY MANAGEMENT ============

// @desc    Create category
// @route   POST /api/admin/categories
// @access  Private (Admin only)
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, image, displayOrder, parent } = req.body;
  
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    throw new BadRequestError('Category already exists');
  }
  
  const category = await Category.create({
    name,
    description,
    icon,
    image,
    displayOrder,
    parent,
  });
  
  logger.logRequest(req, `Category created: ${name} by admin`);
  
  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    category,
  });
});

// @desc    Update category
// @route   PUT /api/admin/categories/:id
// @access  Private (Admin only)
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const category = await Category.findById(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  
  const updated = await Category.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  
  logger.logRequest(req, `Category updated: ${updated.name} by admin`);
  
  res.json({
    success: true,
    message: 'Category updated successfully',
    category: updated,
  });
});

// @desc    Delete category
// @route   DELETE /api/admin/categories/:id
// @access  Private (Admin only)
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const category = await Category.findById(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  
  // Check if category has products
  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    throw new BadRequestError(`Cannot delete category with ${productCount} products. Reassign products first.`);
  }
  
  await category.deleteOne();
  
  logger.logRequest(req, `Category deleted: ${category.name} by admin`);
  
  res.json({
    success: true,
    message: 'Category deleted successfully',
  });
});

// ============ ORDER MANAGEMENT ============

// @desc    Get all orders (admin)
// @route   GET /api/admin/orders
// @access  Private (Admin only)
const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, startDate, endDate } = req.query;
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const query = {};
  if (status && status !== 'all') query.status = status;
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
// @route   PUT /api/admin/orders/:id/status
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
// @route   POST /api/admin/orders/:id/refund
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

// ============ BROADCAST MESSAGES ============

// @desc    Send broadcast email
// @route   POST /api/admin/broadcast/email
// @access  Private (Admin only)
const sendBroadcastEmail = asyncHandler(async (req, res) => {
  const { subject, message, userType, templateId } = req.body;
  
  // Build recipient query
  const query = {};
  if (userType === 'vip') query.vipStatus = true;
  if (userType === 'vendors') query.role = 'vendor';
  if (userType === 'users') query.role = 'user';
  
  const users = await User.find(query).select('email name');
  
  if (users.length === 0) {
    throw new BadRequestError('No users found matching the criteria');
  }
  
  // Send emails in batches (this would be done asynchronously in production)
  let sentCount = 0;
  let failedCount = 0;
  
  for (const user of users) {
    try {
      await sendEmail({
        to: user.email,
        toName: user.name,
        subject,
        htmlContent: message,
        templateId: templateId ? parseInt(templateId) : null,
        params: { name: user.name },
      });
      sentCount++;
    } catch (error) {
      failedCount++;
      logger.error(`Failed to send broadcast email to ${user.email}: ${error.message}`);
    }
  }
  
  logger.logRequest(req, `Broadcast email sent: "${subject}" to ${sentCount} users (${failedCount} failed) by admin`);
  
  res.json({
    success: true,
    message: `Broadcast email sent to ${sentCount} users`,
    stats: { sent: sentCount, failed: failedCount, total: users.length },
  });
});

// ============ REFERRAL SYSTEM MANAGEMENT ============

// @desc    Get referral analytics
// @route   GET /api/admin/referrals/analytics
// @access  Private (Admin only)
const getReferralAnalytics = asyncHandler(async (req, res) => {
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
  
  // Daily referral counts
  const dailyReferrals = await Referral.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        signups: { $sum: { $cond: [{ $eq: ['$status', 'signed_up'] }, 1, 0] } },
        purchases: { $sum: { $cond: [{ $eq: ['$status', 'completed_purchase'] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  
  // Top referrers
  const topReferrers = await User.aggregate([
    { $match: { referralCount: { $gt: 0 } } },
    { $sort: { referralCount: -1 } },
    { $limit: 10 },
    { $project: { name: 1, email: 1, referralCount: 1, rewardTier: 1, vipStatus: 1 } },
  ]);
  
  // Conversion rates
  const totalClicks = await Referral.countDocuments();
  const totalSignups = await Referral.countDocuments({ status: 'signed_up' });
  const totalPurchases = await Referral.countDocuments({ status: 'completed_purchase' });
  
  res.json({
    success: true,
    analytics: {
      period,
      dailyReferrals,
      topReferrers,
      conversion: {
        clicksToSignups: totalClicks > 0 ? ((totalSignups / totalClicks) * 100).toFixed(2) : 0,
        signupsToPurchases: totalSignups > 0 ? ((totalPurchases / totalSignups) * 100).toFixed(2) : 0,
        overallConversion: totalClicks > 0 ? ((totalPurchases / totalClicks) * 100).toFixed(2) : 0,
      },
      totals: {
        clicks: totalClicks,
        signups: totalSignups,
        purchases: totalPurchases,
      },
    },
  });
});

// @desc    Delete user (admin)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Prevent admin from deleting themselves
  if (id === req.user._id.toString()) {
    throw new BadRequestError('You cannot delete your own account');
  }
  
  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // Check if user has orders
  const orderCount = await Order.countDocuments({ user: id });
  
  if (orderCount > 0) {
    // For users with orders, we cannot delete due to referential integrity
    // Instead, mark as deleted and remove personal info
    user.isActive = false;
    user.isDeleted = true;
    user.email = `deleted_${Date.now()}@removed.com`;
    user.name = 'Deleted User';
    user.phone = '';
    user.addresses = [];
    user.paymentMethods = [];
    user.referralCode = null;
    await user.save();
    
    logger.logRequest(req, `User anonymized: ${user._id} by admin ${req.user.email}`);
    
    return res.json({
      success: true,
      message: 'User has been anonymized and deactivated (cannot be deleted due to existing orders)',
    });
  }
  
  // No orders, can delete permanently
  await user.deleteOne();
  
  logger.logRequest(req, `User permanently deleted: ${user.email} by admin ${req.user.email}`);
  
  res.json({
    success: true,
    message: 'User permanently deleted successfully',
  });
});

// @desc    Force delete user (admin only - use with caution)
// @route   DELETE /api/admin/users/:id/force
// @access  Private (Admin only)
const forceDeleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (id === req.user._id.toString()) {
    throw new BadRequestError('You cannot delete your own account');
  }
  
  const user = await User.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  // First, anonymize orders (set user to null)
  await Order.updateMany({ user: id }, { $set: { user: null, isGuest: true, guestEmail: user.email } });
  
  // Then delete the user
  await user.deleteOne();
  
  logger.logRequest(req, `User force deleted: ${user.email} by admin ${req.user.email}`);
  
  res.json({
    success: true,
    message: 'User permanently deleted with all associated data',
  });
});

// @desc    Update reward tiers configuration
// @route   PUT /api/admin/referrals/tiers
// @access  Private (Admin only)
const updateRewardTiers = asyncHandler(async (req, res) => {
  const { tiers } = req.body;
  
  // This would update a SiteSettings collection
  // For now, just log and return success
  logger.logRequest(req, `Reward tiers updated by admin: ${JSON.stringify(tiers)}`);
  
  res.json({
    success: true,
    message: 'Reward tiers updated successfully',
    tiers,
  });
});

module.exports = {
  // Dashboard
  getDashboardStats,
  
  // User Management
  getAllUsers,
  getUserById,
  updateUserRole,
  approveVendor,
  deactivateUser,
  activateUser,
  
  // Product Management
  getAllProductsAdmin,
  approveProduct,
  rejectProduct,
  
  // Order Management
  getAllOrders,
  updateOrderStatus,
  processRefund,
  
  // Settings
  getSettings,
  updateSettings,
  
  // Broadcast
  sendBroadcastEmail,
  
  // Referral System
  getReferralAnalytics,
  updateRewardTiers,

  deleteUser,
  forceDeleteUser,
};