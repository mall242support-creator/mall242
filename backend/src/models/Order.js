const mongoose = require('mongoose');

// Order Item Schema
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  slug: String,
  image: String,
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  variant: {
    name: String,
    value: String,
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending',
  },
  trackingNumber: String,
  trackingCarrier: String,
  trackingUrl: String,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
});

// Shipping Address Schema
const shippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  street: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  island: {
    type: String,
    required: true,
    enum: ['New Providence', 'Grand Bahama', 'Abaco', 'Eleuthera', 'Exuma', 'Long Island', 'Andros', 'Cat Island'],
  },
  postalCode: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: String,
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['card', 'cod', 'paypal', 'bank_transfer', 'digital_wallet'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending',
  },
  transactionId: String,
  paymentId: String,
  payerId: String,
  cardLast4: String,
  cardBrand: String,
  amount: Number,
  refundAmount: Number,
  refundReason: String,
  paidAt: Date,
  refundedAt: Date,
});

// Order Schema
const orderSchema = new mongoose.Schema({
  // Order Identification
  orderNumber: {
    type: String,
    unique: true,
    required: true,
  },
  
  // User
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Guest Checkout
  isGuest: {
    type: Boolean,
    default: false,
  },
  guestEmail: String,
  
  // Items
  items: [orderItemSchema],
  
  // Pricing
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  shippingCost: {
    type: Number,
    required: true,
    default: 0,
  },
  tax: {
    type: Number,
    required: true,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  discountCode: String,
  discountAmount: Number,
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  
  // Shipping
  shippingAddress: shippingAddressSchema,
  shippingMethod: {
    type: String,
    enum: ['standard', 'express', 'vip'],
    default: 'standard',
  },
  estimatedDelivery: Date,
  
  // Payment
  payment: paymentSchema,
  
  // Order Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
  },
  
  // Timeline
  statusHistory: [{
    status: String,
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Tracking
  trackingNumber: String,
  trackingCarrier: String,
  trackingUrl: String,
  
  // Notes
  customerNotes: String,
  adminNotes: String,
  
  // Referral
  referralCode: String,
  referralDiscount: Number,
  
  // VIP
  isVIPOrder: {
    type: Boolean,
    default: false,
  },
  
  // Metadata
  ipAddress: String,
  userAgent: String,
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Generate unique order number
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `MAL-${year}-${(count + 1).toString().padStart(6, '0')}`;
  }
  next();
});

// Add status change to history
orderSchema.methods.addStatusHistory = function(status, note, userId) {
  this.statusHistory.push({
    status,
    note,
    updatedBy: userId,
    timestamp: new Date(),
  });
  this.status = status;
};

// Check if order can be cancelled
orderSchema.methods.canCancel = function() {
  return ['pending', 'processing', 'confirmed'].includes(this.status);
};

// Check if order can be returned
orderSchema.methods.canReturn = function() {
  if (this.status !== 'delivered') return false;
  const daysSinceDelivery = (Date.now() - this.updatedAt) / (1000 * 60 * 60 * 24);
  return daysSinceDelivery <= 30;
};

// Calculate total refund amount
orderSchema.methods.calculateRefundAmount = function() {
  return this.total - (this.payment.refundAmount || 0);
};

// Update order totals
orderSchema.methods.recalculateTotals = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.total = this.subtotal + this.shippingCost + this.tax - this.discount;
  return this.total;
};

module.exports = mongoose.model('Order', orderSchema);