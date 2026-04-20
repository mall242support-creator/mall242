const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { asyncHandler, NotFoundError, BadRequestError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Helper function to get or create cart
const getCart = async (userId, sessionId = null) => {
  let cart = null;
  
  if (userId) {
    // Find cart by user ID
    cart = await Cart.findOne({ user: userId });
  } else if (sessionId) {
    // Find cart by session ID (guest)
    cart = await Cart.findOne({ sessionId });
  }
  
  // Create new cart if doesn't exist
  if (!cart) {
    cart = new Cart();
    if (userId) {
      cart.user = userId;
    } else if (sessionId) {
      cart.sessionId = sessionId;
    }
    await cart.save();
  }
  
  return cart;
};

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private (or Public with sessionId)
const getUserCart = asyncHandler(async (req, res) => {
  const { sessionId } = req.query;
  const userId = req.user?._id;
  
  const cart = await getCart(userId, sessionId);
  
  // Populate product details
  await cart.populate('items.product', 'name slug images price discountedPrice quantity isPrime');
  
  res.json({
    success: true,
    cart: {
      _id: cart._id,
      items: cart.items,
      savedForLater: cart.savedForLater,
      itemCount: cart.itemCount,
      subtotal: cart.subtotal,
      discountAmount: cart.discountAmount,
      discountCode: cart.discountCode,
      total: cart.getTotal(),
    },
  });
});

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private (or Public with sessionId)
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, variant = null, sessionId } = req.body;
  const userId = req.user?._id;
  
  // Validate product
  const product = await Product.findOne({ 
    _id: productId, 
    isActive: true, 
    isApproved: true 
  });
  
  if (!product) {
    throw new NotFoundError('Product not found');
  }
  
  if (product.quantity < quantity) {
    throw new BadRequestError(`Only ${product.quantity} items available in stock`);
  }
  
  // Get or create cart
  const cart = await getCart(userId, sessionId);
  
  // Add item to cart
  await cart.addItem(product, quantity, variant);
  
  // Log cart addition
  logger.logRequest(req, `Added ${quantity} x ${product.name} to cart`, {
    productId,
    userId: userId || 'guest',
    cartId: cart._id,
  });
  
  res.json({
    success: true,
    message: 'Item added to cart successfully',
    cart: {
      _id: cart._id,
      itemCount: cart.itemCount,
      subtotal: cart.subtotal,
      total: cart.getTotal(),
    },
  });
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/update/:productId
// @access  Private (or Public with sessionId)
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity, variant, sessionId } = req.body;
  const userId = req.user?._id;
  
  if (!quantity || quantity < 0) {
    throw new BadRequestError('Valid quantity is required');
  }
  
  // Get cart
  const cart = await getCart(userId, sessionId);
  
  // Update quantity
  await cart.updateQuantity(productId, quantity, variant);
  
  // Recalculate totals
  await cart.save();
  
  res.json({
    success: true,
    message: quantity === 0 ? 'Item removed from cart' : 'Cart updated successfully',
    cart: {
      _id: cart._id,
      itemCount: cart.itemCount,
      subtotal: cart.subtotal,
      total: cart.getTotal(),
    },
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:productId
// @access  Private (or Public with sessionId)
const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { variant, sessionId } = req.body;
  const userId = req.user?._id;
  
  // Get cart
  const cart = await getCart(userId, sessionId);
  
  // Remove item
  await cart.removeItem(productId, variant);
  
  res.json({
    success: true,
    message: 'Item removed from cart',
    cart: {
      _id: cart._id,
      itemCount: cart.itemCount,
      subtotal: cart.subtotal,
      total: cart.getTotal(),
    },
  });
});

// @desc    Clear entire cart
// @route   DELETE /api/cart/clear
// @access  Private (or Public with sessionId)
const clearCart = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user?._id;
  
  // Get cart
  const cart = await getCart(userId, sessionId);
  
  // Clear cart
  await cart.clearCart();
  
  res.json({
    success: true,
    message: 'Cart cleared successfully',
  });
});

// @desc    Move item to saved for later
// @route   POST /api/cart/save-for-later
// @access  Private (or Public with sessionId)
const saveForLater = asyncHandler(async (req, res) => {
  const { productId, variant, sessionId } = req.body;
  const userId = req.user?._id;
  
  // Get cart
  const cart = await getCart(userId, sessionId);
  
  // Find the item to move
  const itemIndex = cart.items.findIndex(item => {
    if (item.product.toString() !== productId) return false;
    if (!variant && !item.variant?.name) return true;
    if (variant && item.variant?.name === variant.name && item.variant?.value === variant.value) return true;
    return false;
  });
  
  if (itemIndex === -1) {
    throw new NotFoundError('Item not found in cart');
  }
  
  const [removedItem] = cart.items.splice(itemIndex, 1);
  
  // Add to saved for later
  cart.savedForLater.push({
    product: removedItem.product,
    name: removedItem.name,
    image: removedItem.image,
    price: removedItem.price,
    variant: removedItem.variant,
  });
  
  await cart.save();
  
  res.json({
    success: true,
    message: 'Item moved to saved for later',
    cart: {
      _id: cart._id,
      itemCount: cart.itemCount,
      subtotal: cart.subtotal,
      total: cart.getTotal(),
    },
  });
});

// @desc    Move item from saved for later to cart
// @route   POST /api/cart/move-to-cart
// @access  Private (or Public with sessionId)
const moveToCart = asyncHandler(async (req, res) => {
  const { productId, variant, sessionId } = req.body;
  const userId = req.user?._id;
  
  // Get cart
  const cart = await getCart(userId, sessionId);
  
  // Find the saved item
  const savedIndex = cart.savedForLater.findIndex(item => {
    if (item.product.toString() !== productId) return false;
    if (!variant && !item.variant?.name) return true;
    if (variant && item.variant?.name === variant.name && item.variant?.value === variant.value) return true;
    return false;
  });
  
  if (savedIndex === -1) {
    throw new NotFoundError('Item not found in saved for later');
  }
  
  const [movedItem] = cart.savedForLater.splice(savedIndex, 1);
  
  // Get product details for price update
  const product = await Product.findById(productId);
  if (product) {
    movedItem.price = product.discountedPrice || product.price;
  }
  
  // Add to cart items
  cart.items.push({
    product: movedItem.product,
    name: movedItem.name,
    image: movedItem.image,
    price: movedItem.price,
    quantity: 1,
    variant: movedItem.variant,
  });
  
  await cart.save();
  
  res.json({
    success: true,
    message: 'Item moved to cart',
    cart: {
      _id: cart._id,
      itemCount: cart.itemCount,
      subtotal: cart.subtotal,
      total: cart.getTotal(),
    },
  });
});

// @desc    Apply discount code
// @route   POST /api/cart/apply-discount
// @access  Private (or Public with sessionId)
const applyDiscount = asyncHandler(async (req, res) => {
  const { discountCode, sessionId } = req.body;
  const userId = req.user?._id;
  
  // TODO: Implement discount code validation from database
  const validDiscounts = {
    'VIP2024': { amount: 10, type: 'percentage' },
    'WELCOME15': { amount: 15, type: 'percentage' },
    'FREESHIP': { amount: 0, type: 'free_shipping' },
  };
  
  const discount = validDiscounts[discountCode?.toUpperCase()];
  
  if (!discount) {
    throw new BadRequestError('Invalid discount code');
  }
  
  // Get cart
  const cart = await getCart(userId, sessionId);
  
  let discountAmount = 0;
  if (discount.type === 'percentage') {
    discountAmount = (cart.subtotal * discount.amount) / 100;
  }
  
  await cart.applyDiscount(discountCode, discountAmount);
  
  res.json({
    success: true,
    message: 'Discount applied successfully',
    cart: {
      _id: cart._id,
      subtotal: cart.subtotal,
      discountAmount: cart.discountAmount,
      discountCode: cart.discountCode,
      total: cart.getTotal(),
    },
  });
});

// @desc    Merge guest cart with user cart after login
// @route   POST /api/cart/merge
// @access  Private
const mergeCart = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user._id;
  
  if (!sessionId) {
    return res.json({ success: true, message: 'No guest cart to merge' });
  }
  
  // Get guest cart
  const guestCart = await Cart.findOne({ sessionId });
  
  if (!guestCart || guestCart.items.length === 0) {
    return res.json({ success: true, message: 'No items to merge' });
  }
  
  // Get or create user cart
  let userCart = await Cart.findOne({ user: userId });
  
  if (!userCart) {
    userCart = new Cart({ user: userId });
    await userCart.save();
  }
  
  // Merge items from guest cart to user cart
  for (const guestItem of guestCart.items) {
    const existingItem = userCart.items.find(item => 
      item.product.toString() === guestItem.product.toString() &&
      JSON.stringify(item.variant) === JSON.stringify(guestItem.variant)
    );
    
    if (existingItem) {
      existingItem.quantity += guestItem.quantity;
    } else {
      userCart.items.push(guestItem);
    }
  }
  
  await userCart.save();
  
  // Delete guest cart
  await guestCart.deleteOne();
  
  res.json({
    success: true,
    message: 'Cart merged successfully',
    cart: {
      _id: userCart._id,
      itemCount: userCart.itemCount,
      subtotal: userCart.subtotal,
      total: userCart.getTotal(),
    },
  });
});

module.exports = {
  getUserCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  saveForLater,
  moveToCart,
  applyDiscount,
  mergeCart,
};