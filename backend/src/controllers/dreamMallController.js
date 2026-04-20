const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { asyncHandler, NotFoundError, BadRequestError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// @desc    Save user's dream mall preferences
// @route   POST /api/dream-mall/save
// @access  Private
const saveDreamMallPreferences = asyncHandler(async (req, res) => {
  const { categories, brands, dealTypes, email, saveResults } = req.body;
  const userId = req.user?._id;

  // Validate required fields
  if (!categories || categories.length === 0) {
    throw new BadRequestError('Please select at least one category');
  }

  // Calculate result summary
  const categoryNames = categories.map(cat => {
    const categoryMap = {
      fashion: 'Fashion',
      electronics: 'Electronics',
      furniture: 'Home & Furniture',
      beauty: 'Beauty',
      sports: 'Sports',
      toys: 'Toys',
      books: 'Books',
      food: 'Food & Grocery',
    };
    return categoryMap[cat] || cat;
  });

  // Generate personalized result
  let primaryCategory = '';
  let shopperType = '';
  let percentages = {};

  if (categories.includes('fashion')) primaryCategory = 'Fashion Forward';
  else if (categories.includes('electronics')) primaryCategory = 'Tech Enthusiast';
  else if (categories.includes('furniture')) primaryCategory = 'Home Lover';
  else if (categories.includes('beauty')) primaryCategory = 'Beauty Guru';
  else if (categories.includes('sports')) primaryCategory = 'Active Lifestyle';
  else primaryCategory = 'Trend Explorer';

  if (dealTypes && dealTypes.includes('early_access') && dealTypes.includes('discounts')) {
    shopperType = 'Smart Shopper';
  } else if (dealTypes && dealTypes.includes('early_access')) {
    shopperType = 'Early Adopter';
  } else if (dealTypes && dealTypes.includes('vip_events')) {
    shopperType = 'Experience Seeker';
  } else {
    shopperType = 'Deal Hunter';
  }

  // Calculate percentages
  const totalCategories = categories.length;
  percentages = {
    fashion: categories.includes('fashion') ? Math.floor(40 + Math.random() * 20) : Math.floor(20 + Math.random() * 20),
    electronics: categories.includes('electronics') ? Math.floor(35 + Math.random() * 20) : Math.floor(15 + Math.random() * 20),
    home: categories.includes('furniture') ? Math.floor(30 + Math.random() * 20) : Math.floor(15 + Math.random() * 20),
    other: Math.floor(100 - (percentages.fashion + percentages.electronics + percentages.home)),
  };

  const resultSummary = `Your dream mall is ${percentages.fashion}% fashion, ${percentages.electronics}% electronics, ${percentages.home}% home & furniture`;

  const preferences = {
    categories,
    brands: brands || [],
    dealTypes: dealTypes || [],
    resultSummary,
    completedAt: new Date(),
  };

  // Save to user if logged in
  if (userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    user.dreamMallPreferences = preferences;
    await user.save();

    logger.logRequest(req, `Dream Mall preferences saved for user ${user.email}`);

    return res.json({
      success: true,
      data: {
        preferences,
        result: {
          primaryCategory,
          shopperType,
          percentages,
          message: `Based on your preferences, you're a ${primaryCategory} who loves ${shopperType} deals!`,
          recommendedBrands: brands?.slice(0, 3) || [],
        },
      },
      message: 'Your Dream Mall preferences have been saved!',
    });
  }

  // For guest users, return the result without saving
  if (saveResults && email) {
    // TODO: Send email with results or save to session
    logger.logRequest(req, `Dream Mall quiz completed by guest: ${email}`);
  }

  res.json({
    success: true,
    data: {
      preferences,
      result: {
        primaryCategory,
        shopperType,
        percentages,
        message: `Based on your preferences, you're a ${primaryCategory} who loves ${shopperType} deals!`,
        recommendedBrands: brands?.slice(0, 3) || [],
      },
    },
    message: 'Your Dream Mall has been created! Sign in to save your preferences.',
  });
});

// @desc    Get user's dream mall preferences
// @route   GET /api/dream-mall/my-preferences
// @access  Private
const getMyDreamMall = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('dreamMallPreferences');

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    data: user.dreamMallPreferences || null,
  });
});

// @desc    Update dream mall preferences
// @route   PUT /api/dream-mall/update
// @access  Private
const updateDreamMallPreferences = asyncHandler(async (req, res) => {
  const { categories, brands, dealTypes } = req.body;
  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Update existing preferences or create new
  const currentPrefs = user.dreamMallPreferences || {};
  
  if (categories) currentPrefs.categories = categories;
  if (brands) currentPrefs.brands = brands;
  if (dealTypes) currentPrefs.dealTypes = dealTypes;
  currentPrefs.completedAt = new Date();

  // Regenerate result summary
  if (categories) {
    const categoryNames = categories.map(cat => {
      const categoryMap = {
        fashion: 'Fashion',
        electronics: 'Electronics',
        furniture: 'Home & Furniture',
        beauty: 'Beauty',
        sports: 'Sports',
        toys: 'Toys',
        books: 'Books',
        food: 'Food & Grocery',
      };
      return categoryMap[cat] || cat;
    });
    currentPrefs.resultSummary = `Your dream mall features: ${categoryNames.join(', ')}`;
  }

  user.dreamMallPreferences = currentPrefs;
  await user.save();

  logger.logRequest(req, `Dream Mall preferences updated for user ${user.email}`);

  res.json({
    success: true,
    data: user.dreamMallPreferences,
    message: 'Dream Mall preferences updated successfully',
  });
});

// @desc    Get personalized recommendations based on dream mall
// @route   GET /api/dream-mall/recommendations
// @access  Private
const getPersonalizedRecommendations = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('dreamMallPreferences');
  const { limit = 12 } = req.query;

  if (!user.dreamMallPreferences || !user.dreamMallPreferences.categories) {
    // Return default recommendations
    const defaultProducts = await Product.find({ isActive: true, isApproved: true })
      .limit(parseInt(limit, 10))
      .populate('category', 'name slug');
    
    return res.json({
      success: true,
      hasPreferences: false,
      products: defaultProducts,
    });
  }

  const { categories } = user.dreamMallPreferences;

  // Get category IDs based on selected categories
  const categoryMap = {
    fashion: ['Clothes', 'Mens Wear', 'Shoes', 'Bags & Luggage'],
    electronics: ['Electronics & Accessories'],
    furniture: ['Furniture'],
    beauty: [], // Add beauty category when available
    sports: ['Bikes'],
    toys: [],
    books: [],
    food: [],
  };

  // Get all category names from user's selections
  let categoryNames = [];
  categories.forEach(cat => {
    if (categoryMap[cat]) {
      categoryNames = [...categoryNames, ...categoryMap[cat]];
    }
  });

  // Find categories in database
  const categoryDocs = await Category.find({ name: { $in: categoryNames } });
  const categoryIds = categoryDocs.map(cat => cat._id);

  // Get personalized products
  let products = [];
  if (categoryIds.length > 0) {
    products = await Product.find({
      category: { $in: categoryIds },
      isActive: true,
      isApproved: true,
    })
      .limit(parseInt(limit, 10))
      .populate('category', 'name slug');
  }

  // If not enough products, fill with featured products
  if (products.length < parseInt(limit, 10)) {
    const remainingLimit = parseInt(limit, 10) - products.length;
    const featuredProducts = await Product.find({
      isFeatured: true,
      isActive: true,
      isApproved: true,
      _id: { $nin: products.map(p => p._id) },
    })
      .limit(remainingLimit)
      .populate('category', 'name slug');
    
    products = [...products, ...featuredProducts];
  }

  res.json({
    success: true,
    hasPreferences: true,
    preferences: user.dreamMallPreferences,
    count: products.length,
    products,
  });
});

// @desc    Get available categories for quiz
// @route   GET /api/dream-mall/categories
// @access  Public
const getQuizCategories = asyncHandler(async (req, res) => {
  const categories = [
    { id: 'fashion', name: 'Fashion', icon: 'bi-handbag', emoji: '👗', color: 'bg-pink-100' },
    { id: 'electronics', name: 'Electronics', icon: 'bi-phone', emoji: '📱', color: 'bg-blue-100' },
    { id: 'furniture', name: 'Furniture', icon: 'bi-house', emoji: '🛋️', color: 'bg-orange-100' },
    { id: 'beauty', name: 'Beauty', icon: 'bi-mirror', emoji: '💄', color: 'bg-purple-100' },
    { id: 'sports', name: 'Sports', icon: 'bi-bicycle', emoji: '🏃', color: 'bg-green-100' },
    { id: 'toys', name: 'Toys', icon: 'bi-toy', emoji: '🧸', color: 'bg-yellow-100' },
    { id: 'books', name: 'Books', icon: 'bi-book', emoji: '📚', color: 'bg-indigo-100' },
    { id: 'food', name: 'Food & Grocery', icon: 'bi-cup-straw', emoji: '🍕', color: 'bg-red-100' },
  ];

  res.json({
    success: true,
    categories,
  });
});

// @desc    Get available brands for quiz
// @route   GET /api/dream-mall/brands
// @access  Public
const getQuizBrands = asyncHandler(async (req, res) => {
  const brands = [
    { id: 'nike', name: 'Nike', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg' },
    { id: 'adidas', name: 'Adidas', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg' },
    { id: 'apple', name: 'Apple', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' },
    { id: 'samsung', name: 'Samsung', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg' },
    { id: 'gucci', name: 'Gucci', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Gucci_Logo.svg' },
    { id: 'zara', name: 'Zara', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg' },
    { id: 'sony', name: 'Sony', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Sony_logo.svg' },
    { id: 'lg', name: 'LG', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/21/LG_logo_%282014-2023%29.svg' },
  ];

  res.json({
    success: true,
    brands,
  });
});

// @desc    Get deal types for quiz
// @route   GET /api/dream-mall/deal-types
// @access  Public
const getDealTypes = asyncHandler(async (req, res) => {
  const dealTypes = [
    { id: 'early_access', name: 'Early Access to Sales', icon: 'bi-clock', description: 'Shop before everyone else' },
    { id: 'discounts', name: 'Exclusive Discounts', icon: 'bi-tag', description: 'Get member-only prices' },
    { id: 'new_arrivals', name: 'New Arrivals Alerts', icon: 'bi-megaphone', description: 'Be first to know' },
    { id: 'vip_events', name: 'VIP Shopping Events', icon: 'bi-gem', description: 'Invite-only events' },
  ];

  res.json({
    success: true,
    dealTypes,
  });
});

// @desc    Delete user's dream mall preferences
// @route   DELETE /api/dream-mall/preferences
// @access  Private
const deleteDreamMallPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  user.dreamMallPreferences = {};
  await user.save();
  
  logger.logRequest(req, `Dream Mall preferences deleted for user ${user.email}`);
  
  res.json({
    success: true,
    message: 'Dream Mall preferences deleted successfully',
  });
});

module.exports = {
  saveDreamMallPreferences,
  getMyDreamMall,
  updateDreamMallPreferences,
  getPersonalizedRecommendations,
  getQuizCategories,
  getQuizBrands,
  getDealTypes,
   deleteDreamMallPreferences,
};