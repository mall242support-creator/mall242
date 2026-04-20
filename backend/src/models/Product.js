const mongoose = require('mongoose');

// Variant Schema (for colors, sizes, etc.)
const variantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['color', 'size', 'material', 'style'],
  },
  value: {
    type: String,
    required: true,
  },
  priceAdjustment: {
    type: Number,
    default: 0,
  },
  stock: {
    type: Number,
    default: 0,
  },
  sku: String,
  image: String,
});

// Review Schema
const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: String,
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  title: String,
  comment: {
    type: String,
    required: true,
  },
  images: [String],
  isVerifiedPurchase: {
    type: Boolean,
    default: false,
  },
  helpful: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

// Product Schema
const productSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters'],
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a product description'],
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
  },
  shortDescription: {
    type: String,
    maxlength: [300, 'Short description cannot exceed 300 characters'],
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price cannot be negative'],
  },
  discountedPrice: {
    type: Number,
    min: [0, 'Discounted price cannot be negative'],
  },
  costPrice: {
    type: Number,
    min: [0, 'Cost price cannot be negative'],
  },
  
  // Inventory
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Quantity cannot be negative'],
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
  },
  
  // Categories & Brand
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  brand: {
    type: String,
    trim: true,
  },
  
  // Vendor
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Images
  images: [{
    url: String,
    publicId: String,
    isMain: {
      type: Boolean,
      default: false,
    },
    alt: String,
  }],
  
  // Variants
  variants: [variantSchema],
  
  // Attributes
  attributes: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    material: String,
    color: String,
    size: String,
  },
  
  // Features
  features: [String],
  
  // Shipping
  shipping: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    freeShipping: {
      type: Boolean,
      default: false,
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
  },
  
  // Status Flags
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isPrime: {
    type: Boolean,
    default: false,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  
  // SEO
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
  
  // Statistics
  views: {
    type: Number,
    default: 0,
  },
  sales: {
    type: Number,
    default: 0,
  },
  
  // Reviews
  reviews: [reviewSchema],
  averageRating: {
    type: Number,
    default: 0,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  
  // Tags for search
  tags: [String],
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual for discount percentage
productSchema.virtual('discountPercent').get(function() {
  if (this.discountedPrice && this.discountedPrice < this.price) {
    return Math.round(((this.price - this.discountedPrice) / this.price) * 100);
  }
  return 0;
});

// Virtual for isInStock
productSchema.virtual('isInStock').get(function() {
  return this.quantity > 0;
});

// Virtual for main image
productSchema.virtual('mainImage').get(function() {
  const main = this.images.find(img => img.isMain);
  return main ? main.url : (this.images[0]?.url || '');
});

// Generate slug from name before saving
productSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Update average rating when review is added
productSchema.methods.updateRating = function() {
  const approvedReviews = this.reviews.filter(r => r.status === 'approved');
  const total = approvedReviews.reduce((sum, review) => sum + review.rating, 0);
  this.averageRating = approvedReviews.length > 0 ? total / approvedReviews.length : 0;
  this.totalReviews = approvedReviews.length;
};

// Check if product has variant
productSchema.methods.hasVariants = function() {
  return this.variants && this.variants.length > 0;
};

// Get variant by name and value
productSchema.methods.getVariant = function(name, value) {
  return this.variants.find(v => v.name === name && v.value === value);
};

module.exports = mongoose.model('Product', productSchema);