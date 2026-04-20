const mongoose = require('mongoose');

// Cart Item Schema
const cartItemSchema = new mongoose.Schema({
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
    default: 1,
  },
  variant: {
    name: String,
    value: String,
    priceAdjustment: {
      type: Number,
      default: 0,
    },
  },
  inStock: {
    type: Boolean,
    default: true,
  },
  maxQuantity: {
    type: Number,
    default: 99,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

// Cart Schema
const cartSchema = new mongoose.Schema({
  // User (null for guest carts)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true,
    index: true,
  },
  
  // Guest cart identifier (for non-logged in users)
  sessionId: {
    type: String,
    sparse: true,
    index: true,
  },
  
  // Cart Items
  items: [cartItemSchema],
  
  // Totals (denormalized for performance)
  itemCount: {
    type: Number,
    default: 0,
  },
  subtotal: {
    type: Number,
    default: 0,
  },
  
  // Applied discounts
  discountCode: String,
  discountAmount: {
    type: Number,
    default: 0,
  },
  
  // Saved for later items
  savedForLater: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    name: String,
    image: String,
    price: Number,
    variant: Object,
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Cart expiration (for guest carts)
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  },
  
  // Last activity
  lastActivity: {
    type: Date,
    default: Date.now,
  },
  
}, {
  timestamps: true,
});

// Index for automatic expiration (TTL index)
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for user/session lookups
cartSchema.index({ user: 1, sessionId: 1 });

// Update item count and subtotal before saving
cartSchema.pre('save', function(next) {
  // Calculate item count
  this.itemCount = this.items.reduce((total, item) => total + item.quantity, 0);
  
  // Calculate subtotal
  this.subtotal = this.items.reduce((total, item) => {
    const itemPrice = item.price + (item.variant?.priceAdjustment || 0);
    return total + (itemPrice * item.quantity);
  }, 0);
  
  // Update last activity
  this.lastActivity = new Date();
  
  next();
});

// Method to add item to cart
cartSchema.methods.addItem = function(product, quantity = 1, variant = null) {
  const existingItemIndex = this.items.findIndex(item => {
    if (item.product.toString() !== product._id.toString()) return false;
    if (!variant && !item.variant?.name) return true;
    if (variant && item.variant?.name === variant.name && item.variant?.value === variant.value) return true;
    return false;
  });
  
  if (existingItemIndex > -1) {
    // Update existing item
    this.items[existingItemIndex].quantity += quantity;
    if (this.items[existingItemIndex].quantity > this.items[existingItemIndex].maxQuantity) {
      this.items[existingItemIndex].quantity = this.items[existingItemIndex].maxQuantity;
    }
  } else {
    // Add new item
    this.items.push({
      product: product._id,
      name: product.name,
      slug: product.slug,
      image: product.mainImage,
      price: variant?.priceAdjustment ? product.price + variant.priceAdjustment : product.price,
      quantity,
      variant: variant || null,
      inStock: product.quantity > 0,
      maxQuantity: product.quantity,
    });
  }
  
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateQuantity = function(productId, quantity, variant = null) {
  const itemIndex = this.items.findIndex(item => {
    if (item.product.toString() !== productId) return false;
    if (!variant && !item.variant?.name) return true;
    if (variant && item.variant?.name === variant.name && item.variant?.value === variant.value) return true;
    return false;
  });
  
  if (itemIndex > -1) {
    if (quantity <= 0) {
      this.items.splice(itemIndex, 1);
    } else {
      this.items[itemIndex].quantity = Math.min(quantity, this.items[itemIndex].maxQuantity);
    }
    return this.save();
  }
  return Promise.reject(new Error('Item not found in cart'));
};

// Method to remove item
cartSchema.methods.removeItem = function(productId, variant = null) {
  this.items = this.items.filter(item => {
    if (item.product.toString() !== productId) return true;
    if (!variant && !item.variant?.name) return false;
    if (variant && item.variant?.name === variant.name && item.variant?.value === variant.value) return false;
    return true;
  });
  
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.discountCode = null;
  this.discountAmount = 0;
  return this.save();
};

// Method to move item to saved for later
cartSchema.methods.moveToSavedForLater = function(productId, variant = null) {
  return this.removeItem(productId, variant).then(() => {
    // Add to saved for later logic here
    return this;
  });
};

// Method to apply discount code
cartSchema.methods.applyDiscount = function(code, amount) {
  this.discountCode = code;
  this.discountAmount = amount;
  return this.save();
};

// Method to get cart total (including discounts)
cartSchema.methods.getTotal = function() {
  return this.subtotal - this.discountAmount;
};

module.exports = mongoose.model('Cart', cartSchema);