const Product = require('../models/Product');
const Category = require('../models/Category');
const { asyncHandler, NotFoundError, BadRequestError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// @desc    Get all products with filtering, sorting, pagination
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    sort = '-createdAt',
    category,
    brand,
    minPrice,
    maxPrice,
    rating,
    search,
    featured,
    prime,
    inStock,
  } = req.query;

  // Build query
  const query = { isActive: true, isApproved: true };

  // Category filter
  if (category) {
    const categoryDoc = await Category.findOne({ slug: category });
    if (categoryDoc) {
      query.category = categoryDoc._id;
    } else {
      return res.json({
        success: true,
        count: 0,
        products: [],
        totalPages: 0,
        currentPage: 1,
      });
    }
  }

  // Brand filter
  if (brand) {
    query.brand = { $regex: new RegExp(brand, 'i') };
  }

  // Price filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Rating filter
  if (rating) {
    query.averageRating = { $gte: Number(rating) };
  }

  // Featured filter
  if (featured === 'true') {
    query.isFeatured = true;
  }

  // Prime filter
  if (prime === 'true') {
    query.isPrime = true;
  }

  // In stock filter
  if (inStock === 'true') {
    query.quantity = { $gt: 0 };
  }

  // Search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  // Pagination
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  // Execute query
  const products = await Product.find(query)
    .populate('category', 'name slug')
    .sort(sort)
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

// @desc    Get single product by slug or ID
// @route   GET /api/products/:id
// @access  Public
const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if ID is MongoDB ObjectId or slug
  const query = id.match(/^[0-9a-fA-F]{24}$/) 
    ? { _id: id, isActive: true, isApproved: true }
    : { slug: id, isActive: true, isApproved: true };

  const product = await Product.findOne(query)
    .populate('category', 'name slug')
    .populate('vendor', 'name email vendorInfo');

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Increment view count
  product.views += 1;
  await product.save();

  res.json({
    success: true,
    product,
  });
});

// @desc    Get related products
// @route   GET /api/products/:id/related
// @access  Public
const getRelatedProducts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 6 } = req.query;

  const product = await Product.findById(id);
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const relatedProducts = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
    isActive: true,
    isApproved: true,
  })
    .limit(parseInt(limit, 10))
    .populate('category', 'name slug');

  res.json({
    success: true,
    count: relatedProducts.length,
    products: relatedProducts,
  });
});

// @desc    Get products by category
// @route   GET /api/products/category/:slug
// @access  Public
const getProductsByCategory = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { page = 1, limit = 20, sort = '-createdAt' } = req.query;

  const category = await Category.findOne({ slug });
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const products = await Product.find({
    category: category._id,
    isActive: true,
    isApproved: true,
  })
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  const total = await Product.countDocuments({
    category: category._id,
    isActive: true,
    isApproved: true,
  });

  res.json({
    success: true,
    count: products.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    category,
    products,
  });
});

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
const searchProducts = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;

  if (!q || q.trim() === '') {
    return res.json({
      success: true,
      count: 0,
      products: [],
      totalPages: 0,
      currentPage: 1,
    });
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const searchRegex = new RegExp(q, 'i');

  const products = await Product.find({
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { brand: searchRegex },
      { tags: { $in: [searchRegex] } },
    ],
    isActive: true,
    isApproved: true,
  })
    .populate('category', 'name slug')
    .skip(skip)
    .limit(limitNum);

  const total = await Product.countDocuments({
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { brand: searchRegex },
      { tags: { $in: [searchRegex] } },
    ],
    isActive: true,
    isApproved: true,
  });

  res.json({
    success: true,
    count: products.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    query: q,
    products,
  });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const products = await Product.find({
    isFeatured: true,
    isActive: true,
    isApproved: true,
  })
    .limit(parseInt(limit, 10))
    .populate('category', 'name slug');

  res.json({
    success: true,
    count: products.length,
    products,
  });
});

// @desc    Get deals products (with discount)
// @route   GET /api/products/deals
// @access  Public
const getDealsProducts = asyncHandler(async (req, res) => {
  const { limit = 12 } = req.query;

  const products = await Product.find({
    discountedPrice: { $exists: true, $ne: null, $gt: 0 },
    isActive: true,
    isApproved: true,
  })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit, 10))
    .populate('category', 'name slug');

  res.json({
    success: true,
    count: products.length,
    products,
  });
});

// @desc    Create a product (Vendor/Admin)
// @route   POST /api/products
// @access  Private (Vendor/Admin)
const createProduct = asyncHandler(async (req, res) => {
  const productData = {
    ...req.body,
    vendor: req.user._id,
    isApproved: req.user.role === 'admin' ? true : false,
  };

  // Check if slug already exists
  if (productData.slug) {
    const existingProduct = await Product.findOne({ slug: productData.slug });
    if (existingProduct) {
      throw new BadRequestError('Product with this slug already exists');
    }
  }

  const product = await Product.create(productData);

  logger.logRequest(req, `Product created: ${product.name} by ${req.user.email}`);

  res.status(201).json({
    success: true,
    product,
    message: 'Product created successfully',
  });
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Vendor/Admin)
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  let product = await Product.findById(id);
  
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Check ownership (vendor can edit own products, admin can edit any)
  if (req.user.role !== 'admin' && product.vendor.toString() !== req.user._id.toString()) {
    throw new BadRequestError('You are not authorized to edit this product');
  }

  // If vendor is editing, keep isApproved false
  if (req.user.role !== 'admin') {
    req.body.isApproved = false;
  }

  product = await Product.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  logger.logRequest(req, `Product updated: ${product.name} by ${req.user.email}`);

  res.json({
    success: true,
    product,
    message: 'Product updated successfully',
  });
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Vendor/Admin)
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const product = await Product.findById(id);
  
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Check ownership
  if (req.user.role !== 'admin' && product.vendor.toString() !== req.user._id.toString()) {
    throw new BadRequestError('You are not authorized to delete this product');
  }

  await product.deleteOne();

  logger.logRequest(req, `Product deleted: ${product.name} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Product deleted successfully',
  });
});

// @desc    Add product review
// @route   POST /api/products/:id/reviews
// @access  Private
const addProductReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, title, comment } = req.body;

  const product = await Product.findById(id);
  
  if (!product) {
    throw new NotFoundError('Product not found');
  }

  // Check if user already reviewed
  const alreadyReviewed = product.reviews.some(
    review => review.user.toString() === req.user._id.toString()
  );

  if (alreadyReviewed) {
    throw new BadRequestError('You have already reviewed this product');
  }

  const review = {
    user: req.user._id,
    userName: req.user.name,
    rating: Number(rating),
    title,
    comment,
    isVerifiedPurchase: false, // TODO: Check if user purchased this product
  };

  product.reviews.push(review);
  product.updateRating();
  await product.save();

  res.status(201).json({
    success: true,
    review,
    averageRating: product.averageRating,
    totalReviews: product.totalReviews,
    message: 'Review added successfully',
  });
});

// @desc    Mark review as helpful
// @route   PUT /api/products/reviews/:reviewId/helpful
// @access  Private
const updateReviewHelpful = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  
  // Find product containing this review
  const product = await Product.findOne({ 'reviews._id': reviewId });
  
  if (!product) {
    throw new NotFoundError('Review not found');
  }
  
  const review = product.reviews.id(reviewId);
  if (!review) {
    throw new NotFoundError('Review not found');
  }
  
  review.helpful = (review.helpful || 0) + 1;
  await product.save();
  
  res.json({
    success: true,
    helpful: review.helpful,
    message: 'Thanks for your feedback!',
  });
});

// @desc    Report a review
// @route   POST /api/products/reviews/:reviewId/report
// @access  Private
const reportReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { reason } = req.body;
  
  const product = await Product.findOne({ 'reviews._id': reviewId });
  
  if (!product) {
    throw new NotFoundError('Review not found');
  }
  
  const review = product.reviews.id(reviewId);
  if (!review) {
    throw new NotFoundError('Review not found');
  }
  
  // Add to reported array (you may want to create a separate collection for reports)
  review.reported = review.reported || false;
  review.reportReason = reason;
  review.reportedAt = new Date();
  review.reportedBy = req.user._id;
  review.reported = true;
  
  await product.save();
  
  logger.logRequest(req, `Review ${reviewId} reported by ${req.user.email}`);
  
  res.json({
    success: true,
    message: 'Review reported. Our team will review it shortly.',
  });
});

// @desc    Get product reviews
// @route   GET /api/products/:id/reviews
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const product = await Product.findById(id).select('reviews');

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const start = (pageNum - 1) * limitNum;
  const end = start + limitNum;

  const approvedReviews = product.reviews.filter(r => r.status === 'approved');
  const paginatedReviews = approvedReviews.slice(start, end);
  const total = approvedReviews.length;

  res.json({
    success: true,
    count: paginatedReviews.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    reviews: paginatedReviews,
  });
});

module.exports = {
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
};