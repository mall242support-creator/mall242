const User = require('../models/User');
const Product = require('../models/Product');
const { asyncHandler, NotFoundError, BadRequestError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: 'wishlist.product',
      select: 'name slug price discountedPrice images quantity isPrime averageRating',
    });

  const wishlistItems = user.wishlist.filter(item => item.product !== null);

  res.json({
    success: true,
    count: wishlistItems.length,
    wishlist: wishlistItems,
  });
});

// @desc    Add product to wishlist
// @route   POST /api/wishlist/add
// @access  Private
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const user = await User.findById(req.user._id);
  
  // Check if already in wishlist
  const alreadyInWishlist = user.wishlist.some(
    item => item.product.toString() === productId
  );

  if (alreadyInWishlist) {
    throw new BadRequestError('Product already in wishlist');
  }

  user.wishlist.push({ product: productId });
  await user.save();

  logger.logRequest(req, `Added ${product.name} to wishlist by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Product added to wishlist',
    product: {
      _id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      discountedPrice: product.discountedPrice,
      image: product.images?.[0]?.url,
    },
  });
});

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/remove/:productId
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const user = await User.findById(req.user._id);
  
  const itemIndex = user.wishlist.findIndex(
    item => item.product.toString() === productId
  );

  if (itemIndex === -1) {
    throw new NotFoundError('Product not found in wishlist');
  }

  user.wishlist.splice(itemIndex, 1);
  await user.save();

  logger.logRequest(req, `Removed product from wishlist by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Product removed from wishlist',
  });
});

// @desc    Move product from wishlist to cart
// @route   POST /api/wishlist/move-to-cart/:productId
// @access  Private
const moveToCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const user = await User.findById(req.user._id);
  
  const wishlistItem = user.wishlist.find(
    item => item.product.toString() === productId
  );

  if (!wishlistItem) {
    throw new NotFoundError('Product not found in wishlist');
  }

  // Get or create cart
  let Cart = require('../models/Cart');
  let cart = await Cart.findOne({ user: req.user._id });
  
  if (!cart) {
    cart = new Cart({ user: req.user._id });
  }

  // Add to cart
  const product = await Product.findById(productId);
  if (product) {
    await cart.addItem(product, 1, null);
  }

  // Remove from wishlist
  user.wishlist = user.wishlist.filter(
    item => item.product.toString() !== productId
  );
  await user.save();

  logger.logRequest(req, `Moved product from wishlist to cart by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Product moved to cart',
  });
});

// @desc    Clear entire wishlist
// @route   DELETE /api/wishlist/clear
// @access  Private
const clearWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  user.wishlist = [];
  await user.save();

  logger.logRequest(req, `Cleared wishlist by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Wishlist cleared',
  });
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart,
  clearWishlist,
};