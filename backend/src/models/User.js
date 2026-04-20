const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Address sub-schema
const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  island: { 
    type: String, 
    required: true, 
    enum: ['New Providence', 'Grand Bahama', 'Abaco', 'Eleuthera', 'Exuma', 'Long Island', 'Andros', 'Cat Island'] 
  },
  postalCode: { type: String, required: true },
  phone: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

// Dream Mall Preferences sub-schema
const dreamMallPreferencesSchema = new mongoose.Schema({
  categories: [{ type: String, enum: ['fashion', 'electronics', 'furniture', 'beauty', 'sports', 'toys', 'books', 'food'] }],
  brands: [String],
  dealTypes: [{ type: String, enum: ['early_access', 'discounts', 'new_arrivals', 'vip_events'] }],
  resultSummary: String,
  completedAt: Date,
}, { timestamps: true });

// User Schema - NO VIRTUALS that reference other models
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'vendor', 'admin'],
    default: 'user',
  },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Referral System
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  referralCount: { type: Number, default: 0 },
  rewardTier: { type: Number, default: 0 },
  vipStatus: { type: Boolean, default: false },
  earlyAccessGranted: { type: Boolean, default: false },
  
  // Addresses
  addresses: [addressSchema],
  
  // Payment Methods
  paymentMethods: [{
    type: { type: String, enum: ['card', 'paypal', 'bank'], default: 'card' },
    last4: String,
    brand: String,
    expiryMonth: Number,
    expiryYear: Number,
    isDefault: { type: Boolean, default: false },
  }],
  
  // Dream Mall Preferences
  dreamMallPreferences: dreamMallPreferencesSchema,
  
  // Wishlist
  wishlist: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    addedAt: { type: Date, default: Date.now },
  }],
  
  // Vendor specific fields
  vendorInfo: {
    businessName: String,
    businessRegistration: String,
    businessLicense: String,
    taxId: String,
    businessPhone: String,
    businessEmail: String,
    businessAddress: String,
    description: String,
    isApproved: { type: Boolean, default: false },
    approvedAt: Date,
    rejectionReason: String,
  },
  
  // Preferences
  preferences: {
    newsletter: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: true },
    orderUpdates: { type: Boolean, default: true },
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'BSD' },
  },
  
  lastLogin: Date,
  lastActive: Date,
  
}, { timestamps: true });

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate unique referral code
userSchema.methods.generateReferralCode = function() {
  const prefix = this.name.substring(0, 3).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${random}`;
};

// Update reward tier
userSchema.methods.updateRewardTier = function() {
  const counts = this.referralCount;
  let newTier = 0;
  if (counts >= 10) newTier = 4;
  else if (counts >= 5) newTier = 3;
  else if (counts >= 3) newTier = 2;
  else if (counts >= 1) newTier = 1;
  
  if (newTier !== this.rewardTier) {
    this.rewardTier = newTier;
    if (newTier >= 4) this.vipStatus = true;
    if (newTier >= 1) this.earlyAccessGranted = true;
    return true;
  }
  return false;
};

module.exports = mongoose.model('User', userSchema);